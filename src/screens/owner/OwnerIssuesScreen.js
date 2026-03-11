import COLORS from "@/src/theme/colors";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    GestureHandlerRootView,
    PanGestureHandler,
    PinchGestureHandler,
    State,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------- STATUS COLORS ---------- */

const STATUS_COLORS = {
  Pending: COLORS.WARNING,
  "In Progress": COLORS.INFO,
  Completed: COLORS.SUCCESS,
};

/* ---------- SAMPLE DATA ---------- */

const initialIssues = [
  {
    id: "1",
    title: "Water leakage in bathroom",
    tenant: "Rahul Sharma",
    tenantPhone: "9876543210",
    supervisor: "Ramesh Kumar",
    supervisorPhone: "9123456780",
    flat: "Flat 302",
    priority: "High",
    status: "Pending",
    date: "Feb 25, 2026",
    description: "Water leaking from ceiling near shower area.",
    images: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504148455328-497c5efae156?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585338665814-2ec3b342416b?q=80&w=1000&auto=format&fit=crop",
    ],
    ownerComment: "",
  },
  {
    id: "2",
    title: "AC not working in bedroom",
    tenant: "Sneha Patel",
    tenantPhone: "9988776655",
    supervisor: "Ramesh Kumar",
    supervisorPhone: "9123456780",
    flat: "Flat 105",
    priority: "Medium",
    status: "In Progress",
    date: "Feb 26, 2026",
    description: "Bedroom AC is not cooling properly and makes loud noise.",
    images: [
      "https://images.unsplash.com/photo-1495556650867-99590cea3657?q=80&w=1000&auto=format&fit=crop",
    ],
    ownerComment: "",
  },
];

export default function OwnerIssues() {
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerComment, setOwnerComment] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  /* ---------- ZOOM & PAN LOGIC ---------- */
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);
  const lastScale = useRef(1);

  // Gesture refs for simultaneity
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // Real-time scale tracking
  const currentScale = useRef(1);
  useEffect(() => {
    const id = scale.addListener(({ value }) => {
      currentScale.current = value;
    });
    return () => scale.removeListener(id);
  }, [scale]);

  // Pan values re-enabled for bounded "move inside" feature
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      let nextScale = lastScale.current * event.nativeEvent.scale;
      if (nextScale < 1) nextScale = 1;
      if (nextScale > 3) nextScale = 3;

      lastScale.current = nextScale;
      baseScale.setValue(nextScale);
      pinchScale.setValue(1);

      // Final clamping for translation based on new scale
      const { width, height } = Dimensions.get("window");
      const maxTranslateX = (width * (nextScale - 1)) / 2;
      const maxTranslateY = (height * 0.8 * (nextScale - 1)) / 2;

      let currentX = lastOffset.current.x;
      let currentY = lastOffset.current.y;

      if (nextScale === 1) {
        currentX = 0;
        currentY = 0;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      } else {
        currentX = Math.min(Math.max(currentX, -maxTranslateX), maxTranslateX);
        currentY = Math.min(Math.max(currentY, -maxTranslateY), maxTranslateY);
        translateX.setOffset(currentX);
        translateY.setOffset(currentY);
        translateX.setValue(0);
        translateY.setValue(0);
      }

      lastOffset.current = { x: currentX, y: currentY };
    }
  };

  const onPanEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    const { width, height } = Dimensions.get("window");

    // Use currentScale.current for real-time boundaries
    const s = currentScale.current;

    // Calculate max translation allowed
    // The image can only move if zoomed (s > 1)
    const maxTranslateX = (width * (s - 1)) / 2;
    const maxTranslateY = (height * 0.8 * (s - 1)) / 2;

    let nextX = lastOffset.current.x + translationX;
    let nextY = lastOffset.current.y + translationY;

    // Strict clamping
    if (nextX > maxTranslateX) nextX = maxTranslateX;
    if (nextX < -maxTranslateX) nextX = -maxTranslateX;
    if (nextY > maxTranslateY) nextY = maxTranslateY;
    if (nextY < -maxTranslateY) nextY = -maxTranslateY;

    translateX.setValue(nextX - lastOffset.current.x);
    translateY.setValue(nextY - lastOffset.current.y);
  };

  const onPanStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      const { width, height } = Dimensions.get("window");

      const s = currentScale.current;
      const maxTranslateX = (width * (s - 1)) / 2;
      const maxTranslateY = (height * 0.8 * (s - 1)) / 2;

      let nextX = lastOffset.current.x + translationX;
      let nextY = lastOffset.current.y + translationY;

      nextX = Math.min(Math.max(nextX, -maxTranslateX), maxTranslateX);
      nextY = Math.min(Math.max(nextY, -maxTranslateY), maxTranslateY);

      lastOffset.current.x = nextX;
      lastOffset.current.y = nextY;

      translateX.setOffset(nextX);
      translateY.setOffset(nextY);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const closeViewer = () => {
    setViewerVisible(false);
    // Reset zoom & pan state
    lastScale.current = 1;
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateY.setOffset(0);
    translateX.setValue(0);
    translateY.setValue(0);
    lastOffset.current = { x: 0, y: 0 };
  };

  const openDetails = (item) => {
    setSelectedIssue(item);
    setOwnerComment(item.ownerComment || "");
    setModalVisible(true);
  };

  const updateStatus = (status) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === selectedIssue.id ? { ...item, status } : item,
      ),
    );
    setSelectedIssue({ ...selectedIssue, status });
  };

  const handleUpdate = () => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === selectedIssue.id ? { ...item, ownerComment } : item,
      ),
    );
    setModalVisible(false);
  };

  /* ---------- FILTER LOGIC ---------- */

  const filteredIssues = issues.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      activeFilter === "All" || item.status === activeFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Issues & Complaints</Text>

      {/* SUMMARY FILTER */}
      <View style={styles.summaryRow}>
        {["All", "Pending", "In Progress"].map((status) => {
          const isActive = activeFilter === status;

          const color =
            status === "All" ? COLORS.PRIMARY : STATUS_COLORS[status];

          const count =
            status === "All"
              ? issues.length
              : issues.filter((i) => i.status === status).length;

          return (
            <TouchableOpacity
              key={status}
              style={{ flex: 1 }}
              onPress={() => setActiveFilter(status)}
            >
              <SummaryCard
                label={status}
                count={count}
                color={color}
                isActive={isActive}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionHeader}>Tenant Issues</Text>

      <TextInput
        placeholder="Search issues..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetails(item)}>
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>
                {item.tenant} • {item.flat}
              </Text>

              <View style={styles.rowBetween}>
                <StatusBadge status={item.status} />
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        {selectedIssue && (
          <ScrollView style={styles.modal}>
            <Text style={styles.modalTitle}>{selectedIssue.title}</Text>

            <View style={styles.detailCard}>
              <Detail label="Tenant" value={selectedIssue.tenant} />
              <Detail label="Flat" value={selectedIssue.flat} />
              <Detail label="Phone" value={selectedIssue.tenantPhone} />
              <Detail label="Supervisor" value={selectedIssue.supervisor} />
              <Detail
                label="Supervisor Phone"
                value={selectedIssue.supervisorPhone}
              />
              <View style={styles.divider} />
              <Detail label="Date" value={selectedIssue.date} />
              <Detail label="Priority" value={selectedIssue.priority} />
            </View>

            <View style={styles.descCard}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>{selectedIssue.description}</Text>

              {selectedIssue.images &&
                selectedIssue.images.filter((img) => img).length > 0 && (
                  <View style={styles.imageGrid}>
                    {selectedIssue.images
                      .filter((img) => img)
                      .map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setSelectedImage(img);
                            setViewerVisible(true);
                          }}
                        >
                          <Image
                            source={{ uri: img }}
                            style={styles.thumbnail}
                          />
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.updateTitle}>Update Status</Text>
              <View style={styles.statusRow}>
                {["Pending", "In Progress", "Completed"].map((status) => {
                  const isSelected = selectedIssue.status === status;
                  const color = STATUS_COLORS[status];

                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => updateStatus(status)}
                      style={[
                        styles.statusBtn,
                        {
                          borderColor: color,
                          backgroundColor: isSelected ? color : COLORS.WHITE,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: isSelected ? COLORS.WHITE : color },
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.updateTitle}>Owner Comment</Text>

              <TextInput
                placeholder="Write a comment for tenant..."
                multiline
                value={ownerComment}
                onChangeText={setOwnerComment}
                style={styles.commentInput}
              />
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleUpdate}>
              <Text style={styles.updateBtnText}>Update</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
      {/* FULL IMAGE VIEWER MODAL */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.viewerBackground}>
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={closeViewer}
              activeOpacity={0.7}
            >
              <Text style={styles.viewerCloseText}>✕ Close</Text>
            </TouchableOpacity>
            {selectedImage && (
              <PanGestureHandler
                ref={panRef}
                simultaneousHandlers={pinchRef}
                onGestureEvent={onPanEvent}
                onHandlerStateChange={onPanStateChange}
              >
                <Animated.View
                  style={{
                    width: "100%",
                    height: "80%",
                    overflow: "hidden",
                    backgroundColor: "#000",
                    borderRadius: 8,
                  }}
                >
                  <PinchGestureHandler
                    ref={pinchRef}
                    simultaneousHandlers={panRef}
                    onGestureEvent={onPinchEvent}
                    onHandlerStateChange={onPinchStateChange}
                  >
                    <Animated.View
                      collapsable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Animated.Image
                        source={{ uri: selectedImage }}
                        style={[
                          styles.fullImage,
                          {
                            transform: [
                              { scale: scale },
                              { translateX: translateX },
                              { translateY: translateY },
                            ],
                          },
                        ]}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </PanGestureHandler>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- COMPONENTS ---------- */

const StatusBadge = ({ status }) => {
  const color = STATUS_COLORS[status];
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}20`,
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
};

const Detail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const SummaryCard = ({ label, count, color, isActive }) => (
  <View
    style={[
      styles.summaryCard,
      {
        borderColor: color,
        borderWidth: isActive ? 1.5 : 0,
        backgroundColor: isActive ? `${color}60` : `${color}40`,
      },
    ]}
  >
    <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    <Text
      style={[
        styles.summaryLabel,
        { color: isActive ? color : COLORS.TEXT_SECONDARY },
      ]}
    >
      {label}
    </Text>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 16,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#08070aff",
    marginBottom: 16,
    marginTop: 0,
  },

  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 12,
    color: COLORS.TEXT_PRIMARY,
  },

  search: {
    backgroundColor: COLORS.WHITE,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  card: {
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },

  sub: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginVertical: 6,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  date: {
    fontSize: 13,
    color: COLORS.TEXT_LIGHT,
  },

  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  modal: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
    color: COLORS.TEXT_PRIMARY,
  },

  detailCard: {
    backgroundColor: COLORS.WHITE,
    padding: 22,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },

  value: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 10,
  },

  descCard: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  descTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: COLORS.TEXT_PRIMARY,
  },

  descText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },

  updateTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
    color: COLORS.TEXT_PRIMARY,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statusBtn: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  commentInput: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  closeBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 90,
  },

  updateBtnText: {
    color: COLORS.WHITE,
    fontWeight: "600",
    fontSize: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  summaryCard: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },

  summaryCount: {
    fontSize: 24,
    fontWeight: "800",
  },

  summaryLabel: {
    fontSize: 13,
    marginTop: 6,
    color: COLORS.TEXT_SECONDARY,
  },

  /* IMAGE GALLERY STYLES */
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  viewerBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  viewerClose: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewerCloseText: {
    color: COLORS.WHITE,
    fontWeight: "700",
  },
});
