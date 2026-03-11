import COLORS from "@/src/theme/colors";
import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OwnerPayment = () => {
  const [payments, setPayments] = useState([
    {
      id: "p1",
      tenant: "Amit",
      amount: 1200,
      status: "collected",
      month: "February 2026",
      date: "Feb 28, 2026",
      time: "10:30 AM",
      rawDate: "2026-02-28T00:00:00.000Z",
      phone: "9876543210",
    },
    {
      id: "p2",
      tenant: "Priya",
      amount: 800,
      status: "pending",
      month: "February 2026",
      date: "Feb 27, 2026",
      time: "02:15 PM",
      rawDate: "2026-02-27T00:00:00.000Z",
      phone: "9123456789",
    },
    {
      id: "p3",
      tenant: "Ravi",
      amount: 600,
      status: "pending",
      month: "February 2026",
      date: "Feb 26, 2026",
      time: "11:00 AM",
      rawDate: "2026-02-26T00:00:00.000Z",
      phone: "9988776655",
    },
    {
      id: "p4",
      tenant: "Neha",
      amount: 900,
      status: "collected",
      month: "January 2026",
      date: "Jan 30, 2026",
      time: "09:45 AM",
      rawDate: "2026-01-30T00:00:00.000Z",
      phone: "9887766554",
    },
  ]);
  const ctxAddPayment = (payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  const updatePaymentStatus = (id, status) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  };

  const removePayment = (id) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };
  const [selectedMonth, setSelectedMonth] = useState("February 2026");
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const [filterMode, setFilterMode] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);

  const months = [
    "February 2026",
    "January 2026",
    "December 2025",
    "November 2025",
    "October 2025",
  ];

  const monthPaymentsAll = payments.filter((p) => p.month === selectedMonth);
  const monthPayments =
    filterMode === "collected"
      ? monthPaymentsAll.filter((p) => p.status === "collected")
      : filterMode === "pending"
        ? monthPaymentsAll.filter((p) => p.status === "pending")
        : monthPaymentsAll;

  const addPayment = () => {
    const amt = parseFloat(String(amount).replace(/[^0-9.]/g, "")) || 0;
    if (!tenantName.trim() || amt <= 0) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const item = {
      id: String(Date.now()),
      tenant: tenantName.trim(),
      amount: amt,
      status: "pending",
      month: selectedMonth,
      date: dateStr,
      time: timeStr,
      rawDate: now.toISOString(), // Store raw date for reliable parsing
      phone: phone.trim() || "0000000000",
    };
    ctxAddPayment(item);
    setTenantName("");
    setAmount("");
    setPhone("");
    setAddVisible(false);
  };

  const updateStatus = (id, status) => {
    updatePaymentStatus(id, status);
    setOptionsVisible(false);
  };

  const removePaymentItem = (id) => {
    removePayment(id);
    setOptionsVisible(false);
  };

  const openOptions = (payment) => {
    setSelectedPayment(payment);
    setOptionsVisible(true);
  };

  const sendReminder = (payment) => {
    Alert.alert("Reminder Sent", `Reminder sent to ${payment?.tenant}`);
    setOptionsVisible(false);
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const getRelativeDueDate = (payment) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let dueDate;
      if (payment.rawDate) {
        dueDate = new Date(payment.rawDate);
      } else if (payment.date) {
        // Manual parsing for "Feb 28, 2026"
        const parts = payment.date.replace(",", "").split(" ");
        if (parts.length === 3) {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames.indexOf(parts[0]);
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (month !== -1 && !isNaN(day) && !isNaN(year)) {
            dueDate = new Date(year, month, day);
          }
        }
      }

      if (!dueDate || isNaN(dueDate.getTime())) {
        dueDate = new Date(payment.date);
      }

      if (isNaN(dueDate.getTime())) return "";

      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "due today";
      if (diffDays === 1) return "due in 1 day";
      if (diffDays > 1) return `due in ${diffDays} days`;
      if (diffDays === -1) return "due from 1 day";
      if (diffDays < -1) return `due from ${Math.abs(diffDays)} days`;
      return "due today";
    } catch (e) {
      return "";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fee Management</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setMonthPickerVisible(true)}
        >
          <Text style={styles.dropdownText}>{selectedMonth}</Text>
          <Icon name="chevron-down" size={16} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setFilterMode("collected")}
          style={{ width: "44%" }}
        >
          <LinearGradient
            colors={[COLORS.INFO, COLORS.INFO]}
            style={styles.card}
          >
            <Text
              style={styles.cardLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Collected
            </Text>
            <Text
              style={[styles.amount, { color: COLORS.WHITE }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              ₹
              {monthPaymentsAll
                .filter((p) => p.status === "collected")
                .reduce((s, x) => s + x.amount, 0)
                .toLocaleString("en-IN")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setFilterMode("pending")}
          style={{ width: "44%" }}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY_LIGHT]}
            style={styles.card}
          >
            <Text
              style={styles.cardLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Pending
            </Text>
            <Text
              style={[styles.amount, { color: COLORS.WHITE }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              ₹
              {monthPaymentsAll
                .filter((p) => p.status === "pending")
                .reduce((s, x) => s + x.amount, 0)
                .toLocaleString("en-IN")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tenant Payments</Text>
        </View>

        <View style={styles.filterRow}>
          {["all", "collected", "pending"].map((x) => (
            <TouchableOpacity
              key={x}
              style={[
                styles.filterBtn,
                filterMode === x && styles.filterBtnActive,
              ]}
              onPress={() => setFilterMode(x)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterMode === x && styles.filterTextActive,
                ]}
              >
                {x[0].toUpperCase() + x.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {monthPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="users" size={32} color={COLORS.TEXT_LIGHT} />
            <Text style={styles.emptyText}>No tenants yet</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            <ScrollView style={{ maxHeight: 400 }}>
              {monthPayments.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.row}
                  onPress={() => openOptions(p)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{p.tenant}</Text>
                    <Text style={styles.rowMeta}>
                      {p.date} • {p.time}
                      {p.status === "pending" && (
                        <Text
                          style={{
                            color: getRelativeDueDate(p).includes("due from")
                              ? COLORS.ERROR
                              : COLORS.WARNING,
                            fontWeight: "600",
                          }}
                        >
                          {" • "}
                          {getRelativeDueDate(p)}
                        </Text>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>₹{p.amount}</Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={COLORS.DIVIDER}
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setAddVisible(true)}
            >
              <Text style={styles.addBtnText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal transparent visible={monthPickerVisible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            {months.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.pickerItem,
                  selectedMonth === m && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedMonth(m);
                  setMonthPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerText,
                    selectedMonth === m && styles.pickerTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMonthPickerVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={addVisible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.addCard}>
            <Text style={styles.modalTitle}>Add Payment</Text>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Tenant Name</Text>
              <TextInput
                value={tenantName}
                onChangeText={setTenantName}
                style={styles.input}
                placeholder="Enter name"
              />
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="Enter 10 digit number"
                keyboardType="phone-pad"
                textContentType="none"
                autoComplete="off"
              />
            </View>
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
                placeholder="₹0"
                keyboardType="numeric"
                textContentType="none"
                autoComplete="off"
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.CARD }]}
                onPress={() => {
                  setAddVisible(false);
                  setTenantName("");
                  setAmount("");
                  setPhone("");
                }}
              >
                <Text
                  style={[styles.modalBtnText, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.PRIMARY }]}
                onPress={addPayment}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.WHITE }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={optionsVisible} animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetCloser}
            activeOpacity={1}
            onPress={() => setOptionsVisible(false)}
          />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Options</Text>
              <Text style={styles.sheetSubtitle}>
                {selectedPayment?.tenant} {" • "} ₹{selectedPayment?.amount}
              </Text>
            </View>

            <View style={styles.sheetBody}>
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => updateStatus(selectedPayment?.id, "collected")}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.SUCCESS}15` },
                  ]}
                >
                  <Icon name="check-circle" size={20} color={COLORS.SUCCESS} />
                </View>
                <Text style={styles.sheetItemText}>Mark as Received</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => updateStatus(selectedPayment?.id, "pending")}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.WARNING}15` },
                  ]}
                >
                  <Icon name="clock" size={20} color={COLORS.WARNING} />
                </View>
                <Text style={styles.sheetItemText}>Mark as Pending</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => handleCall(selectedPayment?.phone)}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.INFO}15` },
                  ]}
                >
                  <Icon name="phone" size={20} color={COLORS.INFO} />
                </View>
                <Text style={styles.sheetItemText}>
                  Call {selectedPayment?.tenant}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setOptionsVisible(false);
                  setTranscriptVisible(true);
                }}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.PRIMARY}15` },
                  ]}
                >
                  <Icon name="file-text" size={20} color={COLORS.PRIMARY} />
                </View>
                <Text style={styles.sheetItemText}>View Transcript</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => sendReminder(selectedPayment)}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.INFO}15` },
                  ]}
                >
                  <Icon name="bell" size={20} color={COLORS.INFO} />
                </View>
                <Text style={styles.sheetItemText}>Send Reminder</Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => removePaymentItem(selectedPayment?.id)}
              >
                <View
                  style={[
                    styles.sheetIconBox,
                    { backgroundColor: `${COLORS.ERROR}15` },
                  ]}
                >
                  <Icon name="trash-2" size={20} color={COLORS.ERROR} />
                </View>
                <Text style={[styles.sheetItemText, { color: COLORS.ERROR }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setOptionsVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={transcriptVisible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <View>
                <Text style={styles.transcriptTitle}>Payment Receipt</Text>
                <Text style={styles.transcriptSubtitle}>
                  Transaction ID: {selectedPayment?.id}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedPayment?.status === "collected"
                        ? "#E8F5E9"
                        : "#FFF3E0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        selectedPayment?.status === "collected"
                          ? COLORS.SUCCESS
                          : COLORS.WARNING,
                    },
                  ]}
                >
                  {selectedPayment?.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.transcriptBody}>
              <View style={styles.transcriptInfoRow}>
                <Text style={styles.transcriptLabel}>Tenant Name</Text>
                <Text style={styles.transcriptValue}>
                  {selectedPayment?.tenant}
                </Text>
              </View>
              <View style={styles.transcriptInfoRow}>
                <Text style={styles.transcriptLabel}>Phone Number</Text>
                <Text style={styles.transcriptValue}>
                  {selectedPayment?.phone || "N/A"}
                </Text>
              </View>
              <View style={styles.transcriptInfoRow}>
                <Text style={styles.transcriptLabel}>Payment Month</Text>
                <Text style={styles.transcriptValue}>
                  {selectedPayment?.month}
                </Text>
              </View>
              <View style={styles.transcriptInfoRow}>
                <Text style={styles.transcriptLabel}>Date & Time</Text>
                <Text style={styles.transcriptValue}>
                  {selectedPayment?.date} {" at "} {selectedPayment?.time}
                </Text>{" "}
              </View>

              <View style={styles.transcriptDivider} />

              <View style={styles.transcriptTotalRow}>
                <Text style={styles.transcriptTotalLabel}>Amount Received</Text>
                <Text style={styles.transcriptTotalValue}>
                  ₹{selectedPayment?.amount}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.transcriptCloseBtn}
              onPress={() => setTranscriptVisible(false)}
            >
              <Text style={styles.transcriptCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OwnerPayment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 26,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    marginBottom: 25,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
  },

  dropdownText: {
    color: COLORS.WHITE,
    fontSize: 13,
    marginRight: 6,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 12,
  },

  card: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    minHeight: 90,
    justifyContent: "center",
    alignItems: "center",
  },

  cardLabel: {
    fontSize: 13,
    color: "#FFFFFF",
    marginBottom: 10,
  },

  amount: {
    fontSize: 24,
    fontWeight: "800",
  },

  sectionWrapper: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 14,
    overflow: "hidden",
  },

  sectionHeader: {
    backgroundColor: COLORS.PRIMARY_DARK,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },

  sectionTitle: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: COLORS.BACKGROUND,
    paddingVertical: 50,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },

  listCard: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
  filterBtnActive: {
    backgroundColor: COLORS.BLUE_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  filterTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  rowMeta: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  rowAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetCloser: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.DIVIDER,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.ERROR, // As requested previously
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  sheetBody: {
    width: "100%",
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sheetItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginVertical: 8,
  },
  sheetCancelBtn: {
    marginTop: 15,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  addBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  pickerCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    width: "100%",
    maxWidth: 380,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  pickerText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  pickerTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginTop: 10,
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
  addCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    width: "100%",
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 16, // Increased font size
    color: COLORS.TEXT_PRIMARY,
  },
  modalBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalBtnText: {
    fontWeight: "700",
  },
  transcriptCard: {
    backgroundColor: COLORS.WHITE,
    width: "90%",
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  transcriptTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  transcriptSubtitle: {
    fontSize: 11,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  transcriptBody: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 16,
    marginBottom: 24,
  },
  transcriptInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  transcriptValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  transcriptDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 15,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  transcriptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transcriptTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  transcriptTotalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  transcriptCloseBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  transcriptCloseText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "700",
  },
});
