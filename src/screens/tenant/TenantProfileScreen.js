import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  PRIMARY: "#5F259F",
  PRIMARY_LIGHT: "#7A3FC4",
  PRIMARY_DARK: "#4A1D7A",
  WHITE: "#FFFFFF",
  BACKGROUND: "#F5F5F5",
  CARD: "#EEEEEE",
  TEXT_PRIMARY: "#111827",
  TEXT_SECONDARY: "#6B7280",
  TEXT_LIGHT: "#9CA3AF",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  WARNING: "#F59E0B",
  INFO: "#3B82F6",
  BORDER: "#E5E7EB",
  DIVIDER: "#F3F4F6",
  GOLD: "#D4AF37",
  BLUE_LIGHT: "#F5F3FF",
};

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    name: "Aman Kumar",
    email: "aman@example.com",
    phone: "9876543210",
    profileImage: null,
  });

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("currentUser");
      if (data) setUser(JSON.parse(data));
    } catch (e) {
      console.log("Failed to load user");
    }
  };

  const openEditModal = () => {
    setEditForm({ ...user });
    setIsEditModalVisible(true);
  };

  const saveProfile = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      return Alert.alert("Validation Error", "Name and Phone are required.");
    }

    await AsyncStorage.setItem("currentUser", JSON.stringify(editForm));
    setUser(editForm);
    setIsEditModalVisible(false);
  };

  const handleImagePick = async (type) => {
    setImageModalVisible(false);

    const permission =
      type === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted)
      return Alert.alert(
        "Required",
        "Permission is required to set profile photo.",
      );

    const options = { allowsEditing: true, aspect: [1, 1], quality: 0.5 };
    const result =
      type === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({
            ...options,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

    if (!result.canceled) {
      const newImage = result.assets[0].uri;
      setEditForm({ ...editForm, profileImage: newImage });

      if (!isEditModalVisible) {
        const updatedUser = { ...user, profileImage: newImage };
        setUser(updatedUser);
        await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("currentUser");
    navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
  };

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Seamless Menu List Item
  const MenuListItem = ({ icon, title, subtitle, onPress, isDanger }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View
        style={[styles.iconPill, isDanger && { backgroundColor: "#FEE2E2" }]}
      >
        <Feather
          name={icon}
          size={20}
          color={isDanger ? COLORS.ERROR : COLORS.PRIMARY}
        />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDanger && { color: COLORS.ERROR }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.TEXT_LIGHT} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* TOP HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Profile</Text>
          </View>

          <View style={styles.avatarCenter}>
            <TouchableOpacity
              onPress={() => setImageModalVisible(true)}
              style={styles.avatarWrapper}
            >
              {user.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.initialAvatar}>
                  <Text style={styles.initialText}>{firstLetter}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={COLORS.WHITE} />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{user.name}</Text>

            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color={COLORS.SUCCESS}
              />
              <Text style={styles.statusText}>Verified Resident</Text>
            </View>

            <TouchableOpacity style={styles.editPill} onPress={openEditModal}>
              <Text style={styles.editPillText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* METRICS ROW */}
        <View style={styles.metricsSection}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>A-102</Text>
            <Text style={styles.metricLabel}>APARTMENT</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>Active</Text>
            <Text style={styles.metricLabel}>LEASE</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>No Dues</Text>
            <Text style={styles.metricLabel}>RENT STATUS</Text>
          </View>
        </View>

        {/* SEAMLESS SETTINGS LIST */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Contact Information</Text>
          <MenuListItem
            icon="phone"
            title="Mobile Number"
            subtitle={user.phone}
          />
          <View style={styles.listDivider} />
          <MenuListItem
            icon="mail"
            title="Email Address"
            subtitle={user.email}
          />
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Property & Account</Text>
          {/* ---> ADDED NAVIGATION HERE <--- */}
          <MenuListItem
            icon="credit-card"
            title="Payment Methods"
            onPress={() => navigation.navigate("PaymentScreen")}
          />
          {/* --------------------------------- */}
          npx expo install expo-sharing
          <View style={styles.listDivider} />
          <MenuListItem icon="bell" title="Notifications" />
        </View>

        <View style={styles.listSection}>
          <MenuListItem
            icon="log-out"
            title="Sign Out"
            isDanger={true}
            onPress={logout}
          />
        </View>

        <Text style={styles.appVersion}>Property App • Version 1.0.0</Text>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBg}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Details</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.minimalInput}
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                placeholder="Your full name"
                placeholderTextColor={COLORS.TEXT_LIGHT}
              />

              <Text style={[styles.inputLabel, { marginTop: 25 }]}>
                PHONE NUMBER
              </Text>
              <TextInput
                style={styles.minimalInput}
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                keyboardType="phone-pad"
                placeholder="10-digit number"
                placeholderTextColor={COLORS.TEXT_LIGHT}
              />

              <Text style={[styles.inputLabel, { marginTop: 25 }]}>
                EMAIL ADDRESS
              </Text>
              <TextInput
                style={styles.minimalInput}
                value={editForm.email}
                onChangeText={(t) => setEditForm({ ...editForm, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Your email address"
                placeholderTextColor={COLORS.TEXT_LIGHT}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* PHOTO SELECTION MODAL */}
      <Modal transparent visible={imageModalVisible} animationType="fade">
        <TouchableOpacity
          style={styles.photoModalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.photoBottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => handleImagePick("camera")}
            >
              <View style={styles.sheetIconBox}>
                <Ionicons name="camera" size={22} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.sheetText}>Take a Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => handleImagePick("gallery")}
            >
              <View style={styles.sheetIconBox}>
                <Ionicons name="images" size={22} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.sheetText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { paddingBottom: 60 },

  // Seamless Hero Section
  heroSection: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  heroHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },

  avatarCenter: { alignItems: "center", marginTop: 10 },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  initialAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: { fontSize: 40, fontWeight: "800", color: COLORS.PRIMARY },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },

  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.SUCCESS,
    marginLeft: 6,
  },

  editPill: {
    backgroundColor: COLORS.BLUE_LIGHT,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editPillText: { color: COLORS.PRIMARY, fontWeight: "800", fontSize: 14 },

  // Metrics Section
  metricsSection: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    marginTop: 10,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
  },
  metricBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: COLORS.BORDER,
    height: "80%",
    alignSelf: "center",
  },

  // Seamless List Sections
  listSection: {
    backgroundColor: COLORS.WHITE,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.BLUE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  menuSubtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  listDivider: { height: 1, backgroundColor: COLORS.DIVIDER, marginLeft: 74 },

  appVersion: {
    textAlign: "center",
    color: COLORS.TEXT_LIGHT,
    fontSize: 12,
    marginTop: 30,
    fontWeight: "600",
  },

  // Edit Modal
  modalBg: { flex: 1, backgroundColor: COLORS.WHITE },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 30,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalCancelText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  modalSaveText: { fontSize: 16, color: COLORS.PRIMARY, fontWeight: "800" },

  modalBody: { padding: 25 },
  formSection: { marginTop: 10 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  minimalInput: {
    fontSize: 18,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },

  // Photo Sheet
  photoModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.4)",
  },
  photoBottomSheet: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: 40,
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
    textAlign: "center",
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND,
  },
  sheetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.BLUE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  sheetText: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
});
