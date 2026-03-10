import Ionicons from "@expo/vector-icons/Ionicons";
// import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import COLORS from "../../theme/colors";
const WHITE = COLORS.WHITE;
const NAVY = COLORS.PRIMARY;
const LIGHT_PURPLE = COLORS.PRIMARY_LIGHT;
const GRAY = COLORS.TEXT_SECONDARY;
const LIGHT_GRAY = COLORS.CARD;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  // const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const removeEmojis = (text) => {
    return text.replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{27BF}]/gu, "");
  };

  const validateForm = () => {
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.trim().length < 8) {
      newErrors.password = "Minimum 8 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValid = emailRegex.test(email.trim()) && password.trim().length >= 6;

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch("http://192.168.1.19:8000/tenent/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log("SERVER RESPONSE:", data);

      if (response.status === 200) {
        alert("Login Successful");

        navigateTo("TenantDashboard");
      } else {
        alert(data.error || "Invalid login credentials");
      }
    } catch (error) {
      console.log("FETCH ERROR:", error);
      alert("Server not reachable");
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          {/* Top Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-circle-outline"
              size={70}
              color={LIGHT_PURPLE}
            />
          </View>

          <Text style={styles.title}>Tenant Login</Text>
          <Text style={styles.subtitle}>
            Access your rental management dashboard
          </Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={NAVY} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={(text) => setEmail(removeEmojis(text))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={NAVY} />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#8A8F98"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={(t) => setPassword(removeEmojis(t))}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={NAVY}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.error}>{errors.password}</Text>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, !isValid && styles.buttonDisabled]}
            disabled={!isValid}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigateTo("ForgotPasswordScreen")}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Register */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("RegisterScreen")}
            >
              <Text style={styles.registerText}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: NAVY,
  },

  subtitle: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 25,
    marginTop: 6,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },

  error: {
    color: COLORS.ERROR,
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 5,
  },

  loginButton: {
    backgroundColor: NAVY,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },

  forgotContainer: {
    alignItems: "center",
    marginTop: 15,
  },

  forgotText: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "500",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },

  bottomText: {
    color: GRAY,
  },

  registerText: {
    color: NAVY,
    fontWeight: "bold",
  },
});
