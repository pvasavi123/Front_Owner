import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Replace this with: import COLORS from './colors';
const COLORS = {
  PRIMARY: "#5F259F",
  PRIMARY_LIGHT: "#7A3FC4",
  PRIMARY_DARK: "#4A1D7A",
  WHITE: "#FFFFFF",
  BACKGROUND: "#F5F5F5",
  CARD: "#EEEEEE",
  TEXT_PRIMARY: "#212121",
  TEXT_SECONDARY: "#757575",
  TEXT_LIGHT: "#9E9E9E",
  SUCCESS: "#16A34A",
  ERROR: "#DC2626",
  WARNING: "#F59E0B",
  INFO: "#2563EB",
  BORDER: "#E0E0E0",
  DIVIDER: "#D6D6D6",
  GOLD: "#D4AF37",
  BLUE_LIGHT: "#E3F2FD",
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function IssuesScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [issues, setIssues] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // Aligned with your specific STATUS colors
  const priorities = [
    { label: "Low", color: COLORS.INFO, bg: COLORS.BLUE_LIGHT },
    { label: "Medium", color: COLORS.WARNING, bg: `${COLORS.WARNING}15` },
    { label: "High", color: COLORS.ERROR, bg: `${COLORS.ERROR}15` },
  ];

  const stats = useMemo(
    () => ({
      total: issues.length,
      high: issues.filter((i) => i.priority === "High").length,
      resolved: issues.filter((i) => i.status === "Resolved").length,
    }),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    if (activeFilter === "All") return issues;
    return issues.filter((i) => i.priority === activeFilter);
  }, [issues, activeFilter]);

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFormVisible(!isFormVisible);
    if (isFormVisible && editingId) {
      setEditingId(null);
      setTitle("");
      setDescription("");
      setImage(null);
      setPriority("Medium");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.2,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitIssue = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Details", "Please provide a title and description.");
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (editingId) {
      setIssues(
        issues.map((i) =>
          i.id === editingId
            ? { ...i, title, description, image, priority }
            : i,
        ),
      );
      setEditingId(null);
    } else {
      setIssues([
        {
          id: Date.now(),
          title,
          description,
          image,
          priority,
          date: dateStr,
          status: "Open",
        },
        ...issues,
      ]);
    }

    setTitle("");
    setDescription("");
    setImage(null);
    setPriority("Medium");
    setIsFormVisible(false);
  };

  const deleteIssue = (id) => {
    Alert.alert("Confirm Deletion", "Remove this issue permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIssues(issues.filter((i) => i.id !== id));
        },
      },
    ]);
  };

  const startEdit = (item) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTitle(item.title);
    setDescription(item.description);
    setImage(item.image);
    setPriority(item.priority);
    setEditingId(item.id);
    setIsFormVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Workspace</Text>
          <Text style={styles.headerTitle}>Issue Tracker</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={toggleForm}>
          <Ionicons
            name={isFormVisible ? "close" : "add"}
            size={22}
            color={COLORS.WHITE}
          />
          <Text style={styles.addButtonText}>
            {isFormVisible ? "Cancel" : "New Issue"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DASHBOARD STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.ERROR, borderLeftWidth: 3 },
            ]}
          >
            <Text style={styles.statNumber}>{stats.high}</Text>
            <Text style={styles.statLabel}>High Severity</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderLeftColor: COLORS.SUCCESS, borderLeftWidth: 3 },
            ]}
          >
            <Text style={styles.statNumber}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        {/* COLLAPSIBLE FORM CARD */}
        {isFormVisible && (
          <View style={styles.formCard}>
            <Text style={styles.formHeader}>
              {editingId ? "Update Issue Details" : "Report a New Issue"}
            </Text>

            <Text style={styles.inputLabel}>SUBJECT</Text>
            <TextInput
              placeholder="E.g. Database connection timeout"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              placeholder="Steps to reproduce or details..."
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={COLORS.TEXT_LIGHT}
            />

            <Text style={styles.inputLabel}>SEVERITY LEVEL</Text>
            <View style={styles.priorityGroup}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => setPriority(p.label)}
                  style={[
                    styles.priorityChip,
                    priority === p.label && {
                      backgroundColor: p.color,
                      borderColor: p.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p.label && { color: COLORS.WHITE },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                <Feather
                  name={image ? "check" : "paperclip"}
                  size={18}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.attachText}>
                  {image ? "Attached" : "Attach File"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={submitIssue}>
                <Text style={styles.submitBtnText}>
                  {editingId ? "Save Changes" : "Submit Issue"}
                </Text>
                <Ionicons
                  name="send"
                  size={14}
                  color={COLORS.WHITE}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            {image && (
              <Image source={{ uri: image }} style={styles.previewImage} />
            )}
          </View>
        )}

        {/* LIST FILTERS */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Active Tickets</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {["All", "High", "Medium", "Low"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setActiveFilter(f);
                }}
                style={[
                  styles.filterChip,
                  activeFilter === f && { backgroundColor: COLORS.PRIMARY },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f && { color: COLORS.WHITE },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ISSUES FEED */}
        {filteredIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={54}
              color={COLORS.TEXT_LIGHT}
            />
            <Text style={styles.emptyTitle}>No issues found</Text>
            <Text style={styles.emptySub}>You're all caught up for now.</Text>
          </View>
        ) : (
          filteredIssues.map((item) => {
            const pData = priorities.find((p) => p.label === item.priority);
            return (
              <View key={item.id} style={styles.issueCard}>
                <View style={styles.issueTopRow}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: pData.color },
                    ]}
                  />
                  <Text style={styles.issueDate}>{item.date}</Text>
                </View>

                <Text style={styles.issueTitle}>{item.title}</Text>
                <Text style={styles.issueDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.issueImage}
                  />
                )}

                <View style={styles.issueFooter}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: pData.bg },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: pData.color }]}>
                      {item.priority} Severity
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      style={styles.iconBtn}
                    >
                      <Feather
                        name="edit-2"
                        size={16}
                        color={COLORS.TEXT_SECONDARY}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteIssue(item.id)}
                      style={styles.iconBtn}
                    >
                      <Feather name="trash-2" size={16} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Header
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },

  // Dashboard Stats
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textTransform: "uppercase",
  },

  // Collapsible Form
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 24,
    elevation: 4,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },

  priorityGroup: { flexDirection: "row", gap: 10, marginBottom: 24 },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },

  formFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  attachText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginLeft: 6,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: { color: COLORS.WHITE, fontSize: 14, fontWeight: "700" },
  previewImage: { width: "100%", height: 140, borderRadius: 10, marginTop: 16 },

  // Filters & List Header
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginRight: 16,
  },
  filterScroll: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.BORDER,
  },
  filterText: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
  },
  emptySub: { fontSize: 13, color: COLORS.TEXT_LIGHT, marginTop: 4 },

  // Issue Card
  issueCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 16,
    elevation: 1,
  },
  issueTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  issueDate: { fontSize: 12, color: COLORS.TEXT_LIGHT, fontWeight: "600" },

  issueTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  issueDesc: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 16,
  },
  issueImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },

  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    paddingTop: 16,
  },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  severityText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  actionButtons: { flexDirection: "row", gap: 16 },
  iconBtn: { padding: 4 },
});
