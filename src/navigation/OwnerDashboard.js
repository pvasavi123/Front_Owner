import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import COLORS from "../theme/colors";

export default function OwnerDashboard({ onLogout, navigation }) {
  // const router = useRouter();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      try {
        onLogout();
      } catch {}
    }
    if (navigation?.navigate) {
      navigation.navigate("HomeScreen");
    } else {
      navigation.navigate("/HomeScreen");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.name}>Owner Dashboard</Text>
        </View>

        {/* Gradient Cards */}
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Total Properties</Text>
          <Text style={styles.amount}>12</Text>
        </LinearGradient>

        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Total Income</Text>
          <Text style={styles.amount}>₹2,50,000</Text>
        </LinearGradient>

        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>Occupied Units</Text>
          <Text style={styles.amount}>9 / 12</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryText}>Add Property</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>View Tenants</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },

  header: {
    marginTop: 40,
    marginBottom: 25,
  },

  welcome: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginTop: 4,
  },

  card: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    elevation: 6,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
  },

  amount: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 15,
    color: COLORS.PRIMARY,
  },

  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  secondaryText: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
    fontSize: 15,
  },

  logout: {
    backgroundColor: COLORS.ERROR,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },

  logoutText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
