import COLORS from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";

const CARD_HEIGHT = 560;

export default function OwnerHomeScreen() {
  const width = Dimensions.get("window").width;
  const SIDEBAR_WIDTH = 64;
  const CONTENT_GAP = 4;
  const CONTAINER_PADDING = 16;
  const availableWidth = Math.max(
    320,
    Math.round(width - SIDEBAR_WIDTH - CONTENT_GAP - CONTAINER_PADDING * 2),
  );
  const baseCardWidth = availableWidth;
  const [sliderWidth, setSliderWidth] = useState(0);
  const SPACING = 12;
  const cardWidth = (sliderWidth || baseCardWidth) - SPACING;
  const sliderRef = useRef(null);
  const sidebarRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterMode, setFilterMode] = useState(null);
  const [bedCounts, setBedCounts] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tenantName, setTenantName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [bedNumber, setBedNumber] = useState(1);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [tenants, setTenants] = useState({});
  const [idProofFile, setIdProofFile] = useState("");
  const [idProofUri, setIdProofUri] = useState("");
  const [idPreviewVisible, setIdPreviewVisible] = useState(false);
  const [idPreviewHtml, setIdPreviewHtml] = useState("");
  const [idOpenUri, setIdOpenUri] = useState("");
  const [previewUri, setPreviewUri] = useState("");
  const [showBottomViewId, setShowBottomViewId] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [editAll] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [rowEditIndex, setRowEditIndex] = useState(null);
  const [rowEditValues, setRowEditValues] = useState({});
  const [tenantsExpanded, setTenantsExpanded] = useState(true);
  const onPinchStateChange = (e) => {
    if (e.nativeEvent.state === State.END) {
      setPreviewScale((prev) => Math.min(3, Math.max(1, prev)));
    }
  };
  const floorPulse = useRef(new Animated.Value(0.8)).current;
  const floorScale = floorPulse.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0.99, 1.01],
  });
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floorPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(floorPulse, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floorPulse]);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedRent, setTouchedRent] = useState(false);
  useEffect(() => {
    if (!modalVisible) {
      setIdProofFile("");
      setIdProofUri("");
      setIdPreviewHtml("");
      setIdPreviewVisible(false);
    }
  }, [modalVisible]);
  const makeRooms = (n) =>
    Array.from(
      { length: n === 1 ? 15 : 4 },
      (_, i) => `${n}${String(i + 1).padStart(2, "0")}`,
    );
  const floors = Array.from({ length: 15 }, (_, i) => {
    const floorNumber = i + 1;
    return { floor: `Floor ${floorNumber}`, rooms: makeRooms(floorNumber) };
  });
  const isOccupied = (floorLabel, room) => {
    const key = `${floorLabel}-${room}`;
    const count = bedCounts[key] ?? 0;
    return count > 0;
  };
  const getCount = (floorLabel, room) =>
    bedCounts[`${floorLabel}-${room}`] ?? 0;
  const getTileColor = (floorLabel, room) => {
    const c = getCount(floorLabel, room);
    if (filterMode === "occupied")
      return c >= 4 ? COLORS.SUCCESS : COLORS.WARNING;
    if (filterMode === "empty" && c === 0) return COLORS.ERROR;
    if (filterMode === null && c === 0) return COLORS.PRIMARY_LIGHT;
    if (c === 0) return COLORS.ERROR;
    if (c >= 4) return COLORS.SUCCESS;
    return COLORS.WARNING;
  };
  const snap = cardWidth + SPACING;
  const handleSelectFloor = (idx) => {
    setActiveIndex(idx);
    sliderRef.current?.scrollTo({
      x: idx * (cardWidth + SPACING),
      animated: true,
    });
  };
  useEffect(() => {
    const SIDE_BUTTON_HEIGHT = 40;
    const SIDE_BUTTON_GAP = 8;
    const offset = Math.max(
      0,
      idxToOffset(activeIndex, SIDE_BUTTON_HEIGHT, SIDE_BUTTON_GAP) - 60,
    );
    sidebarRef.current?.scrollTo({ y: offset, animated: true });
  }, [activeIndex]);
  const idxToOffset = (idx, h, g) => idx * (h + g);
  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);
  const occupiedRooms = floors.reduce(
    (sum, f) => sum + f.rooms.filter((r) => isOccupied(f.floor, r)).length,
    0,
  );
  const emptyRooms = totalRooms - occupiedRooms;
  const openTenantModal = (floorLabel, room) => {
    setSelectedFloor(floorLabel);
    setSelectedRoom(room);
    const current = getCount(floorLabel, room);
    setBedNumber(Math.min(4, current + 1));
    setTenantName("");
    setContactNumber("");
    setEmail("");
    setMonthlyRent("");
    setCheckIn("");
    setCheckOut("");
    setIdProofFile("");
    setIdProofUri("");
    setIdPreviewHtml("");
    setIdPreviewVisible(false);
    setTouchedName(false);
    setTouchedPhone(false);
    setTouchedEmail(false);
    setTouchedRent(false);
    setModalVisible(true);
  };
  const isValidName = (name) => /^[A-Za-z\s]+$/.test(name.trim());
  const isValidPhone = (phone) => /^\d{10,11}$/.test(phone.trim());
  const isValidEmail = (mail) =>
    mail.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  const isFormValid = () => {
    return (
      isValidName(tenantName) &&
      isValidPhone(contactNumber) &&
      monthlyRent.trim().length > 0 &&
      idProofFile.trim().length > 0 &&
      isValidEmail(email) &&
      bedNumber >= 1 &&
      bedNumber <= 4
    );
  };
  const addTenant = () => {
    if (!selectedFloor || !selectedRoom) {
      setModalVisible(false);
      return;
    }
    if (!isFormValid()) {
      return;
    }
    const key = `${selectedFloor}-${selectedRoom}`;
    setTenants((prev) => {
      const list = prev[key] ?? [];
      const nextList = [
        ...list,
        {
          name: tenantName.trim(),
          phone: contactNumber.trim(),
          email: email.trim(),
          bed: bedNumber,
          rent: monthlyRent.trim(),
          checkIn: checkIn.trim(),
          checkOut: checkOut.trim(),
          idUri: idOpenUri || idProofUri,
        },
      ];
      return { ...prev, [key]: nextList };
    });
    setBedCounts((prev) => {
      const next = Math.min(4, (prev[key] ?? 0) + 1);
      return { ...prev, [key]: next };
    });
    setIdProofFile("");
    setIdProofUri("");
    setIdOpenUri("");
    setIdPreviewVisible(false);
    setShowBottomViewId(false);
    setModalVisible(false);
  };
  const removeTenant = (floorLabel, room, index) => {
    const key = `${floorLabel}-${room}`;
    setTenants((prev) => {
      const list = prev[key] ?? [];
      const nextList = list.filter((_, i) => i !== index);
      return { ...prev, [key]: nextList };
    });
    setBedCounts((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) - 1);
      return { ...prev, [key]: next };
    });
  };

  const handleViewId = async (uri) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewScale(1);

    const isPdf =
      uri.toLowerCase().endsWith(".pdf") || uri.startsWith("content://");
    const isRemote = /^https?:/i.test(uri);

    if (isPdf && !isRemote) {
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        const html = `
          <!DOCTYPE html>
          <html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
          <body style="margin:0;padding:0;background:${COLORS.BACKGROUND};">
            <embed src="data:application/pdf;base64,${base64}" type="application/pdf" style="width:100%;height:100vh;" />
          </body></html>`;
        setIdPreviewHtml(html);
      } catch (err) {
        console.log("PDF read error:", err);
        setIdPreviewHtml("");
      }
    } else {
      setIdPreviewHtml("");
    }
    setIdPreviewVisible(true);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
      {/* Header */}
      <Text style={styles.header}>Ganesh</Text>
      <Text style={styles.subHeader}>Welcome back, Krishna</Text>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statBox,
            { backgroundColor: "#C5EBD2" },
            filterMode === "occupied" && styles.statBoxSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => setFilterMode("occupied")}
        >
          <Text style={styles.statNumber}>{occupiedRooms}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            { backgroundColor: "#FFCECE" },
            filterMode === "empty" && styles.statBoxSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => setFilterMode("empty")}
        >
          <Text style={styles.statNumber}>{emptyRooms}</Text>
          <Text style={styles.statLabel}>Empty</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statBox,
            { backgroundColor: "#E0D4FF" },
            filterMode === null && styles.statBoxSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => setFilterMode(null)}
        >
          <Text style={styles.statNumber}>{totalRooms}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Building View</Text>
        <View style={[styles.legendRow, { marginTop: 0 }]}>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.SUCCESS }]}
          />
          <Text style={styles.legendText}>Full</Text>
          <View
            style={[styles.legendDot, { backgroundColor: COLORS.WARNING }]}
          />
          <Text style={styles.legendText}>Partial</Text>
          <View style={[styles.legendDot, { backgroundColor: COLORS.ERROR }]} />
          <Text style={styles.legendText}>Empty</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.sidebar}>
          <ScrollView
            ref={sidebarRef}
            style={styles.sidebarScroll}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator
          >
            {floors.map((f, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.sideButton,
                  activeIndex === idx && styles.sideButtonActive,
                ]}
                onPress={() => handleSelectFloor(idx)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sideButtonText,
                    activeIndex === idx && styles.sideButtonTextActive,
                  ]}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={sliderRef}
          horizontal
          snapToInterval={snap}
          decelerationRate="fast"
          scrollEventThrottle={8}
          keyboardShouldPersistTaps="always"
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.max(
              0,
              Math.min(
                floors.length - 1,
                Math.round(x / (cardWidth + SPACING)),
              ),
            );
            setActiveIndex(idx);
          }}
          showsHorizontalScrollIndicator={false}
          style={styles.slider}
          contentContainerStyle={{ paddingLeft: SPACING, paddingRight: 6 }}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.max(
              0,
              Math.min(
                floors.length - 1,
                Math.round((x - SPACING) / (cardWidth + SPACING)),
              ),
            );
            setActiveIndex(idx);
          }}
        >
          {floors.map((item, index) => (
            <View
              style={[
                styles.card,
                {
                  width: cardWidth,
                  marginRight: index === floors.length - 1 ? 0 : SPACING,
                  height: CARD_HEIGHT,
                },
              ]}
              key={index}
              onLayout={(e) => {
                if (!sliderWidth) {
                  setSliderWidth(e.nativeEvent.layout.width);
                }
              }}
            >
              <Animated.Text
                style={[
                  styles.floorTitle,
                  { opacity: floorPulse, transform: [{ scale: floorScale }] },
                  activeIndex === index && {
                    color: COLORS.PRIMARY,
                    backgroundColor: COLORS.BLUE_LIGHT,
                    borderWidth: 1,
                    borderColor: COLORS.PRIMARY,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    alignSelf: "center",
                  },
                ]}
              >
                {item.floor}
              </Animated.Text>
              <ScrollView
                style={styles.cardScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                scrollEventThrottle={8}
              >
                <View style={styles.roomGrid}>
                  {(filterMode === "occupied"
                    ? item.rooms.filter((r) => isOccupied(item.floor, r))
                    : filterMode === "empty"
                      ? item.rooms.filter((r) => getCount(item.floor, r) < 4)
                      : item.rooms
                  ).map((room, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.roomBox,
                        {
                          backgroundColor: getTileColor(item.floor, room),
                        },
                      ]}
                      onPress={() => openTenantModal(item.floor, room)}
                    >
                      {(() => {
                        const tileColor = getTileColor(item.floor, room);
                        const tColor = COLORS.WHITE;
                        return (
                          <>
                            <Text
                              style={[styles.roomNumber, { color: tColor }]}
                            >
                              {room}
                            </Text>
                            <Text style={[styles.roomText, { color: tColor }]}>
                              {getCount(item.floor, room)}/4 beds
                            </Text>
                          </>
                        );
                      })()}
                      <View style={styles.controlsRow}>
                        <TouchableOpacity
                          style={styles.controlBtn}
                          onPress={() => openTenantModal(item.floor, room)}
                        >
                          <Text style={styles.controlText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={{ width: "100%" }}>
            <View style={styles.modalCard}>
              <ScrollView
                style={styles.modalContentScroll}
                contentContainerStyle={{ paddingBottom: 24 }}
                nestedScrollEnabled
                stickyHeaderIndices={[0]}
                keyboardShouldPersistTaps="always"
              >
                <View
                  style={[
                    styles.modalHeaderRow,
                    { backgroundColor: COLORS.WHITE, position: "relative" },
                  ]}
                >
                  <Text style={styles.modalTitle}>
                    {selectedRoom ? `Room ${selectedRoom}` : "Room"}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalClose}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatBlock}>
                    <Text style={styles.modalStatLabel}>Occupancy</Text>
                    <Text style={styles.modalStatValue}>
                      {getCount(selectedFloor ?? "", selectedRoom ?? "")}/4
                    </Text>
                  </View>
                  <View style={styles.modalStatBlock}>
                    <Text style={styles.modalStatLabel}>Available</Text>
                    <Text
                      style={[styles.modalStatValue, { color: COLORS.SUCCESS }]}
                    >
                      {Math.max(
                        0,
                        4 - getCount(selectedFloor ?? "", selectedRoom ?? ""),
                      )}{" "}
                      beds
                    </Text>
                  </View>
                </View>
                <View style={styles.modalSectionHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.modalSectionTitle}>
                      Current Tenants
                    </Text>
                    <TouchableOpacity
                      onPress={() => setTenantsExpanded((v) => !v)}
                      style={{ padding: 6 }}
                    >
                      <Ionicons
                        name={
                          tenantsExpanded
                            ? "chevron-up-outline"
                            : "chevron-down-outline"
                        }
                        size={20}
                        color={COLORS.TEXT_PRIMARY}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {tenantsExpanded && (
                  <View style={styles.currentTenantsBox}>
                    {(tenants[`${selectedFloor}-${selectedRoom}`] ?? []).map(
                      (t, idx) => (
                        <View key={idx} style={styles.tenantCard}>
                          <View style={{ flex: 1 }}>
                            {!(editAll || rowEditIndex === idx) ? (
                              <Text style={styles.tenantName}>{t.name}</Text>
                            ) : (
                              <TextInput
                                value={
                                  editAll
                                    ? (editValues[idx]?.name ?? t.name)
                                    : (rowEditValues[idx]?.name ?? t.name)
                                }
                                onChangeText={(val) => {
                                  const sanitized = val.replace(
                                    /[^A-Za-z\s]/g,
                                    "",
                                  );
                                  if (editAll) {
                                    setEditValues((prev) => ({
                                      ...prev,
                                      [idx]: {
                                        ...(prev[idx] || {}),
                                        name: sanitized,
                                      },
                                    }));
                                  } else {
                                    setRowEditValues((prev) => ({
                                      ...prev,
                                      [idx]: {
                                        ...(prev[idx] || {}),
                                        name: sanitized,
                                      },
                                    }));
                                  }
                                }}
                                placeholder="Name"
                                style={[styles.input, { marginBottom: 6 }]}
                                autoCapitalize="words"
                                autoCorrect={false}
                              />
                            )}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {!(editAll || rowEditIndex === idx) ? (
                                <>
                                  <Text style={styles.tenantMeta}>
                                    Bed {t.bed} ·{" "}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() => {
                                      const tel = `tel:${t.phone}`;
                                      Linking.openURL(tel).catch(() => {});
                                    }}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Ionicons
                                      name="call-outline"
                                      size={14}
                                      color={COLORS.SUCCESS}
                                    />
                                    <Text
                                      style={[
                                        styles.tenantMeta,
                                        { marginLeft: 4 },
                                      ]}
                                    >
                                      {t.phone}
                                    </Text>
                                  </TouchableOpacity>
                                  {!!t.rent && (
                                    <>
                                      <Text style={styles.tenantMeta}> · </Text>
                                      <Text
                                        style={[
                                          styles.tenantMeta,
                                          { color: COLORS.PRIMARY },
                                        ]}
                                      >
                                        ₹
                                      </Text>
                                      <Text
                                        style={[
                                          styles.tenantMeta,
                                          { marginLeft: 4 },
                                        ]}
                                      >
                                        {t.rent}
                                      </Text>
                                    </>
                                  )}
                                </>
                              ) : (
                                <View style={{ flex: 1 }}>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <Text style={styles.tenantMeta}>Bed</Text>
                                    {(() => {
                                      const key = `${selectedFloor}-${selectedRoom}`;
                                      const list = tenants[key] ?? [];
                                      const chosen = editAll
                                        ? new Set(
                                            list
                                              .map((p, i) =>
                                                i === idx
                                                  ? null
                                                  : (editValues[i]?.bed ??
                                                    p.bed),
                                              )
                                              .filter((x) => !!x),
                                          )
                                        : new Set(
                                            list
                                              .map((p, i) =>
                                                i === idx ? null : p.bed,
                                              )
                                              .filter((x) => !!x),
                                          );
                                      return [1, 2, 3, 4].map((b) => {
                                        const active = editAll
                                          ? (editValues[idx]?.bed ?? t.bed) ===
                                            b
                                          : (rowEditValues[idx]?.bed ??
                                              t.bed) === b;
                                        const disabled = chosen.has(b);
                                        return (
                                          <TouchableOpacity
                                            key={b}
                                            style={[
                                              styles.bedBtn,
                                              active && styles.bedBtnActive,
                                              disabled && styles.bedBtnOccupied,
                                            ]}
                                            onPress={() => {
                                              if (editAll) {
                                                setEditValues((prev) => ({
                                                  ...prev,
                                                  [idx]: {
                                                    ...(prev[idx] || {}),
                                                    bed: b,
                                                  },
                                                }));
                                              } else {
                                                setRowEditValues((prev) => ({
                                                  ...prev,
                                                  [idx]: {
                                                    ...(prev[idx] || {}),
                                                    bed: b,
                                                  },
                                                }));
                                              }
                                            }}
                                            disabled={disabled}
                                          >
                                            <Text
                                              style={[
                                                styles.bedBtnText,
                                                active &&
                                                  styles.bedBtnTextActive,
                                                disabled &&
                                                  styles.bedBtnTextOccupied,
                                              ]}
                                            >
                                              {disabled ? "✓" : b}
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      });
                                    })()}
                                  </View>
                                  <View style={{ marginTop: 6 }}>
                                    <TextInput
                                      value={
                                        editAll
                                          ? (editValues[idx]?.phone ?? t.phone)
                                          : (rowEditValues[idx]?.phone ??
                                            t.phone)
                                      }
                                      onChangeText={(val) => {
                                        const digits = val
                                          .replace(/[^0-9]/g, "")
                                          .slice(0, 11);
                                        if (editAll) {
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              phone: digits,
                                            },
                                          }));
                                        } else {
                                          setRowEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              phone: digits,
                                            },
                                          }));
                                        }
                                      }}
                                      placeholder="Phone"
                                      style={[
                                        styles.input,
                                        { marginBottom: 6 },
                                      ]}
                                      keyboardType="phone-pad"
                                      maxLength={11}
                                      autoCorrect={false}
                                    />
                                    <TextInput
                                      value={
                                        editAll
                                          ? (editValues[idx]?.email ??
                                            t.email ??
                                            "")
                                          : (rowEditValues[idx]?.email ??
                                            t.email ??
                                            "")
                                      }
                                      onChangeText={(val) => {
                                        const v = val.trim();
                                        if (editAll) {
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              email: v,
                                            },
                                          }));
                                        } else {
                                          setRowEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              email: v,
                                            },
                                          }));
                                        }
                                      }}
                                      placeholder="Email (optional)"
                                      style={[
                                        styles.input,
                                        { marginBottom: 6 },
                                      ]}
                                      keyboardType="email-address"
                                      autoCapitalize="none"
                                      autoCorrect={false}
                                    />
                                    <TextInput
                                      value={
                                        editAll
                                          ? (editValues[idx]?.rent ??
                                            t.rent ??
                                            "")
                                          : (rowEditValues[idx]?.rent ??
                                            t.rent ??
                                            "")
                                      }
                                      onChangeText={(val) => {
                                        const digits = val.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                        if (editAll) {
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              rent: digits,
                                            },
                                          }));
                                        } else {
                                          setRowEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              rent: digits,
                                            },
                                          }));
                                        }
                                      }}
                                      placeholder="Monthly Rent"
                                      style={[styles.input]}
                                      keyboardType="numeric"
                                      autoCorrect={false}
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                            {!(editAll || rowEditIndex === idx) &&
                              (t.checkIn || t.checkOut) && (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    marginTop: 2,
                                  }}
                                >
                                  {!!t.checkIn && (
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color={COLORS.TEXT_SECONDARY}
                                      />
                                      <Text
                                        style={[
                                          styles.tenantMeta,
                                          { marginLeft: 4 },
                                        ]}
                                      >
                                        In {t.checkIn}
                                      </Text>
                                    </View>
                                  )}
                                  {!!t.checkOut && (
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginLeft: 8,
                                      }}
                                    >
                                      <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color={COLORS.TEXT_SECONDARY}
                                      />
                                      <Text
                                        style={[
                                          styles.tenantMeta,
                                          { marginLeft: 4 },
                                        ]}
                                      >
                                        Out {t.checkOut}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              )}

                            {(editAll || rowEditIndex === idx) && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                  marginTop: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <TextInput
                                  value={
                                    editAll
                                      ? (editValues[idx]?.in ?? t.checkIn ?? "")
                                      : (rowEditValues[idx]?.in ??
                                        t.checkIn ??
                                        "")
                                  }
                                  onChangeText={(val) => {
                                    const sanitized = val.replace(
                                      /[^A-Za-z0-9\s/.\-:]/g,
                                      "",
                                    );
                                    if (editAll) {
                                      setEditValues((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...(prev[idx] || {}),
                                          in: sanitized,
                                        },
                                      }));
                                    } else {
                                      setRowEditValues((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...(prev[idx] || {}),
                                          in: sanitized,
                                        },
                                      }));
                                    }
                                  }}
                                  placeholder="Check-in (DD/MM/YY or DD-MM-YY)"
                                  style={[
                                    styles.input,
                                    { flexBasis: "48%", flexGrow: 1 },
                                  ]}
                                  keyboardType="default"
                                  autoCorrect={false}
                                  autoComplete="off"
                                  textContentType="none"
                                  importantForAutofill="no"
                                />
                                <TextInput
                                  value={
                                    editAll
                                      ? (editValues[idx]?.out ??
                                        t.checkOut ??
                                        "")
                                      : (rowEditValues[idx]?.out ??
                                        t.checkOut ??
                                        "")
                                  }
                                  onChangeText={(val) => {
                                    const sanitized = val.replace(
                                      /[^A-Za-z0-9\s/.\-:]/g,
                                      "",
                                    );
                                    if (editAll) {
                                      setEditValues((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...(prev[idx] || {}),
                                          out: sanitized,
                                        },
                                      }));
                                    } else {
                                      setRowEditValues((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...(prev[idx] || {}),
                                          out: sanitized,
                                        },
                                      }));
                                    }
                                  }}
                                  placeholder="Check-out (DD/MM/YY or DD-MM-YY)"
                                  style={[
                                    styles.input,
                                    { flexBasis: "48%", flexGrow: 1 },
                                  ]}
                                  keyboardType="default"
                                  autoCorrect={false}
                                  autoComplete="off"
                                  textContentType="none"
                                  importantForAutofill="no"
                                />
                              </View>
                            )}
                            {rowEditIndex === idx && (
                              <View style={{ width: "100%", marginTop: 8 }}>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <TouchableOpacity
                                    style={[
                                      styles.viewBtn,
                                      {
                                        width: 60,
                                        paddingVertical: 6,
                                        paddingHorizontal: 8,
                                      },
                                    ]}
                                    onPress={async () => {
                                      const uri =
                                        rowEditValues[idx]?.idUri ?? t.idUri;
                                      handleViewId(uri);
                                    }}
                                  >
                                    <Text style={styles.viewBtnText}>ID</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.smallBtn]}
                                    onPress={async () => {
                                      try {
                                        const result =
                                          await DocumentPicker.getDocumentAsync(
                                            {
                                              type: [
                                                "image/*",
                                                "application/pdf",
                                              ],
                                              multiple: false,
                                              copyToCacheDirectory: true,
                                            },
                                          );
                                        let uri = null;
                                        if (
                                          result?.assets &&
                                          result.assets.length > 0
                                        ) {
                                          uri = result.assets[0].uri || null;
                                        } else if (result?.uri) {
                                          uri = result.uri;
                                        }
                                        if (uri) {
                                          setRowEditValues((prev) => ({
                                            ...prev,
                                            [idx]: {
                                              ...(prev[idx] || {}),
                                              idUri: uri,
                                            },
                                          }));
                                        }
                                      } catch (_) {}
                                    }}
                                  >
                                    <Text style={styles.smallBtnText}>
                                      Change ID
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                {(() => {
                                  const key = `${selectedFloor}-${selectedRoom}`;
                                  const list = tenants[key] ?? [];
                                  const v = rowEditValues[idx] || {};
                                  const nm = v.name ?? t.name;
                                  const ph = v.phone ?? t.phone;
                                  const em = v.email ?? t.email ?? "";
                                  const bd = v.bed ?? t.bed;
                                  const used = new Set(
                                    list
                                      .map((p, i) => (i === idx ? null : p.bed))
                                      .filter((x) => !!x),
                                  );
                                  const valid =
                                    /^[A-Za-z\s]+$/.test((nm || "").trim()) &&
                                    /^\d{10,11}$/.test((ph || "").trim()) &&
                                    ((em || "").trim().length === 0 ||
                                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                        (em || "").trim(),
                                      )) &&
                                    bd >= 1 &&
                                    bd <= 4 &&
                                    !used.has(bd);
                                  return (
                                    <View
                                      style={{ flexDirection: "row", gap: 8 }}
                                    >
                                      <TouchableOpacity
                                        style={[
                                          styles.smallBtn,
                                          !valid && { opacity: 0.5 },
                                          { flex: 1 },
                                        ]}
                                        disabled={!valid}
                                        onPress={() => {
                                          const updated = list.map((p, i) => {
                                            if (i !== idx) return p;
                                            const vv = rowEditValues[idx] || {};
                                            return {
                                              ...p,
                                              name: (vv.name ?? p.name).trim(),
                                              phone: (
                                                vv.phone ?? p.phone
                                              ).trim(),
                                              email: (
                                                vv.email ??
                                                p.email ??
                                                ""
                                              ).trim(),
                                              bed: vv.bed ?? p.bed,
                                              rent: (
                                                vv.rent ??
                                                p.rent ??
                                                ""
                                              ).trim(),
                                              checkIn: (
                                                vv.in ??
                                                p.checkIn ??
                                                ""
                                              ).trim(),
                                              checkOut: (
                                                vv.out ??
                                                p.checkOut ??
                                                ""
                                              ).trim(),
                                              idUri: vv.idUri ?? p.idUri,
                                            };
                                          });
                                          setTenants((prev) => ({
                                            ...prev,
                                            [key]: updated,
                                          }));
                                          setRowEditIndex(null);
                                          setRowEditValues({});
                                        }}
                                      >
                                        <Text style={styles.smallBtnText}>
                                          Save
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[
                                          styles.smallBtn,
                                          {
                                            backgroundColor: COLORS.BORDER,
                                            borderColor: COLORS.BORDER,
                                            flex: 1,
                                          },
                                        ]}
                                        onPress={() => {
                                          setRowEditIndex(null);
                                          setRowEditValues({});
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.smallBtnText,
                                            { color: COLORS.TEXT_PRIMARY },
                                          ]}
                                        >
                                          Cancel
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={() =>
                                          removeTenant(
                                            selectedFloor,
                                            selectedRoom,
                                            idx,
                                          )
                                        }
                                        style={{
                                          marginLeft: 8,
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Ionicons
                                          name="trash-outline"
                                          size={20}
                                          color={COLORS.ERROR}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  );
                                })()}
                              </View>
                            )}
                          </View>
                          <View style={styles.actionCol}>
                            {rowEditIndex !== idx ? (
                              <>
                                <TouchableOpacity
                                  style={[
                                    styles.smallBtn,
                                    { height: 28, alignSelf: "stretch" },
                                  ]}
                                  onPress={() => {
                                    setRowEditIndex(idx);
                                    setRowEditValues((prev) => ({
                                      ...prev,
                                      [idx]: {
                                        name: t.name || "",
                                        phone: t.phone || "",
                                        email: t.email || "",
                                        bed: t.bed,
                                        rent: t.rent || "",
                                        in: t.checkIn || "",
                                        out: t.checkOut || "",
                                        idUri: t.idUri || "",
                                      },
                                    }));
                                  }}
                                >
                                  <Text style={styles.smallBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1 }} />
                                <TouchableOpacity
                                  onPress={() =>
                                    removeTenant(
                                      selectedFloor,
                                      selectedRoom,
                                      idx,
                                    )
                                  }
                                  style={{
                                    alignSelf: "center",
                                    marginTop: 8,
                                    marginBottom: 10,
                                  }}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={22}
                                    color={COLORS.ERROR}
                                  />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <></>
                            )}
                          </View>
                        </View>
                      ),
                    )}
                    {(tenants[`${selectedFloor}-${selectedRoom}`] ?? [])
                      .length === 0 && (
                      <Text style={styles.emptyTenants}>No tenants</Text>
                    )}
                  </View>
                )}
                <View style={styles.modalSectionHeader}>
                  <Text style={styles.modalSectionTitle}>Add New Tenant</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Tenant Name</Text>
                  <TextInput
                    value={tenantName}
                    onChangeText={(t) => {
                      if (/^[A-Za-z\s]*$/.test(t)) {
                        setTenantName(t);
                      }
                    }}
                    onBlur={() => setTouchedName(!isValidName(tenantName))}
                    style={[
                      styles.input,
                      touchedName &&
                        (tenantName.trim().length === 0 ||
                          !/^[A-Za-z\s]+$/.test(tenantName.trim())) &&
                        styles.inputError,
                    ]}
                    placeholder="Tenant Name"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Contact Number</Text>
                  <TextInput
                    value={contactNumber}
                    onChangeText={(t) =>
                      setContactNumber(t.replace(/[^0-9]/g, "").slice(0, 11))
                    }
                    onBlur={() => setTouchedPhone(!isValidPhone(contactNumber))}
                    style={[
                      styles.input,
                      touchedPhone &&
                        !/^\d{10,11}$/.test(contactNumber.trim()) &&
                        styles.inputError,
                    ]}
                    placeholder="Contact Number"
                    keyboardType="phone-pad"
                    maxLength={11}
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={(t) => setEmail(t.trim())}
                    onBlur={() => setTouchedEmail(!isValidEmail(email))}
                    style={[
                      styles.input,
                      touchedEmail &&
                        email.trim().length > 0 &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
                        styles.inputError,
                    ]}
                    placeholder="Email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>
                    Upload ID (Aadhaar / PAN)
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={async () => {
                      const result = await DocumentPicker.getDocumentAsync({
                        type: ["image/*", "application/pdf"],
                        multiple: false,
                        copyToCacheDirectory: true,
                      });
                      if (result?.assets && result.assets.length > 0) {
                        const file = result.assets[0];
                        setIdProofFile(file.name || "selected-file");
                        setIdProofUri(file.uri || "");
                        setShowBottomViewId(true);
                        if (
                          (file.mimeType || file.name || "")
                            .toLowerCase()
                            .includes("pdf")
                        ) {
                          try {
                            const contentUri =
                              await FileSystem.getContentUriAsync(file.uri);
                            setIdOpenUri(contentUri);
                          } catch {
                            setIdOpenUri(file.uri || "");
                          }
                        } else {
                          setIdOpenUri(file.uri || "");
                        }
                        const lower = (
                          file.mimeType ||
                          file.name ||
                          ""
                        ).toLowerCase();
                        if (
                          lower.includes("pdf") ||
                          (file.uri || "").toLowerCase().endsWith(".pdf")
                        ) {
                          try {
                            const base64 = await FileSystem.readAsStringAsync(
                              file.uri,
                              { encoding: "base64" },
                            );
                            const html = `
                          <!DOCTYPE html>
                          <html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
                          <body style="margin:0;padding:0;background:${COLORS.BACKGROUND};">
                            <embed src="data:application/pdf;base64,${base64}" type="application/pdf" style="width:100%;height:100vh;" />
                          </body></html>`;
                            setIdPreviewHtml(html);
                          } catch (_) {
                            setIdPreviewHtml("");
                          }
                        } else {
                          setIdPreviewHtml("");
                        }
                      } else if (result?.name) {
                        setIdProofFile(result.name);
                        if (result?.uri) setIdProofUri(result.uri);
                        setShowBottomViewId(true);
                        if (
                          (result.name || "").toLowerCase().endsWith(".pdf") &&
                          result.uri
                        ) {
                          try {
                            const contentUri =
                              await FileSystem.getContentUriAsync(result.uri);
                            setIdOpenUri(contentUri);
                          } catch {
                            setIdOpenUri(result.uri);
                          }
                        } else {
                          setIdOpenUri(result.uri || "");
                        }
                        const lower = (result.name || "").toLowerCase();
                        if (lower.endsWith(".pdf") && result.uri) {
                          try {
                            const base64 = await FileSystem.readAsStringAsync(
                              result.uri,
                              { encoding: "base64" },
                            );
                            const html = `
                          <!DOCTYPE html>
                          <html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
                          <body style="margin:0;padding:0;background:${COLORS.BACKGROUND};">
                            <embed src="data:application/pdf;base64,${base64}" type="application/pdf" style="width:100%;height:100vh;" />
                          </body></html>`;
                            setIdPreviewHtml(html);
                          } catch (_) {
                            setIdPreviewHtml("");
                          }
                        } else {
                          setIdPreviewHtml("");
                        }
                      }
                    }}
                  >
                    <Text style={styles.uploadBtnText}>
                      {idProofFile ? idProofFile : "Choose file"}
                    </Text>
                  </TouchableOpacity>
                  {!!idProofUri && showBottomViewId && (
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={async () => {
                        const targetUri = idOpenUri || idProofUri;
                        handleViewId(targetUri);
                      }}
                    >
                      <Text style={styles.viewBtnText}>View ID</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Select Bed</Text>
                  <View style={styles.bedPickerRow}>
                    {(() => {
                      const occ = (
                        tenants[`${selectedFloor}-${selectedRoom}`] ?? []
                      ).map((x) => x.bed);
                      return [1, 2, 3, 4].map((b) => {
                        const isOcc = occ.includes(b);
                        return (
                          <TouchableOpacity
                            key={b}
                            style={[
                              styles.bedBtn,
                              bedNumber === b && styles.bedBtnActive,
                              isOcc && styles.bedBtnOccupied,
                            ]}
                            onPress={() => setBedNumber(b)}
                            disabled={isOcc}
                          >
                            <Text
                              style={[
                                styles.bedBtnText,
                                bedNumber === b && styles.bedBtnTextActive,
                                isOcc && styles.bedBtnTextOccupied,
                              ]}
                            >
                              {isOcc ? "✓" : b}
                            </Text>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Monthly Rent</Text>
                  <TextInput
                    value={monthlyRent}
                    onChangeText={(t) =>
                      setMonthlyRent(t.replace(/[^0-9]/g, ""))
                    }
                    onBlur={() =>
                      setTouchedRent(monthlyRent.trim().length === 0)
                    }
                    style={[
                      styles.input,
                      touchedRent &&
                        monthlyRent.trim().length === 0 &&
                        styles.inputError,
                    ]}
                    placeholder="Monthly Rent"
                    keyboardType="numeric"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                  />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Check-in Date</Text>
                  <TextInput
                    value={checkIn}
                    onChangeText={(t) => setCheckIn(t.replace(/[^\d/-]/g, ""))}
                    style={styles.input}
                    placeholder="DD/MM/YY "
                    keyboardType="default"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                  />
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Check-out Date</Text>
                  <TextInput
                    value={checkOut}
                    onChangeText={(t) => setCheckOut(t.replace(/[^\d/-]/g, ""))}
                    style={styles.input}
                    placeholder="DD/MM/YY "
                    keyboardType="default"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, !isFormValid() && { opacity: 0.5 }]}
                  onPressIn={addTenant}
                  disabled={!isFormValid()}
                >
                  <Text style={styles.addBtnText}>Add Tenant</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal transparent visible={idPreviewVisible} animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>ID Preview</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.zoomBtn, { marginRight: 6 }]}
                  onPress={() => {
                    const next = Math.min(
                      3,
                      Math.round((previewScale + 0.2) * 10) / 10,
                    );
                    setPreviewScale(next);
                  }}
                >
                  <Text style={styles.zoomBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.zoomBtn, { marginRight: 10 }]}
                  onPress={() => {
                    const next = Math.max(
                      1,
                      Math.round((previewScale - 0.2) * 10) / 10,
                    );
                    setPreviewScale(next);
                  }}
                >
                  <Text style={styles.zoomBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIdPreviewVisible(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
            <PinchGestureHandler
              onGestureEvent={(e) => {
                const scale = e.nativeEvent.scale ?? 1;
                setPreviewScale((prev) =>
                  Math.min(3, Math.max(1, prev * scale)),
                );
              }}
              onHandlerStateChange={onPinchStateChange}
            >
              <ScrollView
                style={styles.previewContentClip}
                contentContainerStyle={{ alignItems: "stretch" }}
              >
                {previewUri ? (
                  previewUri.toLowerCase().endsWith(".pdf") ? (
                    idPreviewHtml ? (
                      <WebView
                        source={{ html: idPreviewHtml }}
                        style={{
                          width: "100%",
                          height: Math.round(360 * previewScale),
                        }}
                        originWhitelist={["*"]}
                      />
                    ) : Platform.OS === "android" ? (
                      /^https?:/i.test(previewUri) ? (
                        <WebView
                          source={{
                            uri:
                              "https://docs.google.com/gview?embedded=true&url=" +
                              encodeURIComponent(previewUri),
                          }}
                          style={{
                            width: "100%",
                            height: Math.round(360 * previewScale),
                          }}
                          originWhitelist={["*"]}
                        />
                      ) : (
                        <View
                          style={{ alignItems: "center", paddingVertical: 12 }}
                        >
                          <Text style={styles.tenantMeta}>
                            PDF preview not supported here on Android
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.viewBtn,
                              { marginTop: 8, width: 160 },
                            ]}
                            onPress={async () => {
                              try {
                                await Linking.openURL(previewUri);
                              } catch (_) {}
                            }}
                          >
                            <Text style={styles.viewBtnText}>
                              Open Externally
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )
                    ) : (
                      <WebView
                        source={{ uri: previewUri }}
                        style={{
                          width: "100%",
                          height: Math.round(360 * previewScale),
                        }}
                        originWhitelist={["*"]}
                      />
                    )
                  ) : (
                    <Image
                      source={{ uri: previewUri }}
                      style={{
                        width: "100%",
                        height: Math.round(360 * previewScale),
                        borderRadius: 12,
                        backgroundColor: COLORS.BACKGROUND,
                      }}
                      resizeMode="contain"
                    />
                  )
                ) : (
                  <Text style={styles.tenantMeta}>No preview available</Text>
                )}
              </ScrollView>
            </PinchGestureHandler>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 16,
  },
  contentRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 16,
  },
  sidebar: {
    width: 64,
    height: CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
    padding: 8,
    alignItems: "center",
    gap: 8,
  },
  sidebarScroll: {
    width: "100%",
  },
  sidebarScrollContent: {
    alignItems: "center",
    gap: 8,
  },
  sideButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "center",
  },
  sideButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  sideButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
  sideButtonTextActive: {
    color: COLORS.WHITE,
  },
  sideBarProgress: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.BORDER,
    marginTop: 6,
    overflow: "hidden",
  },
  sideBarProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  slider: {
    flex: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardScroll: {
    flex: 1,
  },

  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 28,
  },

  subHeader: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statBox: {
    width: "30%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  statBoxSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 0,
  },

  floorTitle: {
    marginTop: 0,
    marginBottom: 8,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginRight: 12,
  },

  roomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  roomBox: {
    width: "28%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },

  roomNumber: {
    color: COLORS.WHITE,
    fontWeight: "bold",
    fontSize: 15,
  },

  roomText: {
    color: COLORS.WHITE,
    fontSize: 11,
  },

  plus: {
    color: COLORS.WHITE,
    fontSize: 16,
    marginTop: 5,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  controlBtn: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  controlText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "stretch",
    padding: 0,
  },
  modalCard: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  modalContentScroll: {
    flex: 1,
  },
  previewCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    position: "relative",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewImage: {
    width: "100%",
    height: 360,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
  },
  previewWebView: {
    width: "100%",
    height: 360,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewContentClip: {
    height: 360,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
  },
  previewZoom: {},
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalClose: {
    fontSize: 24,
  },
  modalCloseBtn: {
    position: "absolute",
    right: 8,
    top: -8,
    padding: 4,
  },
  modalRow: {
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "flex-start",
  },
  uploadBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
  },
  viewBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.BLUE_LIGHT,
    alignItems: "center",
    width: 120,
  },
  viewBtnText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  bedPickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  bedBtn: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.WHITE,
  },
  bedBtnActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  bedBtnOccupied: {
    backgroundColor: COLORS.BLUE_LIGHT,
    borderColor: COLORS.DIVIDER,
  },
  bedBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
  bedBtnTextActive: {
    color: COLORS.WHITE,
  },
  bedBtnTextOccupied: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  addBtn: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: {
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  smallBtn: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "700",
  },
  zoomOverlay: {
    position: "absolute",
    right: 8,
    top: 8,
    flexDirection: "row",
    gap: 8,
    zIndex: 1000,
  },
  zoomBtn: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  modalStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalStatBlock: {
    gap: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalSectionHeader: {
    marginBottom: 8,
    marginTop: 4,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  currentTenantsBox: {
    borderWidth: 0,
    padding: 0,
    backgroundColor: COLORS.BACKGROUND,
    marginBottom: 12,
    gap: 8,
  },
  tenantCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    marginHorizontal: 6,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionCol: {
    marginLeft: 6,
    alignItems: "stretch",
    justifyContent: "flex-start",
    width: 80,
  },
  tenantName: {
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  tenantMeta: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  tenantDelete: {
    fontSize: 16,
    color: COLORS.ERROR,
    paddingHorizontal: 8,
  },
  emptyTenants: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 12,
  },
});
