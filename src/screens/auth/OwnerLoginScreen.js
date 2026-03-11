import { Ionicons } from "@expo/vector-icons";
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

export default function OwnerLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  // const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const PRIMARY = LIGHT_PURPLE;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const sanitize = (t) =>
    t.replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{27BF}]/gu, "");

  const validate = () => {
    const e = {};
    const em = email.trim();
    const pw = password.trim();

    if (!em) e.email = "Email is required";
    else if (!emailRegex.test(em)) e.email = "Invalid email";

    if (!pw) e.password = "Password is required";
    else if (pw.length < 8) e.password = "Minimum 8 characters";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = emailRegex.test(email.trim()) && password.trim().length >= 8;

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  // ✅ LOGIN API FUNCTION
  // const handleLogin = async () => {
  //   if (!validate()) return;

  //   try {
  //     const response = await fetch("http://192.168.1.19:8000/api/login/", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         email: email.trim(),
  //         password: password.trim(),
  //       }),
  //     });

  //     const data = await response.json();

  //     console.log("LOGIN RESPONSE:", data);

  //     if (response.ok) {
  //       alert("Login Successful");
  //       navigation.navigate("OwnerNavigation");
  //     } else {
  //       alert(data.error || "Login failed");

  //     }
  //   } catch (error) {
  //     console.log("LOGIN ERROR:", error);
  //     alert("Server error");

  //   }
  // };
  const handleLogin = () => {
    navigation.navigate("OwnerNavigation");
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          <View style={styles.card}>
            {/* Profile Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={75}
                color={PRIMARY}
              />
            </View>

            <Text style={styles.title}>Owner Login</Text>
            <Text style={styles.subtitle}>
              Access your property management dashboard
            </Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={PRIMARY} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#8A8F98"
                style={styles.input}
                value={email}
                onChangeText={(t) => setEmail(sanitize(t))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#8A8F98"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={(t) => setPassword(sanitize(t))}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={PRIMARY}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, !isValid && styles.buttonDisabled]}
              disabled={!isValid}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => navigateTo("ForgotPasswordScreen")}
            >
              <Text style={[styles.forgotText, { color: NAVY }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Register */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don't have an account?</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerRegistrationScreen")}
              >
                <Text style={[styles.registerText, { color: PRIMARY }]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },

  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0B1F3A",
  },

  subtitle: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 30,
    marginTop: 6,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
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

  button: {
    backgroundColor: NAVY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  forgotContainer: {
    alignItems: "center",
    marginTop: 15,
  },

  forgotText: {
    fontSize: 14,
    fontWeight: "500",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  bottomText: {
    color: COLORS.TEXT_SECONDARY,
  },

  registerText: {
    fontWeight: "bold",
  },
});
