

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import COLORS from "../../theme/colors";

const WHITE = COLORS.WHITE;
const NAVY = COLORS.PRIMARY;

export default function RegisterScreen({ navigation }) {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [identityType, setIdentityType] = useState("");
  const [identityImage, setIdentityImage] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  

  const [errors, setErrors] = useState({});

  /* OTP STATE */
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

useEffect(() => {

  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start();

}, [fadeAnim, slideAnim]);

  /* ---------------- HELPERS ---------------- */

  const removeEmojis = (text) =>
    text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");

  

const validateName = (name) => {
  const regex = /^[A-Za-z ]{3,30}$/;

  if (!regex.test(name)) return false;

  if (name.trim().length < 3) return false;

  return true;
};

  const validatePhone = (phone) => /^[6-9][0-9]{9}$/.test(phone);

const validateEmail = (email) => {

  const regex = /^[a-z0-9._%+-]+@gmail\.com$/;

  if (!regex.test(email)) return false;

  if (email.includes("..")) return false;

  if (email.startsWith(".") || email.includes(".@")) return false;

  if (/\s/.test(email)) return false;

  return true;
};

  const validatePassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+])[A-Za-z\d@$!%*?&#^()_+]{8,}$/;

  return regex.test(password);
};

  

  /* OTP FUNCTIONS */

  const sendOTP = () => {
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    Alert.alert("OTP Sent", `Your OTP is ${randomOtp}`);
  };

const verifyOTP = () => {
  if (otp === generatedOtp) {
    setOtpVerified(true);
setOtp("");

    // remove phone error after verification
    setErrors((prev) => ({
      ...prev,
      phone: "",
    }));

    Alert.alert("Success", "Phone Verified");
  } else {
    Alert.alert("Error", "Invalid OTP");
  }
};

  /* CAMERA CAPTURE */
const pickImage = async () => {

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission required", "Gallery permission needed");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.1,
  });

  if (!result.canceled) {

    const imageUri = result.assets[0].uri;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const sizeKB = blob.size / 1024;

    if (sizeKB > 10) {
      Alert.alert("Image Too Large", "Image must be less than 10KB");
      return;
    }

    setIdentityImage(imageUri);

    setErrors((prev) => ({
      ...prev,
      identityImage: "",
    }));
  }
};
  /* REGISTER */

  const handleRegister = async () => {
  let e = {};
  setErrors({});

/* NAME */
if (!name.trim()) {
  e.name = "Please enter full name";
} else if (!validateName(name)) {
  e.name = "Name must be 3-30 letters only";
}

/* EMAIL */
if (!email.trim()) {
  e.email = "Please enter email";
} else if (!validateEmail(email)) {
  e.email = "Enter valid gmail (ex: name@gmail.com)";
}

/* PHONE */
if (!phone) {
  e.phone = "Please enter phone number";
} else if (!validatePhone(phone)) {
  e.phone = "Phone must start with 6,7,8,9 and be 10 digits";
} else if (!otpVerified) {
  e.phone = "Please verify phone with OTP";
}


/* GENDER */
if (!gender) {
  e.gender = "Please select gender";
}




/* PASSWORD */
if (!password) {
  e.password = "Please enter password";
} else if (!validatePassword(password)) {
  e.password =
    "Password must contain uppercase, lowercase, number & special character";
}

/* CONFIRM PASSWORD */
if (!confirmPassword) {
  e.confirmPassword = "Please confirm password";
} else if (password !== confirmPassword) {
  e.confirmPassword = "Passwords do not match";
}

/* ID TYPE */
if (!identityType) {
  e.identityType = "Please select identity proof";
}

/* IMAGE */
if (!identityImage) {
  e.identityImage = "Please upload identity proof";
}
//error msg
setErrors(e);

if (Object.keys(e).length > 0) {
  return;
}

// JSON payload for backend
const registerPayload = {
  name: name,
  email: email,
  phone: phone,
  gender: gender,
  identityType: identityType,
  password: password,
  identityImage: identityImage,
  createdAt: new Date().toISOString(),
};

console.log(
  "Register API JSON:",
  JSON.stringify(registerPayload, null, 2)
);

    try {
      const stored = await AsyncStorage.getItem("users");
      const users = stored ? JSON.parse(stored) : [];

//       const existingUser = users.find((u) => u.email === email);

// if (existingUser) {
//   Alert.alert("Error", "Email already registered");
//   return;
// }

      users.push(registerPayload);

      await AsyncStorage.setItem("users", JSON.stringify(users));

      Alert.alert("Success", "Registration Successful!", [
        {
          text: "OK",
          onPress: () => {
  setName("");
  setEmail("");
  setPhone("");
  setGender("");
  setIdentityType("");
  setIdentityImage(null);
  setPassword("");
  setConfirmPassword("");
  setOtp("");
  setGeneratedOtp("");
  setOtpVerified(false);

  if (navigation?.navigate) {
    navigation.navigate("LoginScreen");
  } else {
    router.push("/LoginScreen");
  }
},
        },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <LinearGradient colors={[WHITE, WHITE]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.outerContainer}
          keyboardShouldPersistTaps="handled"
        >

          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Create Account</Text>

            {/* NAME */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={NAVY} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                maxLength={30}
                value={name}
                onChangeText={(t) => {
  const clean = removeEmojis(t).replace(/[^A-Za-z ]/g, "");
  setName(clean);

  if (!validateName(clean)) {
    setErrors((prev) => ({ ...prev, name: "Name must be 3 Chars" }));
  } else {
    setErrors((prev) => ({ ...prev, name: "" }));
  }
}}
onBlur={() => {
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: "please enter name" }));
    }
    else if(!validateName(name)){
      setErrors((prev)=>({
        ...prev,
        name: "Invalid name",
      }));
    }
  }}
              />
            </View>
            {errors.name && <Text style={styles.error}>{errors.name}</Text>}

            {/* EMAIL */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={NAVY} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => {
  const clean = removeEmojis(t)
    .replace(/\s/g, "")
    .toLowerCase();

  setEmail(clean);

  if (!validateEmail(clean)) {
    setErrors((prev) => ({
      ...prev,
      email: "Enter valid email",
    }));
  } else {
    setErrors((prev) => ({ ...prev, email: "" }));
  }
}}
onBlur={() => {
  if (!email.trim()) {
    setErrors((prev) => ({
      ...prev,
      email: "Please enter email",
    }));
  } else if (!validateEmail(email)) {
    setErrors((prev) => ({
      ...prev,
      email: "Invalid email",
    }));
  }
}}
              />
             
            </View>
             {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            {/* PHONE */}
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={NAVY} />
              <TextInput
  style={styles.input}
  placeholder="Phone"
  keyboardType="numeric"
  maxLength={10}
  value={phone}
  onChangeText={(t) => {

  const clean = t.replace(/[^0-9]/g, "");

  // If phone number changes after OTP verification
  if (otpVerified && clean !== phone) {
    setOtpVerified(false);
    setGeneratedOtp("");
    setOtp("");

    Alert.alert("Phone Changed", "Please verify the new phone number with OTP");


  }

  setPhone(clean);

  if (clean.length !== 10) {
    setErrors((prev) => ({
      ...prev,
      phone: "Invalid Number",
    }));
  } 
  else if (!validatePhone(clean)) {
    setErrors((prev) => ({
      ...prev,
      phone: "Invalid Number",
    }));
  } 
  else {
    setErrors((prev) => ({ ...prev, phone: "" }));
  }

}}
  onBlur={() => {
  if (!phone) {
    setErrors((prev) => ({ ...prev, phone: "Please enter phone number" }));
  }
}}
/>
            </View>
            {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

            {validatePhone(phone) && !otpVerified && (
              <TouchableOpacity onPress={sendOTP} style={styles.otpButton}>
                <Text style={styles.otpText}>Send OTP</Text>
              </TouchableOpacity>
            )}

            {generatedOtp !== "" && !otpVerified && (
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color={NAVY} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity
  onPress={() => {
    Keyboard.dismiss();
    verifyOTP();
  }}
>
  <Text style={{ color: NAVY }}>Verify</Text>
</TouchableOpacity>
              </View>
            )}
            {/* GENDER */}
           <View style={styles.inputWrapper}>
  <Ionicons name="male-female-outline" size={20} color={NAVY} />

  <Picker
    style={{ flex: 1 }}
    selectedValue={gender}
    onValueChange={(itemValue) => {
  setGender(itemValue);

  if (itemValue) {
    setErrors((prev) => ({ ...prev, gender: "" }));
  }
}}
  >
    <Picker.Item label="Select Gender" value="" />
    <Picker.Item label="Male" value="Male" />
    <Picker.Item label="Female" value="Female" />
  </Picker>
</View>
{errors.gender && <Text style={styles.error}>{errors.gender}</Text>}


            {/* ID TYPE */}
            <View style={styles.inputWrapper}>
  <Ionicons name="card-outline" size={20} color={NAVY} />

  <Picker
    style={{ flex: 1 }}
    selectedValue={identityType}
    onValueChange={(itemValue) => {
  setIdentityType(itemValue);

  if (itemValue) {
    setErrors((prev) => ({ ...prev, identityType: "" }));
  }
}}
  >
    <Picker.Item label="Select Identity Proof" value="" />
    <Picker.Item label="Aadhar Card" value="Aadhar" />
    <Picker.Item label="PAN Card" value="PAN" />
  </Picker>
</View>
{errors.identityType && (
  <Text style={styles.error}>{errors.identityType}</Text>
)}

            {/* CAMERA / GALLERY */}
            {/* CAMERA / GALLERY */}
<TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
  <Ionicons
    name={identityImage ? "checkmark-circle" : "camera-outline"}
    size={20}
    color={identityImage ? "green" : NAVY}
  />
  <Text style={styles.uploadText}>
    {identityImage ? "Uploaded ✓" : "Upload Identity Proof"}
  </Text>
</TouchableOpacity>

            {errors.identityImage && (
  <Text style={styles.error}>{errors.identityImage}</Text>
)}

          

            {/* PASSWORD */}
            <View style={styles.inputWrapper}>
  <Ionicons name="lock-closed-outline" size={20} color={NAVY} />

  <TextInput
  style={styles.input}
  placeholder="Password"
  secureTextEntry={!showPassword}
  contextMenuHidden
  selectTextOnFocus={false}
    value={password}
    onChangeText={(t) => {
      const clean = removeEmojis(t);
      setPassword(clean);
      

      if (!validatePassword(clean)) {
        setErrors((prev) => ({
          ...prev,
          password:
            "Password must contain uppercase, lowercase, number & special character",
        }));
      } else {
        setErrors((prev) => ({ ...prev, password: "" }));
      }
    }}
    onBlur={() => {
  if (!password) {
    setErrors((prev) => ({ ...prev, password: "Please enter password" }));
  }
}}
  />

  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Ionicons
      name={showPassword ? "eye-outline" : "eye-off-outline"}
      size={20}
      color={NAVY}
    />
  </TouchableOpacity>
</View>

{errors.password && <Text style={styles.error}>{errors.password}</Text>}

            {/* <Text style={styles.strength}>Strength: {passwordStrength}</Text> */}

            {/* CONFIRM PASSWORD */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={NAVY} />
              <TextInput
  style={styles.input}
  placeholder="Confirm Password"
  secureTextEntry={!showConfirmPassword}
  contextMenuHidden
  selectTextOnFocus={false}
  value={confirmPassword}
  onChangeText={(t) => {
    const clean = removeEmojis(t);
    setConfirmPassword(clean);

    if (clean !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Password do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  }}
  onBlur={() => {
  if (!confirmPassword) {
    setErrors((prev) => ({
      ...prev,
      confirmPassword: "Please confirm password",
    }));
  }
}}
/>
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={NAVY}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
  <Text style={styles.error}>{errors.confirmPassword}</Text>
)}

            <TouchableOpacity onPress={handleRegister}>
              <LinearGradient
                colors={[NAVY, COLORS.PRIMARY_LIGHT]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 30,
    padding: 25,
    elevation: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: NAVY,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    padding: 12,
  },
  uploadButton: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.BLUE_LIGHT,
  },
  uploadText: {
    marginLeft: 6,
    fontWeight: "600",
    color: NAVY,
  },
  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: 20,
    marginTop: 15,
  },
  button: {
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "bold",
  },
  otpButton: {
    backgroundColor: NAVY,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  otpText: {
    color: "white",
    fontWeight: "bold",
  },
  strength: {
    fontSize: 12,
    marginLeft: 8,
    color: "#555",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginLeft: 8,
  },
});

