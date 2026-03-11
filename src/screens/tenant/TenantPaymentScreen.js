import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

import {
    Dimensions,
    LayoutAnimation,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../../theme/colors";

const { width } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PaymentScreen = () => {
  const [method, setMethod] = useState("upi");
  const [property] = useState("Hostel");

  const config = {
    Hostel: { color: COLORS.PRIMARY, label: "HOSTEL UNIT" },
    Apartment: { color: COLORS.PRIMARY, label: "APARTMENT RESIDENCE" },
    Commercial: { color: COLORS.PRIMARY, label: "COMMERCIAL SPACE" },
  };

  const currentConfig = config[property];

  const renderInput = (label, placeholder, icon, isHalf = false) => (
    <View style={[styles.inputGroup, isHalf && { flex: 1 }]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color="#94A3B8" />
        <TextInput
          placeholder={placeholder}
          style={styles.textInput}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. ZEN PROPERTY SWITCHER (NO TEXT, NO ICONS) */}
      {/* <View style={styles.propertyHeader}>
        {["Hostel", "Apartment", "Commercial"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
              setProperty(type);
            }}
            style={[
              styles.propertyButton,
              property === type && {
                backgroundColor: config[type].color,
              },
            ]}
          >
            <Text
              style={[
                styles.propertyText,
                property === type && { color: "#fff" },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* 2. DYNAMIC BILL CARD (CONTEXT REVEALED HERE) */}
        <View style={styles.cardPadding}>
          <LinearGradient
            colors={[currentConfig.color, COLORS.PRIMARY_DARK]}
            style={styles.billCard}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{currentConfig.label}</Text>
              <Text style={styles.cardDate}>FEB 2026</Text>
            </View>
            <Text style={styles.mainAmount}>
              ₹
              {property === "Hostel"
                ? "5,000"
                : property === "Apartment"
                  ? "25,000"
                  : "85,000"}
            </Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardSub}>Service ID: #TENT-9921</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={COLORS.PRIMARY}
                />
                <Text style={[styles.verifiedText, { color: COLORS.PRIMARY }]}>
                  Verified
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 3. PAYMENT CATEGORIES */}
        <View style={styles.methodBar}>
          {[
            { id: "upi", icon: "flash", label: "UPI" },
            { id: "card", icon: "card", label: "Cards" },
            { id: "net", icon: "business", label: "Bank" },
            { id: "wallet", icon: "wallet", label: "Wallet" },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setMethod(item.id);
              }}
              style={[
                styles.methodTab,
                method === item.id && {
                  borderColor: currentConfig.color,
                  elevation: 4,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={method === item.id ? currentConfig.color : "#94A3B8"}
              />
              <Text
                style={[
                  styles.methodTabText,
                  {
                    color: method === item.id ? currentConfig.color : "#94A3B8",
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. DYNAMIC FORMS */}
        <View style={styles.formArea}>
          {method === "card" && (
            <View>
              {renderInput("CARDHOLDER NAME", "Full Name", "person-outline")}
              {renderInput(
                "CARD NUMBER",
                "xxxx xxxx xxxx xxxx",
                "card-outline",
              )}
              <View style={{ flexDirection: "row", gap: 15 }}>
                {renderInput("EXPIRY", "MM/YY", "calendar-outline", true)}
                {renderInput("CVV", "***", "lock-closed-outline", true)}
              </View>
            </View>
          )}

          {method === "upi" && (
            <View style={styles.upiGrid}>
              {/* PhonePe */}
              <TouchableOpacity
                style={[styles.upiBtn, { borderColor: COLORS.PRIMARY }]}
              >
                <View style={styles.phonePeIcon}>
                  <Text style={styles.phonePeText}>पे</Text>
                </View>
                <Text style={[styles.upiBtnText, { color: COLORS.PRIMARY }]}>
                  PhonePe
                </Text>
              </TouchableOpacity>

              {/* Google Pay */}
              <TouchableOpacity
                style={[styles.upiBtn, { borderColor: COLORS.PRIMARY }]}
              >
                <Ionicons name="logo-google" size={22} color={COLORS.PRIMARY} />
                <Text style={[styles.upiBtnText, { color: COLORS.PRIMARY }]}>
                  GPay
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. STICKY FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerDetails}>
          <Text style={styles.footerLabel}>Grand Total</Text>
          <Text style={styles.footerTotal}>
            ₹
            {property === "Hostel"
              ? "5,000"
              : property === "Apartment"
                ? "25,050"
                : "85,500"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payNowBtn, { backgroundColor: currentConfig.color }]}
        >
          <Text style={styles.payNowText}>Pay Now</Text>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // ZEN HEADER STYLES
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    paddingTop: Platform.OS === "ios" ? 10 : 40,
  },
  colorPill: {
    height: 12,
    borderRadius: 6,
  },
  activePill: {
    width: 40,
    opacity: 1,
    elevation: 10,
    shadowColor: "#fff",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  inactivePill: {
    width: 12,
    opacity: 0.3,
  },

  cardPadding: { padding: 20, marginTop: -10 },
  billCard: {
    height: 200,
    borderRadius: 32,
    padding: 25,
    justifyContent: "space-between",
    elevation: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  cardDate: { color: "#fff", fontSize: 12, fontWeight: "700" },
  mainAmount: { color: "#fff", fontSize: 42, fontWeight: "800" },
  cardSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },
  phonePeIcon: {
    width: 25,
    height: 25,
    borderRadius: 14,
    backgroundColor: "#5f259f", // PhonePe purple
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  phonePeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  methodBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  methodTab: {
    alignItems: "center",
    width: (width - 60) / 4,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  methodTabText: { fontSize: 11, fontWeight: "800", marginTop: 8 },

  formArea: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748B",
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    height: 55,
    marginLeft: 12,
    color: "#1E293B",
    fontWeight: "700",
  },

  upiGrid: { flexDirection: "row", gap: 12 },
  upiBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1.5,
  },
  upiBtnText: { marginTop: 6, fontSize: 12, fontWeight: "800" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 40,
  },
  footerDetails: { flex: 1 },
  footerLabel: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  footerTotal: { fontSize: 26, fontWeight: "900", color: "#1E293B" },
  payNowBtn: {
    flex: 1.5,
    height: 65,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 10,
  },
  payNowText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});

export default PaymentScreen;
