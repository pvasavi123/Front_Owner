import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
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
import COLORS from "../../theme/colors";

export default function IssuesScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [issues, setIssues] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      const selected = result.assets[0];

      const fileSize = selected.fileSize;

      if (fileSize && fileSize > 10 * 1024) {
        Alert.alert("Error", "Image size must be less than 10KB");
        return;
      }

      setImage(selected.uri);
    }
  };

  const openImage = (img) => {
    setSelectedImage(img);
    setModalVisible(true);
  };

  const raiseIssue = () => {
    if (!title || !description) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (editingId) {
      const updated = issues.map((item) =>
        item.id === editingId ? { ...item, title, description, image } : item,
      );
      setIssues(updated);
      setEditingId(null);
      Alert.alert("Updated", "Complaint updated successfully");
    } else {
      const newIssue = {
        id: Date.now(),
        title,
        description,
        image,
        status: "Under Review",
      };

      setIssues([newIssue, ...issues]);
      Alert.alert("Success", "Complaint submitted");
    }

    setTitle("");
    setDescription("");
    setImage(null);
  };

  const deleteIssue = (id) => {
    Alert.alert("Delete", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setIssues(issues.filter((item) => item.id !== id)),
      },
    ]);
  };

  const editIssue = (item) => {
    setTitle(item.title);
    setDescription(item.description);
    setImage(item.image);
    setEditingId(item.id);
  };

  const statusColor = (status) =>
    status === "Issue Resolved"
      ? "#2e7d32"
      : status === "Not Resolved"
        ? "#c62828"
        : "#ff9800";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.heading}>Support</Text>

        <View style={styles.card}>
          {/* LABEL ADDED */}
          <Text style={styles.label}>Issue Title</Text>

          <TextInput
            placeholder="Issue Title"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* LABEL ADDED */}
          <Text style={styles.label}>Description</Text>

          <TextInput
            placeholder="Describe your issue..."
            style={[styles.input, { height: 90 }]}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={styles.uploadText}>
              {image ? "Image Selected ✓" : "Attach Image (Optional)"}
            </Text>
          </TouchableOpacity>

          {image && (
            <TouchableOpacity onPress={() => openImage(image)}>
              <Image source={{ uri: image }} style={styles.preview} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={raiseIssue}>
            <Text style={styles.submitText}>
              {editingId ? "Update" : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subHeading}>Your Complaints</Text>

        {issues.length === 0 ? (
          <Text style={styles.empty}>No complaints yet.</Text>
        ) : (
          issues.map((item) => (
            <View
              key={item.id}
              style={[
                styles.issueCard,
                { borderLeftColor: statusColor(item.status) },
              ]}
            >
              <View style={styles.statusRow}>
                <Text style={styles.issueTitle}>{item.title}</Text>
                <Text
                  style={[styles.status, { color: statusColor(item.status) }]}
                >
                  {item.status}
                </Text>
              </View>

              <Text style={styles.issueDesc}>{item.description}</Text>

              {item.image && (
                <TouchableOpacity onPress={() => openImage(item.image)}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => editIssue(item)}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteIssue(item.id)}
                >
                  <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Image source={{ uri: selectedImage }} style={styles.fullImage} />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    color: COLORS.TEXT_PRIMARY,
  },

  subHeading: {
    fontSize: 19,
    fontWeight: "600",
    marginTop: 28,
    marginBottom: 12,
    color: COLORS.TEXT_PRIMARY,
  },

  card: {
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: COLORS.TEXT_PRIMARY,
  },

  input: {
    backgroundColor: COLORS.CARD,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  uploadBtn: {
    backgroundColor: COLORS.BLUE_LIGHT,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  uploadText: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },

  preview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 12,
  },

  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
  },

  submitText: {
    color: COLORS.WHITE,
    fontWeight: "bold",
    fontSize: 15,
  },

  empty: {
    color: "#888",
    marginTop: 10,
  },

  issueCard: {
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 5,
    elevation: 2,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  issueTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },

  issueDesc: {
    color: "#666",
    marginVertical: 8,
    lineHeight: 20,
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
  },

  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginTop: 8,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },

  editBtn: {
    marginRight: 18,
  },

  deleteBtn: {},

  actionText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "95%",
    height: "70%",
    resizeMode: "contain",
  },
});
