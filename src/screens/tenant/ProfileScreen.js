import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    name: "Your Name",
    email: "example@email.com",
    phone: "",
    profileImage: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  const loadUser = async () => {
    const data = await AsyncStorage.getItem("currentUser");

    if (data) {
      const parsed = JSON.parse(data);
      setUser(parsed);
    }
  };

  const startEditing = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditImage(user.profileImage);
    setIsEditing(true);
  };

  const saveProfile = async () => {
    const updatedUser = {
      ...user,
      name: editName,
      email: editEmail,
      phone: editPhone,
      profileImage: editImage,
    };

    await AsyncStorage.setItem("currentUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    Alert.alert("Success", "Profile Updated Successfully");
  };

  const openCamera = async () => {
    setImageModalVisible(false);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    setImageModalVisible(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Gallery permission required");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setEditImage(result.assets[0].uri);
    }
  };

  const contactSupport = () => {
    Linking.openURL("mailto:support@propertyapp.com");
  };

  const logout = async () => {
    await AsyncStorage.removeItem("currentUser");

    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
  };

  const deleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: "LoginScreen" }],
          });
        },
      },
    ]);
  };

  const firstLetter =
    user?.name && user.name.length > 0
      ? user.name.charAt(0).toUpperCase()
      : "U";

  const MenuItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color="#333" />
        <Text style={styles.menuText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#aaa" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.profileCard}>
          <View>
            {isEditing ? (
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                {editImage ? (
                  <Image source={{ uri: editImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.initialAvatar}>
                    <Text style={styles.initialText}>{firstLetter}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.initialAvatar}>
                <Text style={styles.initialText}>{firstLetter}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 15 }}>
            {!isEditing ? (
              <>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.phone}>{user.phone}</Text>

                <TouchableOpacity onPress={startEditing}>
                  <Text style={styles.editText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Name"
                />
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email"
                />
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={saveProfile}
                  >
                    <Text style={styles.btnText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Help Center</Text>
          <MenuItem icon="help-circle-outline" title="FAQ" />
          <MenuItem
            icon="chatbubble-outline"
            title="Contact Support"
            onPress={contactSupport}
          />
          <MenuItem icon="document-text-outline" title="Privacy Policy" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem icon="log-out-outline" title="Logout" onPress={logout} />
          <MenuItem
            icon="trash-outline"
            title="Delete Account"
            onPress={deleteAccount}
          />
        </View>
      </ScrollView>

      {/* IMAGE OPTIONS MODAL */}
      <Modal transparent visible={imageModalVisible} animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={openCamera}>
              <Text style={styles.sheetText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={openGallery}>
              <Text style={styles.sheetText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={[styles.sheetText, { color: "red" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  profileCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    margin: 15,
    borderRadius: 15,
  },

  avatar: { width: 85, height: 85, borderRadius: 42 },

  initialAvatar: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "#e11d48",
    justifyContent: "center",
    alignItems: "center",
  },

  initialText: { fontSize: 34, fontWeight: "bold", color: "#fff" },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#e11d48",
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: { fontSize: 18, fontWeight: "bold" },
  email: { color: "#777", marginTop: 4 },
  phone: { color: "#777", marginTop: 2 },

  editText: { color: "#e11d48", marginTop: 8, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },

  saveBtn: {
    backgroundColor: "#e11d48",
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelBtn: { backgroundColor: "#999", padding: 8, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600" },

  card: { backgroundColor: "#fff", margin: 15, borderRadius: 15 },

  sectionTitle: { fontSize: 16, fontWeight: "bold", padding: 15 },

  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: "#eee",
  },

  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuText: { marginLeft: 15, fontSize: 15 },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  bottomSheet: {
    backgroundColor: "#fff",
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  sheetItem: {
    padding: 18,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  sheetCancel: {
    padding: 18,
    alignItems: "center",
    marginTop: 6,
  },

  sheetText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
