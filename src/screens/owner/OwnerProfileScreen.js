import COLORS from "@/src/theme/colors";
import React, { useRef, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

export default function OwnerProfile() {
  //   const {
  //     totalCollected,
  //     expenses,
  //     addExpense: ctxAddExpense,
  //     removeExpense,
  //   } = useAppContext();

  const [totalCollected] = useState(35000); // mock income collected

  const [expenses, setExpenses] = useState([
    {
      id: "1",
      category: "Electricity",
      amount: 1200,
      description: "EB bill",
      date: "10 Mar 2026",
      time: "10:30 AM",
      fullDate: new Date(),
    },
    {
      id: "2",
      category: "Water",
      amount: 800,
      description: "Water tanker",
      date: "8 Mar 2026",
      time: "03:20 PM",
      fullDate: new Date(),
    },
  ]);
  const ctxAddExpense = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const removeExpense = (id) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const initialOwner = {
    name: "Vishwa",
    role: "Hostel Owner",
    email: "vishwa@gmail.com",
    phone: "9381965301",
  };

  const property = {
    totalBeds: 96,
    occupied: 72,
    baseIncome: 5000,
    structure: [
      {
        floor: "1st Floor",
        rooms: [
          {
            id: "101",
            beds: 4,
            occupied: 3,
            tenants: ["Rahul", "Amit", "Suresh"],
          },
          {
            id: "102",
            beds: 4,
            occupied: 4,
            tenants: ["Vicky", "Sonu", "Kiran", "Deepak"],
          },
        ],
      },
      {
        floor: "2nd Floor",
        rooms: [
          { id: "201", beds: 4, occupied: 2, tenants: ["Anil", "Sunil"] },
          { id: "202", beds: 2, occupied: 1, tenants: ["Vijay"] },
        ],
      },
    ],
  };

  const [editableOwner, setEditableOwner] = useState(initialOwner);
  const [profileImage, setProfileImage] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showExpenseList, setShowExpenseList] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [showPropertyDetailsModal, setShowPropertyDetailsModal] =
    useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);

  const expenseRef = useRef(null);
  const scrollRef = useRef(null);

  const totalIncome = property.baseIncome + totalCollected;
  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const netProfit = totalIncome - totalExpenses;
  const emptyBeds = property.totalBeds - property.occupied;

  // Pie Chart Data Logic - Simplified to Expenses vs Profit
  const isLoss = netProfit <= 0;
  const chartData = isLoss
    ? [{ name: "Loss", value: 100, color: COLORS.ERROR || "#F44336" }]
    : [
        {
          name: "Expenses",
          value: totalExpenses,
          color: COLORS.ERROR || "#F44336",
        },
        {
          name: "Net Profit",
          value: netProfit,
          color: COLORS.SUCCESS || "#4CAF50",
        },
      ];

  const totalForChart = isLoss ? 100 : totalIncome || 1;
  let cumulativeValue = 0;
  const pieSegments = chartData.map((item) => {
    const percentage = isLoss ? 100 : (item.value / totalForChart) * 100;
    const startAngle = (cumulativeValue / totalForChart) * 360;
    cumulativeValue += item.value;
    return { ...item, percentage, startAngle };
  });

  const addExpenseItem = () => {
    if (!category || !amount) {
      Alert.alert("Please fill all required fields");
      return;
    }
    const now = new Date();
    const newExpense = {
      id: Date.now().toString(),
      category,
      amount,
      description,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      fullDate: now,
    };
    ctxAddExpense(newExpense);
    setCategory("");
    setAmount("");
    setDescription("");
    setShowAddExpenseForm(false);
  };

  const deleteExpenseItem = (id) => {
    removeExpense(id);
  };

  const printMonthlyStatement = async () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(
      (item) =>
        item.fullDate.getMonth() === currentMonth &&
        item.fullDate.getFullYear() === currentYear,
    );
    let total = monthlyExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const html = `
      <h1>Monthly Expense Statement</h1>
      <p>Owner: ${editableOwner.name}</p>
      <hr/>
      ${monthlyExpenses
        .map(
          (item) => `
        <p>
          <strong>${item.category}</strong><br/>
          ${item.description || ""}<br/>
          ${item.date} ${item.time}<br/>
          Amount: ₹${item.amount}
        </p>
        <hr/>
      `,
        )
        .join("")}
      <h2>Total: ₹${total}</h2>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK || "#4A148C"]}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>My Profile</Text>

          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => setShowDetailsModal(true)}
          >
            <TouchableOpacity onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {editableOwner.name.charAt(0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ marginLeft: 15 }}>
              <Text style={styles.profileName}>{editableOwner.name}</Text>
              <Text style={styles.profileRole}>{editableOwner.role}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.TEXT_LIGHT}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK || "#4A148C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profitCard}
          >
            <View style={styles.chartContainerHorizontal}>
              {/* LEFT: PIE CHART */}
              <View style={styles.pieContainer}>
                {pieSegments.map((segment, index) => (
                  <PieSlice
                    key={index}
                    color={segment.color}
                    percent={segment.percentage}
                    startAngle={segment.startAngle}
                  />
                ))}
                <View style={styles.pieInner}>
                  <Text style={styles.pieCenterPercent}>
                    {Math.round((netProfit / (totalIncome || 1)) * 100)}%
                  </Text>
                  <Text style={styles.pieCenterLabel}>
                    {netProfit > 0 ? "PROFIT" : "LOSS"}
                  </Text>
                </View>
              </View>

              {/* RIGHT: STATS BOX */}
              <View style={styles.statsBox}>
                <View style={styles.statsRowHorizontal}>
                  <Text style={styles.statsLabel}>Income</Text>
                  <Text style={styles.statsValueSmall}>₹{totalIncome}</Text>
                </View>
                <TouchableOpacity
                  style={styles.statsRowHorizontal}
                  onPress={() => {
                    setShowAddExpenseForm(!showAddExpenseForm);
                    if (!showAddExpenseForm) {
                      setTimeout(() => {
                        expenseRef.current?.measureLayout(
                          scrollRef.current,
                          (x, y) =>
                            scrollRef.current?.scrollTo({
                              y: y - 80,
                              animated: true,
                            }),
                        );
                      }, 100);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.statsLabel,
                      { color: COLORS.BLUE_LIGHT || "#2196F3" },
                    ]}
                  >
                    Expenses (Add +)
                  </Text>
                  <Text style={styles.statsValueSmall}>₹{totalExpenses}</Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.statsRowHorizontal,
                    {
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.2)",
                      paddingTop: 5,
                      marginTop: 5,
                    },
                  ]}
                >
                  <Text style={[styles.statsLabel, { fontWeight: "800" }]}>
                    Net Profit
                  </Text>
                  <Text
                    style={[
                      styles.statsValueSmall,
                      { color: COLORS.SUCCESS || "#4CAF50", fontSize: 22 },
                    ]}
                  >
                    ₹{netProfit}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {showAddExpenseForm && (
            <>
              <Text style={styles.sectionTitle}>Add Expense</Text>
              <View ref={expenseRef} style={styles.expenseBox}>
                <TextInput
                  placeholder="Category"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={category}
                  onChangeText={setCategory}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Amount"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TextInput
                  placeholder="Description (optional)"
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  value={description}
                  onChangeText={setDescription}
                  style={[
                    styles.input,
                    { height: 80, textAlignVertical: "top" },
                  ]}
                  multiline
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addExpenseItem}
                >
                  <Text style={styles.addButtonText}>Add Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: COLORS.BLUE_LIGHT, marginTop: 10 },
                  ]}
                  onPress={() => setShowExpenseList(!showExpenseList)}
                >
                  <Text
                    style={[styles.addButtonText, { color: COLORS.PRIMARY }]}
                  >
                    {showExpenseList ? "Hide Expenses" : "View Expenses"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showExpenseList &&
                expenses.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.expenseItem}
                    onPress={() => {
                      setSelectedExpense(item);
                      setExpenseModalVisible(true);
                    }}
                  >
                    <View style={styles.rowBetween}>
                      <Text
                        style={{
                          fontWeight: "600",
                          color: COLORS.TEXT_PRIMARY,
                        }}
                      >
                        {item.category}
                      </Text>
                      <Text
                        style={{
                          color: COLORS.TEXT_SECONDARY,
                          fontWeight: "700",
                        }}
                      >
                        ₹{item.amount}
                      </Text>
                    </View>
                    {item.description ? (
                      <Text
                        style={{ color: COLORS.TEXT_SECONDARY, marginTop: 4 }}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={[styles.rowBetween, { marginTop: 8 }]}>
                      <Text style={{ color: COLORS.TEXT_LIGHT, fontSize: 11 }}>
                        {item.date} • {item.time}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteExpenseItem(item.id);
                        }}
                      >
                        <Text
                          style={{
                            color: COLORS.ERROR,
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
            </>
          )}

          <View style={styles.propertyRow}>
            <MiniStat label="Total Beds" value={property.totalBeds} />
            <MiniStat label="Occupied" value={property.occupied} />
            <MiniStat label="Empty" value={emptyBeds} />
          </View>

          <Text style={styles.sectionTitle}>Account</Text>
          {[
            "Transactions",
            "Password & Security",
            "Notifications",
            "Help",
            "Edit Building Structure",
            "Property Details",
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.accountRow}
              onPress={() => {
                if (item === "Property Details")
                  setShowPropertyDetailsModal(true);
                if (item === "Edit Building Structure")
                  setShowStructureModal(true);
                if (item === "Transactions")
                  Alert.alert(
                    "Transactions",
                    "Transaction history coming soon.",
                  );
              }}
            >
              <Text style={styles.accountText}>{item}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.TEXT_LIGHT}
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.addButton, { marginTop: 25 }]}
            onPress={printMonthlyStatement}
          >
            <Text style={styles.addButtonText}>Print Monthly Statement</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>
            {!isEditing ? (
              <>
                <DetailRow label="Name" value={editableOwner.name} />
                <DetailRow label="Email" value={editableOwner.email} />
                <DetailRow label="Phone" value={editableOwner.phone} />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.primaryButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  value={editableOwner.name}
                  onChangeText={(text) =>
                    setEditableOwner({ ...editableOwner, name: text })
                  }
                  style={styles.input}
                />
                <TextInput
                  value={editableOwner.email}
                  onChangeText={(text) =>
                    setEditableOwner({ ...editableOwner, email: text })
                  }
                  style={styles.input}
                />
                <TextInput
                  value={editableOwner.phone}
                  onChangeText={(text) =>
                    setEditableOwner({ ...editableOwner, phone: text })
                  }
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setIsEditing(false);
                    Alert.alert("Profile Updated");
                  }}
                >
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={expenseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expense Details</Text>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailBox}>
              <DetailRow label="Category" value={selectedExpense?.category} />
              <DetailRow label="Amount" value={`₹${selectedExpense?.amount}`} />
              <DetailRow label="Date" value={selectedExpense?.date} />
              <DetailRow label="Time" value={selectedExpense?.time} />
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={[styles.detailValue, { marginBottom: 20 }]}>
                {selectedExpense?.description || "No description provided"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: COLORS.ERROR },
                ]}
                onPress={() => {
                  deleteExpenseItem(selectedExpense?.id);
                  setExpenseModalVisible(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Delete Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPropertyDetailsModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                height: "70%",
                borderTopLeftRadius: 35,
                borderTopRightRadius: 35,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Property Details</Text>
                <Text style={{ fontSize: 12, color: COLORS.TEXT_LIGHT }}>
                  Building Configuration & Capacity
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPropertyDetailsModal(false)}
                style={styles.closeModalCircle}
              >
                <Ionicons name="close" size={22} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginTop: 10 }}
            >
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  Capacity Information
                </Text>
                <FormRow
                  label="Total Bed Capacity"
                  value={property.totalBeds}
                  icon="bed-outline"
                />
                <FormRow
                  label="Currently Occupied"
                  value={property.occupied}
                  icon="people-outline"
                />
                <FormRow
                  label="Available Beds"
                  value={emptyBeds}
                  icon="checkmark-circle-outline"
                  highlight
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Financial Config</Text>
                <FormRow
                  label="Base Monthly Income"
                  value={`₹${property.baseIncome}`}
                  icon="cash-outline"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Operational Status</Text>
                <FormRow
                  label="Building Status"
                  value="Active"
                  icon="business-outline"
                />
                <FormRow
                  label="Utilities"
                  value="Functional"
                  icon="flash-outline"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  marginTop: 20,
                  borderRadius: 20,
                  height: 55,
                  justifyContent: "center",
                },
              ]}
              onPress={() => setShowPropertyDetailsModal(false)}
            >
              <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>
                Back to Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL BUILDING STRUCTURE ================= */}
      <Modal
        visible={showStructureModal}
        animationType="slide"
        transparent
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Building Structure</Text>
              <TouchableOpacity onPress={() => setShowStructureModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.structureList}>
                {property.structure?.map((floor, fIdx) => (
                  <View key={fIdx} style={styles.floorSection}>
                    <Text style={styles.floorTitle}>{floor.floor}</Text>
                    {floor.rooms.map((room, rIdx) => (
                      <View key={rIdx} style={styles.roomItem}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.roomName}>Room {room.id}</Text>
                          <Text style={styles.roomMeta}>
                            {room.occupied}/{room.beds} Beds
                          </Text>
                        </View>
                        <Text style={styles.tenantList}>
                          Tenants: {room.tenants.join(", ")}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    marginTop: 20,
                    backgroundColor: COLORS.SUCCESS || "#4CAF50",
                    flexDirection: "row",
                  },
                ]}
                onPress={() =>
                  Alert.alert("Add Account", "Opening account setup form...")
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={COLORS.WHITE}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addButtonText}>Add Account</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 15 }]}
              onPress={() => setShowStructureModal(false)}
            >
              <Text style={styles.primaryButtonText}>Close View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StatCard = ({ title, value, onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {onPress && (
      <Ionicons
        name="chevron-down"
        size={14}
        color={COLORS.TEXT_LIGHT}
        style={{ position: "absolute", top: 12, right: 12 }}
      />
    )}
  </TouchableOpacity>
);

const MiniStat = ({ label, value }) => (
  <View style={styles.miniStat}>
    <Text style={styles.miniValue}>{value}</Text>
    <Text style={styles.miniLabel}>{label}</Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={{ marginBottom: 15, minWidth: "40%" }}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const PieSlice = ({ color, percent, startAngle }) => {
  const rotation = startAngle;
  // For percentages > 50, we need a special handling if we were doing true pie slices with Views.
  // However, for a high-fidelity look without SVG, we'll use a "Segmented Progress Ring" approach
  // that looks like a pie chart but is more robust.
  const isLarge = percent > 50;

  return (
    <View
      style={[
        styles.pieSliceBase,
        { transform: [{ rotate: `${rotation}deg` }] },
      ]}
    >
      <View
        style={[
          styles.pieSliceInner,
          {
            backgroundColor: color,
            transform: [{ rotate: `${(percent / 100) * 360}deg` }],
          },
        ]}
      />
      {isLarge && (
        <View
          style={[
            styles.pieSliceInner,
            { backgroundColor: color, transform: [{ rotate: "180deg" }] },
          ]}
        />
      )}
    </View>
  );
};

const FormRow = ({ label, value, icon, highlight }) => (
  <View style={styles.formRow}>
    <View style={styles.formIconBox}>
      <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.formLabel}>{label}</Text>
      <Text
        style={[
          styles.formValue,
          highlight && { color: COLORS.SUCCESS, fontWeight: "800" },
        ]}
      >
        {value}
      </Text>
    </View>
    {highlight && <Ionicons name="star" size={16} color="#FFD700" />}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  hero: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 80,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.WHITE,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 20,
    elevation: 5,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: COLORS.WHITE, fontSize: 22, fontWeight: "700" },
  profileName: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  profileRole: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  content: { padding: 20, marginTop: -40 },
  dashboardRow: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 18,
    elevation: 3,
  },
  statTitle: { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.TEXT_PRIMARY,
  },
  profitCard: {
    marginTop: 10,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    padding: 20,
  },
  chartContainerHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsBox: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 20,
    flex: 1,
    marginLeft: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  statsRowHorizontal: {
    marginBottom: 8,
  },
  statsLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsValueSmall: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "800",
  },
  integratedLegend: {
    marginTop: 25,
    width: "100%",
    paddingHorizontal: 10,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  profitLabel: { color: COLORS.WHITE, fontSize: 14 },
  profitValue: {
    color: COLORS.WHITE,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  propertyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  miniStat: {
    width: "31%",
    backgroundColor: COLORS.WHITE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  miniValue: { fontSize: 18, fontWeight: "800", color: COLORS.PRIMARY },
  miniLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.WHITE,
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
  },
  accountText: { fontSize: 15, color: COLORS.TEXT_PRIMARY },
  logoutButton: { marginTop: 30, alignItems: "center" },
  logoutText: { color: COLORS.ERROR, fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.WHITE,
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  detailLabel: { fontSize: 12, color: COLORS.TEXT_LIGHT },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15,
  },
  primaryButtonText: { color: COLORS.WHITE, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: COLORS.WHITE,
    color: COLORS.TEXT_PRIMARY,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  addButtonText: { color: COLORS.WHITE, fontWeight: "700", fontSize: 15 },
  expenseItem: {
    backgroundColor: COLORS.WHITE,
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  expenseBox: { backgroundColor: COLORS.WHITE, padding: 18, borderRadius: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    marginTop: 28,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pieContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  pieSliceBase: {
    position: "absolute",
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  pieSliceInner: {
    position: "absolute",
    width: 70,
    height: 140,
    left: 70,
    borderTopRightRadius: 70,
    borderBottomRightRadius: 70,
    transformOrigin: "left center",
  },
  pieInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 20,
  },
  pieCenterPercent: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.WHITE,
  },
  pieCenterLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
    marginTop: -2,
  },
  detailBox: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 15,
  },
  structureList: { marginTop: 10 },
  floorSection: { marginBottom: 20 },
  floorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginBottom: 10,
  },
  roomItem: {
    backgroundColor: COLORS.BACKGROUND,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  roomName: { fontSize: 15, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  roomMeta: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  tenantList: { fontSize: 13, color: COLORS.TEXT_LIGHT, marginTop: 5 },
  formSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT_LIGHT,
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  formIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  formLabel: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  formValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },
  closeModalCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
});
