import COLORS from "@/src/theme/colors";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
// import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAVY = COLORS.PRIMARY;
const LIGHT_PURPLE = COLORS.PRIMARY_LIGHT;
const WHITE = COLORS.WHITE;
const GRAY = COLORS.TEXT_SECONDARY;
const LIGHT_GRAY = COLORS.CARD;
const DOT_INACTIVE = COLORS.DIVIDER;
let MapView, Marker, PROVIDER_GOOGLE;
try {
  if (Platform.OS !== "web") {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } else {
    MapView = View;
    Marker = function Marker() {
      return null;
    };
    PROVIDER_GOOGLE = undefined;
  }
} catch (_e) {
  MapView = View;
  Marker = function Marker() {
    return null;
  };
  PROVIDER_GOOGLE = undefined;
}
// Enable LayoutAnimation for Android (skip on Fabric/new arch where it's a no-op)
if (
  Platform.OS === "android" &&
  !global.nativeFabricUIManager &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OwnerRegistrationScreen() {
  const [screen, setScreen] = useState("register");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [customFacilities, setCustomFacilities] = useState([]);
  const [newFacilityText, setNewFacilityText] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [lineProgress] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const initialForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    stayType: "",
    hostelType: "",
    hostelName: "",
    location: "",
    wifi: "",
    parking: "",
    lift: "",
    apartmentName: "",
    bhk: "",
    rent: "",
    tenantType: "",
    commercialName: "",
    usage: "",
    bankName: "",
    ifsc: "",
    accountNo: "",
    flatArea: "",
    bedrooms: "",
    bathrooms: "",
    cost: "",
    carParking: "",
    negotiable: "",
    documents: { property: null, identityProof: null, homePics: [] },
    floorsData: [],
  };
  // const [form, setForm] = useState(initialForm);
  // const handleUpdateFloors = useCallback((floors) => {
  //   setForm((prev) => ({ ...prev, floorsData: floors }));
  // }, []);

  ////added code
  const [form, setForm] = useState(initialForm);
  const [step3Summary, setStep3Summary] = useState("");
  const handleUpdateFloors = useCallback((floors) => {
    setForm((prev) => ({ ...prev, floorsData: floors }));

    const summary = `Total Floors: ${floors.length}`;
    setStep3Summary(summary);
  }, []);

  const [mapRegion, setMapRegion] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const geocodeTimerRef = useRef(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState("");
  const [mapType, setMapType] = useState("standard");

  useEffect(() => {
    setSelectedFacilities([]);
  }, [form.stayType]);

  useEffect(() => {
    if (selectedFacilities.length > 0 && errors.facilities) {
      const newErrors = { ...errors };
      delete newErrors.facilities;
      setErrors(newErrors);
    }
  }, [selectedFacilities, errors]);

  const DEFAULT_REGION = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  const handleStayTypeChange = (nextType) => {
    const cleared = {
      ...form,
      stayType: nextType,
      // common
      location: "",
      // hostel
      hostelName: "",
      hostelType: "",
      // apartment
      apartmentName: "",
      bhk: "",
      tenantType: "",
      rent: "",
      // commercial
      commercialName: "",
      usage: "",
      // bank details
      bankName: "",
      ifsc: "",
      accountNo: "",
      // property related documents (keep identityProof as it's part of registration)
      documents: {
        ...form.documents,
        property: null,
        homePics: [],
      },
      // clear floor data since it's type-specific
      floorsData: [],
    };
    setForm(cleared);
    setMapRegion(null);
    setSelectedPlaceName("");
    setLocationSuggestions([]);
    setErrors({});
  };
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    })();
  }, []);

  useEffect(() => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
    const input = form.location.trim();
    if (!input) {
      setMapRegion(null);
      setLocationSuggestions([]);
      setSelectedPlaceName("");
      return;
    }
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const timeoutMs = 6000;
        if (Platform.OS === "android") {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(input)}`;
          const fetchPromise = fetch(url, {
            headers: { Accept: "application/json" },
          }).then((r) => r.json());
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Geocode timeout")), timeoutMs),
          );
          const items = await Promise.race([fetchPromise, timeoutPromise]);
          if (Array.isArray(items) && items.length > 0) {
            const { lat, lon } = items[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            if (isFinite(latitude) && isFinite(longitude)) {
              setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            } else {
              setMapRegion(null);
            }
            setLocationSuggestions(items);
          } else {
            setMapRegion(null);
            setLocationSuggestions([]);
          }
        } else {
          if (locationPermission !== "granted") return;
          const geocodePromise = Location.geocodeAsync(input);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Geocode timeout")), timeoutMs),
          );
          const result = await Promise.race([geocodePromise, timeoutPromise]);
          if (Array.isArray(result) && result.length > 0) {
            const { latitude, longitude } = result[0];
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          } else {
            setMapRegion(null);
          }
          setLocationSuggestions([]);
        }
      } catch (_err) {
        setMapRegion(null);
        setLocationSuggestions([]);
      }
    }, 600);
    return () => {
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = null;
      }
    };
  }, [form.location, locationPermission]);

  useEffect(() => {
    if (step === 2) {
      Animated.timing(lineProgress[0], {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else if (step === 3) {
      Animated.timing(lineProgress[1], {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [step, lineProgress]);

  // Validation functions
  const containsEmoji = (s) => {
    if (!s) return false;
    return /[\uD83C-\uDBFF][\uDC00-\uDFFF]|\u200D|\uFE0F|[\u2600-\u27BF]/.test(
      s,
    );
  };
  const validateName = (name) => {
    if (!name || name.length === 0) {
      return "Name is required";
    }
    if (containsEmoji(name)) {
      return "Invaild Name";
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return "Invaild Name";
    }
    if (name.trim().length < 3 || name.trim().length > 30) {
      return "Invalid Name";
    }
    if (!/^[A-Z][a-z\s]*$|^[a-z\s]+$/.test(name)) {
      return "Invaild Name";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email || email.length === 0) {
      return "Email is required";
    }
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*@gmail\.com$/.test(email)) {
      return "Invalid email";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone || phone.length === 0) {
      return "Phone number is required";
    }
    if (!/^\d{10}$/.test(phone)) return "Invalid phone number";
    if (!/^[6-9]/.test(phone)) return "Invalid phone number";
    if (phone === "0000000000") return "Invalid phone number";
    if (phone.length === 10 && phone.substring(1) === "000000000")
      return "Invalid phone number";
    return "";
  };

  const validatePassword = (password) => {
    if (!password || password.length === 0) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be uppercase,lowercase,number and special character";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Invaild password";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Invaild password";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Invaild password";
    }
    if (!/(?=.*[@$!%*?&#])/.test(password)) {
      return "Invaild password";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword || confirmPassword.trim().length === 0) {
      return "Please confirm your password";
    }

    if (confirmPassword !== password) {
      return "Passwords do not match";
    }

    return "";
  };

  const validateStep1 = () => {
    const nameError = validateName(form.name);
    const emailError = validateEmail(form.email);
    const phoneError = validatePhone(form.phone);
    const passwordError = validatePassword(form.password);
    const confirmPasswordError = validateConfirmPassword(
      form.confirmPassword,
      form.password,
    );

    return (
      !nameError &&
      !emailError &&
      !phoneError &&
      !passwordError &&
      !confirmPasswordError &&
      form.documents.identityProof
    );
  };

  // Step 2 Validation Functions
  const validatePropertyName = (value) => {
    if (!value || value.trim().length === 0) {
      return "This field is required";
    }

    if (value.trim().length < 2) {
      return "Minimum 2 characters required";
    }

    if (value.trim().length > 30) {
      return "invaild ";
    }

    // Only letters and spaces allowed
    const regex = /^[A-Za-z\s]+$/;

    if (!regex.test(value)) {
      return "Only letters allowed. Numbers, emojis or symbols not allowed";
    }

    return "";
  };

  const validateLocation = (value) => {
    if (!value || value.trim().length === 0) {
      return "Location is required";
    }

    if (value.trim().length < 2) {
      return "Location must be at least 2 characters";
    }

    if (value.trim().length > 30) {
      return "Location must be less than 30 characters";
    }

    const regex = /^[A-Za-z\s]+$/;

    if (!regex.test(value)) {
      return "Only letters allowed. Numbers, emojis or symbols not allowed";
    }

    return "";
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value === "") {
      return `${fieldName} is required`;
    }
    return "";
  };

  const validateBankName = (bankName) => {
    if (!bankName || bankName.trim().length === 0) {
      return "Bank name is required";
    }
    if (containsEmoji(bankName)) {
      return "Invaild name";
    }
    if (!/^[A-Za-z\s]+$/.test(bankName)) {
      return "Invaild name";
    }
    if (bankName.trim().length <= 2 || bankName.trim().length >= 30) {
      return "Invaild name";
    }

    return "";
  };

  const validateIFSC = (ifsc) => {
    if (!ifsc || ifsc.trim().length === 0) {
      return "IFSC code is required";
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim())) {
      return "Invalid IFSC code";
    }
    return "";
  };

  const validateAccountNo = (accountNo) => {
    if (!accountNo || accountNo.trim().length === 0) {
      return "Account number is required";
    }
    if (!/^\d+$/.test(accountNo)) {
      return "Invaild number";
    }
    if (accountNo.length < 9 || accountNo.length > 18) {
      return "Invaild number";
    }
    return "";
  };

  const validateDocuments = () => {
    if (!form.documents.property) {
      return "Property document is required";
    }
    if (
      !form.documents.homePics ||
      !Array.isArray(form.documents.homePics) ||
      form.documents.homePics.length === 0
    ) {
      return "Property images are required";
    }
    return "";
  };

  const validateStep2 = () => {
    // Stay type must be selected
    if (!form.stayType) return false;

    let isValid = true;

    // Validate based on stay type
    if (form.stayType === "hostel") {
      if (validatePropertyName(form.hostelName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      if (validateRequired(form.hostelType, "Hostel type")) isValid = false;
    } else if (form.stayType === "apartment") {
      if (validatePropertyName(form.apartmentName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      // if (validateRequired(form.bhk, "BHK")) isValid = false;
      if (validateRequired(form.tenantType, "Tenant type")) isValid = false;
    } else if (form.stayType === "commercial") {
      if (validatePropertyName(form.commercialName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      if (validateRequired(form.usage, "Usage")) isValid = false;
    }

    if (validateDocuments()) isValid = false;

    // Validate facilities
    if (!selectedFacilities || selectedFacilities.length === 0) {
      isValid = false;
    }

    return isValid;
  };

  const onCoordinatePick = async (coord) => {
    const region = {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setMapRegion(region);
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
      if (Array.isArray(res) && res[0]) {
        const p = res[0];
        const line = [
          p.name,
          p.street,
          p.city,
          p.region,
          p.postalCode,
          p.country,
        ]
          .filter(Boolean)
          .join(", ");
        setSelectedPlaceName(line);
        setForm({ ...form, location: line });
      } else {
        setSelectedPlaceName("Dropped pin");
      }
    } catch {
      setSelectedPlaceName("Dropped pin");
    }
  };

  const openInGoogleMaps = () => {
    const q = mapRegion
      ? `${mapRegion.latitude},${mapRegion.longitude}`
      : (form.location || "").trim();
    if (!q) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q,
    )}`;
    Linking.openURL(url).catch(() => {});
  };

  const openDirections = async () => {
    if (!mapRegion) return;
    let origin = "Current+Location";
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        if (pos?.coords) {
          origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        }
      }
    } catch {}
    const dest = `${mapRegion.latitude},${mapRegion.longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(dest)}`
        : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  const staticMapUrl = (lat, lon) =>
    `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=640x240&markers=${lat},${lon},red-pushpin`;
  const navigation = useNavigation();
  const zoomIn = () => {
    if (!mapRegion) return;
    setMapRegion({
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta / 1.5, 0.001),
      longitudeDelta: Math.max(mapRegion.longitudeDelta / 1.5, 0.001),
    });
  };
  const zoomOut = () => {
    if (!mapRegion) return;
    setMapRegion({
      ...mapRegion,
      latitudeDelta: Math.min(mapRegion.latitudeDelta * 1.5, 80),
      longitudeDelta: Math.min(mapRegion.longitudeDelta * 1.5, 80),
    });
  };

  const pickDoc = async (key) => {
    const isMultiple = key === "homePics";
    const res = await DocumentPicker.getDocumentAsync({
      multiple: isMultiple,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newErrors = { ...errors };
      let hasSizeError = false;

      if (isMultiple) {
        const validAssets = [];
        res.assets.forEach((asset) => {
          if (asset && typeof asset.size === "number" && asset.size > 10240) {
            hasSizeError = true;
          } else if (asset) {
            validAssets.push(asset);
          }
        });

        if (hasSizeError) {
          newErrors[`document_${key}`] = "One or more images exceed 10KB limit";
        }

        if (validAssets.length > 0) {
          const current = Array.isArray(form.documents.homePics)
            ? form.documents.homePics
            : [];
          const updated = [...current, ...validAssets];
          setForm({
            ...form,
            documents: { ...form.documents, homePics: updated },
          });
          if (!hasSizeError) {
            delete newErrors[`document_${key}`];
            delete newErrors.documents;
          }
        }
      } else {
        const asset = res.assets[0];
        if (asset && typeof asset.size === "number" && asset.size > 10240) {
          newErrors[`document_${key}`] = "Image must be 10KB or less";
          hasSizeError = true;
        } else if (asset) {
          setForm({
            ...form,
            documents: { ...form.documents, [key]: asset },
          });
          delete newErrors[`document_${key}`];
          delete newErrors.documents;
        }
      }
      setErrors(newErrors);
    }
  };

  const validateAndShowErrors = () => {
    if (step === 2) {
      const newErrors = {};

      // Validate stay type
      const stayTypeError = validateRequired(form.stayType, "Stay type");
      if (stayTypeError) newErrors.stayType = stayTypeError;

      // Validate based on stay type
      if (form.stayType === "hostel") {
        const hostelNameError = validatePropertyName(form.hostelName);
        const locationError = validateLocation(form.location);
        const hostelTypeError = validateRequired(
          form.hostelType,
          "Hostel type",
        );
        if (hostelNameError) newErrors.hostelName = hostelNameError;
        if (locationError) newErrors.location = locationError;
        if (hostelTypeError) newErrors.hostelType = hostelTypeError;
      } else if (form.stayType === "apartment") {
        const apartmentNameError = validatePropertyName(form.apartmentName);
        const locationError = validateLocation(form.location);
        const bhkError = validateRequired(form.bhk, "BHK");
        const tenantTypeError = validateRequired(
          form.tenantType,
          "Tenant type",
        );
        if (apartmentNameError) newErrors.apartmentName = apartmentNameError;
        if (locationError) newErrors.location = locationError;
        if (bhkError) newErrors.bhk = bhkError;
        if (tenantTypeError) newErrors.tenantType = tenantTypeError;
      } else if (form.stayType === "commercial") {
        const commercialNameError = validatePropertyName(form.commercialName);
        const locationError = validateLocation(form.location);
        const usageError = validateRequired(form.usage, "Usage");
        if (commercialNameError) newErrors.commercialName = commercialNameError;
        if (locationError) newErrors.location = locationError;
        if (usageError) newErrors.usage = usageError;
      }

      // Validate bank details
      if (form.stayType) {
        if (!form.documents.property)
          newErrors.document_property = "Property document is required";
        if (
          !form.documents.homePics ||
          !Array.isArray(form.documents.homePics) ||
          form.documents.homePics.length === 0
        )
          newErrors.document_homePics = "property imagess are required";

        // Validate facilities
        if (!selectedFacilities || selectedFacilities.length === 0) {
          newErrors.facilities = "At least one facility selected";
        }
      }

      setErrors({ ...errors, ...newErrors });
    }
  };

  const next = () => {
    if (step === 2) {
      validateAndShowErrors();
      if (!validateStep2()) {
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const hasFacility = (label) => selectedFacilities.includes(label);

    const submitData = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      stayType: form.stayType,

      hostelName: form.stayType === "hostel" ? form.hostelName : null,
      hostelType: form.stayType === "hostel" ? form.hostelType : null,

      apartmentName: form.stayType === "apartment" ? form.apartmentName : null,
      bhk: form.stayType === "apartment" ? form.bhk : null,
      tenantType: form.stayType === "apartment" ? form.tenantType : null,

      commercialName:
        form.stayType === "commercial" ? form.commercialName : null,
      usage: form.stayType === "commercial" ? form.usage : null,

      location: form.location,

      wifi: hasFacility("WiFi"),
      parking: hasFacility("Parking"),
      food: hasFacility("Food"),
      lift: hasFacility("Lift"),
      power_backup: hasFacility("Power Backup"),
      security: hasFacility("Security"),
      play_area: hasFacility("Play Area"),
      mess: hasFacility("Mess"),
      laundry: hasFacility("Laundry"),
      water: hasFacility("Water"),
      ac: hasFacility("AC"),
      non_ac: hasFacility("Non AC"),

      bankName: form.bankName,
      ifsc: form.ifsc,
      accountNo: form.accountNo,

      floors_info: JSON.stringify(form.floorsData || []),
    };

    Alert.alert("Confirm Registration", "Are you sure you want to submit?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Submit",
        onPress: async () => {
          try {
            const formData = new FormData();

            Object.entries(submitData).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== "") {
                formData.append(key, String(value));
              }
            });

            const layoutStr = JSON.stringify(form.floorsData || []);
            formData.append("building_layout", layoutStr);

            if (form.documents?.identityProof) {
              formData.append("owner_img_field", {
                uri: form.documents.identityProof.uri,
                name: form.documents.identityProof.name || "owner-photo",
                type: form.documents.identityProof.mimeType || "image/jpeg",
              });
            }

            if (form.documents?.property) {
              formData.append("owner_ship_proof", {
                uri: form.documents.property.uri,
                name: form.documents.property.name || "ownership",
                type:
                  form.documents.property.mimeType ||
                  "application/octet-stream",
              });
            }

            if (
              Array.isArray(form.documents?.homePics) &&
              form.documents.homePics.length > 0
            ) {
              const firstPic = form.documents.homePics[0];
              if (firstPic?.uri) {
                formData.append("owner_property_photos", {
                  uri: firstPic.uri,
                  name: firstPic.name || "property-photo",
                  type: firstPic.mimeType || "image/jpeg",
                });
              }
            }

            const response = await fetch(
              "http://192.168.1.31:8000/api/register/owner/",
              {
                method: "POST",
                body: formData,
              },
            );

            let result;
            try {
              result = await response.json();
            } catch {
              result = null;
            }

            if (response.ok) {
              Alert.alert("Success", "Registration successful!", [
                {
                  text: "OK",
                  onPress: () => navigation.replace("OwnerLoginScreen"),
                },
              ]);
            } else {
              Alert.alert("Error", "Registration failed");
            }
          } catch (error) {
            Alert.alert("Error", "Network error: " + error.message);
          }
        },
      },
    ]);
  };

  const submit = () => handleSubmit();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <StatusBar hidden />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.page}>
            <View style={styles.card}>
              <Text style={styles.title}>
                {
                  ["Registration Form", "Stay & Documents", "Floor Details"][
                    step - 1
                  ]
                }
              </Text>

              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
              >
                <ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {/* STEP INDICATOR */}
                  <View style={styles.stepWrap}>
                    {[1, 2, 3].map((i) => (
                      <React.Fragment key={i}>
                        <View style={styles.stepItem}>
                          <View
                            style={[
                              styles.circle,
                              { backgroundColor: LIGHT_PURPLE },
                            ]}
                          >
                            {step > i ? (
                              <FontAwesome
                                name="check"
                                size={14}
                                color={WHITE}
                              />
                            ) : i === 1 ? (
                              <FontAwesome
                                name="user"
                                size={14}
                                color={WHITE}
                              />
                            ) : i === 2 ? (
                              <FontAwesome
                                name="home"
                                size={14}
                                color={WHITE}
                              />
                            ) : (
                              <FontAwesome
                                name="building"
                                size={14}
                                color={WHITE}
                              />
                            )}
                          </View>

                          <Text style={styles.stepLabel}>
                            {i === 1
                              ? "Registration"
                              : i === 2
                                ? "Stay"
                                : "Floor"}
                          </Text>
                        </View>
                        {i < 3 && (
                          <View style={styles.line}>
                            <Animated.View
                              style={[
                                styles.lineOverlay,
                                {
                                  transform: [
                                    {
                                      scaleX:
                                        i === 1
                                          ? lineProgress[0]
                                          : lineProgress[1],
                                    },
                                  ],
                                },
                              ]}
                            />
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>

                  {/* ---------- STEP 1 ---------- */}
                  {step === 1 && (
                    <>
                      <Text style={styles.label}>Name</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name="user"
                          size={20}
                          color="#7A3FC4" // Vibrant blue color
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            errors.name && styles.inputError,
                            { flex: 1 },
                          ]}
                          placeholder="Enter Name"
                          placeholderTextColor="gray"
                          value={form.name}
                          onChangeText={(v) => {
                            const filtered = v.replace(/[^A-Za-z\s]/g, "");
                            setForm({ ...form, name: filtered });
                          }}
                          onBlur={() =>
                            setErrors({
                              ...errors,
                              name: validateName(form.name),
                            })
                          }
                        />
                      </View>
                      {errors.name ? (
                        <Text style={styles.errorText}>{errors.name}</Text>
                      ) : null}

                      <Text style={styles.label}>Email</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name="envelope"
                          size={20}
                          color="#7A3FC4" // Vibrant blue color
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            errors.email && styles.inputError,
                            { flex: 1 },
                          ]}
                          placeholder="Enter Email"
                          placeholderTextColor="gray"
                          value={form.email}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onChangeText={(v) => {
                            setForm({ ...form, email: v });
                          }}
                          onBlur={() =>
                            setErrors({
                              ...errors,
                              email: validateEmail(form.email),
                            })
                          }
                        />
                      </View>
                      {errors.email ? (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      ) : null}
                      <Text style={styles.label}>Phone</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name="phone"
                          size={20}
                          color="#7A3FC4" // Vibrant blue color
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            errors.phone && styles.inputError,
                            { flex: 1 },
                          ]}
                          placeholder="Enter Phone"
                          placeholderTextColor="gray"
                          value={form.phone}
                          keyboardType="numeric"
                          maxLength={10}
                          onChangeText={(v) => {
                            setForm({ ...form, phone: v });
                          }}
                          onBlur={() =>
                            setErrors({
                              ...errors,
                              phone: validatePhone(form.phone),
                            })
                          }
                        />
                      </View>
                      {errors.phone ? (
                        <Text style={styles.errorText}>{errors.phone}</Text>
                      ) : null}

                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name="lock"
                          size={20}
                          color="#7A3FC4" // Vibrant blue color
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            errors.password && styles.inputError,
                            { flex: 1 },
                          ]}
                          placeholder="Enter Password"
                          placeholderTextColor="gray"
                          value={form.password}
                          secureTextEntry={!showPassword}
                          onChangeText={(v) => {
                            setForm({ ...form, password: v });
                          }}
                          onBlur={() =>
                            setErrors({
                              ...errors,
                              password: validatePassword(form.password),
                            })
                          }
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <FontAwesome
                            name={showPassword ? "eye" : "eye-slash"}
                            size={20}
                            color="#7A3FC4" // Vibrant blue color
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.password ? (
                        <Text style={styles.errorText}>{errors.password}</Text>
                      ) : null}

                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.inputContainer}>
                        <FontAwesome
                          name="lock"
                          size={20}
                          color="#7A3FC4" // Vibrant blue color
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[
                            styles.input,
                            errors.confirmPassword && styles.inputError,
                            { flex: 1 },
                          ]}
                          placeholder="Confirm Password"
                          placeholderTextColor="gray"
                          value={form.confirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          onChangeText={(v) => {
                            setForm({ ...form, confirmPassword: v });
                          }}
                          onBlur={() => {
                            setErrors({
                              ...errors,
                              confirmPassword: validateConfirmPassword(
                                form.confirmPassword,
                                form.password,
                              ),
                            });
                          }}
                        />
                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <FontAwesome
                            name={showConfirmPassword ? "eye" : "eye-slash"}
                            size={20}
                            color="#7A3FC4" // Vibrant blue color
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword ? (
                        <Text style={styles.errorText}>
                          {errors.confirmPassword}
                        </Text>
                      ) : null}

                      <Text style={styles.label}>Identity Proof</Text>
                      <TouchableOpacity
                        style={[
                          styles.btn,
                          {
                            backgroundColor: LIGHT_PURPLE,
                          },
                          errors.document_identityProof && {
                            borderColor: "#dc2626",
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => pickDoc("identityProof")}
                      >
                        <Text style={{ color: "#fff" }}>
                          {form.documents.identityProof
                            ? "Uploaded ✓"
                            : "Upload Identity Proof"}
                        </Text>
                      </TouchableOpacity>
                      {errors.document_identityProof ? (
                        <Text style={styles.errorText}>
                          {errors.document_identityProof}
                        </Text>
                      ) : null}
                    </>
                  )}

                  {/* ---------- STEP 2 ---------- */}
                  {step === 2 && (
                    <>
                      <Text style={styles.sectionTitle}>Stay & Documents</Text>

                      <Text style={styles.label}>Stay Type</Text>
                      <Picker
                        selectedValue={form.stayType}
                        onValueChange={(v) => {
                          handleStayTypeChange(v);
                        }}
                        style={[
                          styles.picker,
                          errors.stayType && styles.inputError,
                        ]}
                      >
                        <Picker.Item label="Select Stay Type" value="" />
                        <Picker.Item label="Hostel" value="hostel" />
                        <Picker.Item label="Apartment" value="apartment" />
                        <Picker.Item label="Commercial" value="commercial" />
                      </Picker>
                      {errors.stayType ? (
                        <Text style={styles.errorText}>{errors.stayType}</Text>
                      ) : null}

                      {/* HOSTEL */}
                      {form.stayType === "hostel" && (
                        <>
                          <Text style={styles.label}>Hostel Name</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.hostelName && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Hostel Name"
                              placeholderTextColor="gray"
                              value={form.hostelName}
                              onChangeText={(v) => {
                                setForm({ ...form, hostelName: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  hostelName: validatePropertyName(
                                    form.hostelName,
                                  ),
                                })
                              }
                            />
                          </View>
                          {errors.hostelName ? (
                            <Text style={styles.errorText}>
                              {errors.hostelName}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Location</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.location && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Location"
                              placeholderTextColor="gray"
                              value={form.location}
                              onChangeText={(v) => {
                                setForm({ ...form, location: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  location: validateLocation(form.location),
                                })
                              }
                            />
                            <TouchableOpacity
                              onPress={openInGoogleMaps}
                              style={{ padding: 8 }}
                            >
                              <MaterialIcons
                                name="map"
                                size={24}
                                color="gray"
                              />
                            </TouchableOpacity>
                          </View>

                          {selectedPlaceName ? (
                            <Text
                              style={{
                                color: "#374151",
                                fontSize: 12,
                                marginBottom: 6,
                              }}
                              numberOfLines={1}
                            >
                              Selected: {selectedPlaceName}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Hostel Type</Text>
                          <Picker
                            selectedValue={form.hostelType}
                            onValueChange={(v) => {
                              setForm({ ...form, hostelType: v });
                              setErrors({
                                ...errors,
                                hostelType: validateRequired(v, "Hostel type"),
                              });
                            }}
                            style={[
                              styles.picker,
                              errors.hostelType && styles.inputError,
                            ]}
                          >
                            <Picker.Item label="Select Type" value="" />
                            <Picker.Item label="Boys" value="boys" />
                            <Picker.Item label="Girls" value="girls" />
                            <Picker.Item label="Co-Living" value="coliving" />
                          </Picker>
                          {errors.hostelType ? (
                            <Text style={styles.errorText}>
                              {errors.hostelType}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Facilities</Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <View
                              style={[
                                styles.inputContainer,
                                { flex: 1, marginBottom: 0 },
                              ]}
                            >
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Add new facility"
                                placeholderTextColor="gray"
                                value={newFacilityText}
                                onChangeText={setNewFacilityText}
                              />
                            </View>
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => {
                                if (newFacilityText.trim()) {
                                  setCustomFacilities([
                                    ...customFacilities,
                                    newFacilityText.trim(),
                                  ]);
                                  setNewFacilityText("");
                                }
                              }}
                            >
                              <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {customFacilities.map((facility, index) => (
                              <View key={index} style={styles.facilityTag}>
                                <Text style={styles.facilityText}>
                                  {facility}
                                </Text>
                                <TouchableOpacity
                                  style={styles.removeButton}
                                  onPress={() => {
                                    setCustomFacilities(
                                      customFacilities.filter(
                                        (_, i) => i !== index,
                                      ),
                                    );
                                  }}
                                >
                                  <Text style={styles.removeButtonText}>-</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {[
                              "WiFi",
                              "Mess",
                              "Laundry",
                              "Security",
                              "Parking",
                            ].map((label) => {
                              const isSelected =
                                selectedFacilities.includes(label);
                              return (
                                <TouchableOpacity
                                  key={label}
                                  style={[
                                    styles.facilityTag,
                                    isSelected && styles.presetSelected,
                                  ]}
                                  onPress={() => {
                                    const exists =
                                      selectedFacilities.includes(label);
                                    setSelectedFacilities(
                                      exists
                                        ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                        : [...selectedFacilities, label],
                                    );
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.facilityText,
                                      isSelected && { color: "#ffffff" },
                                    ]}
                                  >
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {errors.facilities ? (
                            <Text style={styles.errorText}>
                              {errors.facilities}
                            </Text>
                          ) : null}
                        </>
                      )}

                      {/* APARTMENT */}
                      {form.stayType === "apartment" && (
                        <>
                          <Text style={styles.label}>Apartment Name</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.apartmentName && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Apartment Name"
                              placeholderTextColor="gray"
                              value={form.apartmentName}
                              onChangeText={(v) => {
                                setForm({ ...form, apartmentName: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  apartmentName: validatePropertyName(
                                    form.apartmentName,
                                  ),
                                })
                              }
                            />
                          </View>
                          {errors.apartmentName ? (
                            <Text style={styles.errorText}>
                              {errors.apartmentName}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Location</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.location && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Location"
                              placeholderTextColor="gray"
                              value={form.location}
                              onChangeText={(v) => {
                                setForm({ ...form, location: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  location: validateLocation(form.location),
                                })
                              }
                            />
                            <TouchableOpacity
                              onPress={openInGoogleMaps}
                              style={{ padding: 8 }}
                            >
                              <MaterialIcons
                                name="map"
                                size={24}
                                color="gray"
                              />
                            </TouchableOpacity>
                          </View>
                          {errors.location ? (
                            <Text style={styles.errorText}>
                              {errors.location}
                            </Text>
                          ) : null}

                          {Platform.OS === "android" &&
                            locationSuggestions.length > 0 && (
                              <View style={{ marginBottom: 10 }}>
                                {locationSuggestions
                                  .slice(0, 5)
                                  .map((item, idx) => (
                                    <TouchableOpacity
                                      key={`${item.place_id || idx}`}
                                      style={styles.suggestionItem}
                                      onPress={() => {
                                        const lat = parseFloat(item.lat);
                                        const lon = parseFloat(item.lon);
                                        if (isFinite(lat) && isFinite(lon)) {
                                          setMapRegion({
                                            latitude: lat,
                                            longitude: lon,
                                            latitudeDelta: 0.0922,
                                            longitudeDelta: 0.0421,
                                          });
                                        }
                                        if (item.display_name) {
                                          setSelectedPlaceName(
                                            item.display_name,
                                          );
                                          setForm({
                                            ...form,
                                            location: item.display_name,
                                          });
                                        }
                                      }}
                                    >
                                      <View
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <Text
                                          style={styles.suggestionText}
                                          numberOfLines={1}
                                        >
                                          {item.display_name}
                                        </Text>
                                        <TouchableOpacity
                                          style={{
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                          }}
                                          onPress={() => {
                                            const q =
                                              item.lat && item.lon
                                                ? `${item.lat},${item.lon}`
                                                : item.display_name || "";
                                            if (!q) return;
                                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                              q,
                                            )}`;
                                            Linking.openURL(url).catch(
                                              () => {},
                                            );
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "#2563eb",
                                              fontWeight: "600",
                                            }}
                                          >
                                            Open
                                          </Text>
                                        </TouchableOpacity>
                                      </View>
                                    </TouchableOpacity>
                                  ))}
                              </View>
                            )}

                          {mapRegion && (
                            <View style={styles.mapWrap}>
                              <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                region={mapRegion}
                                mapType={mapType}
                                showsUserLocation
                                showsMyLocationButton
                                onPress={(e) =>
                                  onCoordinatePick(e.nativeEvent.coordinate)
                                }
                              >
                                <Marker
                                  coordinate={mapRegion}
                                  pinColor="red"
                                  title={
                                    selectedPlaceName ||
                                    form.location ||
                                    "Selected location"
                                  }
                                  draggable
                                  onDragEnd={(e) =>
                                    onCoordinatePick(e.nativeEvent.coordinate)
                                  }
                                />
                              </MapView>
                              <View style={styles.mapControls}>
                                <TouchableOpacity
                                  style={styles.zoomBtn}
                                  onPress={zoomIn}
                                >
                                  <Text style={styles.zoomText}>+</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.zoomBtn, { marginTop: 6 }]}
                                  onPress={zoomOut}
                                >
                                  <Text style={styles.zoomText}>-</Text>
                                </TouchableOpacity>
                                <View style={styles.mapToggleWrap}>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapToggleBtn,
                                      mapType === "standard" &&
                                        styles.mapToggleActive,
                                    ]}
                                    onPress={() => setMapType("standard")}
                                  >
                                    <Text
                                      style={[
                                        styles.mapToggleText,
                                        mapType === "standard" &&
                                          styles.mapToggleTextActive,
                                      ]}
                                    >
                                      Map
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapToggleBtn,
                                      mapType === "satellite" &&
                                        styles.mapToggleActive,
                                      { marginLeft: 6 },
                                    ]}
                                    onPress={() => setMapType("satellite")}
                                  >
                                    <Text
                                      style={[
                                        styles.mapToggleText,
                                        mapType === "satellite" &&
                                          styles.mapToggleTextActive,
                                      ]}
                                    >
                                      Sat
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          )}
                          {mapRegion && (
                            <View
                              style={{
                                flexDirection: "row",
                                marginTop: 8,
                                marginBottom: 10,
                              }}
                            >
                              <TouchableOpacity
                                style={styles.mapActionBtn}
                                onPress={async () => {
                                  try {
                                    const { status } =
                                      await Location.requestForegroundPermissionsAsync();
                                    if (status !== "granted") return;
                                    const pos =
                                      await Location.getCurrentPositionAsync(
                                        {},
                                      );
                                    if (pos?.coords) {
                                      setMapRegion({
                                        latitude: pos.coords.latitude,
                                        longitude: pos.coords.longitude,
                                        latitudeDelta: 0.0922,
                                        longitudeDelta: 0.0421,
                                      });
                                      setSelectedPlaceName("Current location");
                                    }
                                  } catch {}
                                }}
                              >
                                <Text style={styles.mapActionText}>
                                  Use Current Location
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.mapActionBtn, { marginLeft: 8 }]}
                                onPress={openDirections}
                              >
                                <Text style={styles.mapActionText}>
                                  Navigate
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          <Text style={styles.label}>Tenant Type</Text>
                          <Picker
                            selectedValue={form.tenantType}
                            onValueChange={(v) => {
                              setForm({ ...form, tenantType: v });
                            }}
                            style={[
                              styles.picker,
                              errors.tenantType && styles.inputError,
                            ]}
                          >
                            <Picker.Item label="Select" value="" />
                            <Picker.Item label="Family" value="family" />
                            <Picker.Item label="Bachelors" value="bachelors" />
                          </Picker>
                          {errors.tenantType ? (
                            <Text style={styles.errorText}>
                              {errors.tenantType}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Facilities</Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <View
                              style={[
                                styles.inputContainer,
                                { flex: 1, marginBottom: 0 },
                              ]}
                            >
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Add new facility"
                                placeholderTextColor="gray"
                                value={newFacilityText}
                                onChangeText={setNewFacilityText}
                              />
                            </View>
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => {
                                if (newFacilityText.trim()) {
                                  setCustomFacilities([
                                    ...customFacilities,
                                    newFacilityText.trim(),
                                  ]);
                                  setNewFacilityText("");
                                }
                              }}
                            >
                              <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {customFacilities.map((facility, index) => (
                              <View key={index} style={styles.facilityTag}>
                                <Text style={styles.facilityText}>
                                  {facility}
                                </Text>
                                <TouchableOpacity
                                  style={styles.removeButton}
                                  onPress={() => {
                                    setCustomFacilities(
                                      customFacilities.filter(
                                        (_, i) => i !== index,
                                      ),
                                    );
                                  }}
                                >
                                  <Text style={styles.removeButtonText}>-</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {[
                              "Parking",
                              "Lift",
                              "Power Backup",
                              "Security",
                              "Play Area",
                            ].map((label) => {
                              const isSelected =
                                selectedFacilities.includes(label);
                              return (
                                <TouchableOpacity
                                  key={label}
                                  style={[
                                    styles.facilityTag,
                                    isSelected && styles.presetSelected,
                                  ]}
                                  onPress={() => {
                                    const exists =
                                      selectedFacilities.includes(label);
                                    setSelectedFacilities(
                                      exists
                                        ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                        : [...selectedFacilities, label],
                                    );
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.facilityText,
                                      isSelected && { color: "#ffffff" },
                                    ]}
                                  >
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {errors.facilities ? (
                            <Text style={styles.errorText}>
                              {errors.facilities}
                            </Text>
                          ) : null}
                        </>
                      )}

                      {/* COMMERCIAL */}
                      {form.stayType === "commercial" && (
                        <>
                          <Text style={styles.label}>Property Name</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.commercialName && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Property Name"
                              placeholderTextColor="gray"
                              value={form.commercialName}
                              onChangeText={(v) => {
                                setForm({ ...form, commercialName: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  commercialName: validatePropertyName(
                                    form.commercialName,
                                  ),
                                })
                              }
                            />
                          </View>
                          {errors.commercialName ? (
                            <Text style={styles.errorText}>
                              {errors.commercialName}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Location</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              styles.inputContainerStep2,
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.input,
                                errors.location && styles.inputError,
                                { flex: 1 },
                              ]}
                              placeholder="Enter Location"
                              placeholderTextColor="gray"
                              value={form.location}
                              onChangeText={(v) => {
                                setForm({ ...form, location: v });
                              }}
                              onBlur={() =>
                                setErrors({
                                  ...errors,
                                  location: validateLocation(form.location),
                                })
                              }
                            />
                            <TouchableOpacity
                              onPress={() => {
                                if (form.location.trim()) {
                                  Linking.openURL(
                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      form.location.trim(),
                                    )}`,
                                  );
                                }
                              }}
                              style={{ padding: 8 }}
                            >
                              <MaterialIcons
                                name="map"
                                size={24}
                                color="gray"
                              />
                            </TouchableOpacity>
                          </View>
                          {errors.location ? (
                            <Text style={styles.errorText}>
                              {errors.location}
                            </Text>
                          ) : null}

                          {Platform.OS === "android" &&
                            locationSuggestions.length > 0 && (
                              <View style={{ marginBottom: 10 }}>
                                {locationSuggestions
                                  .slice(0, 5)
                                  .map((item, idx) => (
                                    <TouchableOpacity
                                      key={`${item.place_id || idx}`}
                                      style={styles.suggestionItem}
                                      onPress={() => {
                                        const lat = parseFloat(item.lat);
                                        const lon = parseFloat(item.lon);
                                        if (isFinite(lat) && isFinite(lon)) {
                                          setMapRegion({
                                            latitude: lat,
                                            longitude: lon,
                                            latitudeDelta: 0.0922,
                                            longitudeDelta: 0.0421,
                                          });
                                        }
                                        if (item.display_name) {
                                          setSelectedPlaceName(
                                            item.display_name,
                                          );
                                        }
                                      }}
                                    >
                                      <Text
                                        style={styles.suggestionText}
                                        numberOfLines={1}
                                      >
                                        {item.display_name}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                              </View>
                            )}

                          {mapRegion && (
                            <View style={styles.mapWrap}>
                              <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                region={mapRegion}
                                mapType={mapType}
                                showsUserLocation
                                showsMyLocationButton
                                onPress={(e) =>
                                  onCoordinatePick(e.nativeEvent.coordinate)
                                }
                              >
                                <Marker
                                  coordinate={mapRegion}
                                  pinColor="red"
                                  title={
                                    selectedPlaceName ||
                                    form.location ||
                                    "Selected location"
                                  }
                                  draggable
                                  onDragEnd={(e) =>
                                    onCoordinatePick(e.nativeEvent.coordinate)
                                  }
                                />
                              </MapView>
                              <View style={styles.mapControls}>
                                <TouchableOpacity
                                  style={styles.zoomBtn}
                                  onPress={zoomIn}
                                >
                                  <Text style={styles.zoomText}>+</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.zoomBtn, { marginTop: 6 }]}
                                  onPress={zoomOut}
                                >
                                  <Text style={styles.zoomText}>-</Text>
                                </TouchableOpacity>
                                <View style={styles.mapToggleWrap}>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapToggleBtn,
                                      mapType === "standard" &&
                                        styles.mapToggleActive,
                                    ]}
                                    onPress={() => setMapType("standard")}
                                  >
                                    <Text
                                      style={[
                                        styles.mapToggleText,
                                        mapType === "standard" &&
                                          styles.mapToggleTextActive,
                                      ]}
                                    >
                                      Map
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapToggleBtn,
                                      mapType === "satellite" &&
                                        styles.mapToggleActive,
                                      { marginLeft: 6 },
                                    ]}
                                    onPress={() => setMapType("satellite")}
                                  >
                                    <Text
                                      style={[
                                        styles.mapToggleText,
                                        mapType === "satellite" &&
                                          styles.mapToggleTextActive,
                                      ]}
                                    >
                                      Sat
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          )}
                          {mapRegion && (
                            <View
                              style={{
                                flexDirection: "row",
                                marginTop: 8,
                                marginBottom: 10,
                              }}
                            >
                              <TouchableOpacity
                                style={styles.mapActionBtn}
                                onPress={async () => {
                                  try {
                                    const { status } =
                                      await Location.requestForegroundPermissionsAsync();
                                    if (status !== "granted") return;
                                    const pos =
                                      await Location.getCurrentPositionAsync(
                                        {},
                                      );
                                    if (pos?.coords) {
                                      setMapRegion({
                                        latitude: pos.coords.latitude,
                                        longitude: pos.coords.longitude,
                                        latitudeDelta: 0.0922,
                                        longitudeDelta: 0.0421,
                                      });
                                      setSelectedPlaceName("Current location");
                                    }
                                  } catch {}
                                }}
                              >
                                <Text style={styles.mapActionText}>
                                  Use Current Location
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.mapActionBtn, { marginLeft: 8 }]}
                                onPress={openDirections}
                              >
                                <Text style={styles.mapActionText}>
                                  Navigate
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {selectedPlaceName ? (
                            <Text
                              style={{
                                color: "#374151",
                                fontSize: 12,
                                marginBottom: 6,
                              }}
                              numberOfLines={1}
                            >
                              Selected: {selectedPlaceName}
                            </Text>
                          ) : null}

                          <Text style={styles.label}>Usage</Text>
                          <Picker
                            selectedValue={form.usage}
                            onValueChange={(v) => {
                              setForm({ ...form, usage: v });
                            }}
                            style={[
                              styles.picker,
                              errors.usage && styles.inputError,
                            ]}
                          >
                            <Picker.Item label="Select" value="" />
                            <Picker.Item label="Lease" value="lease" />
                            <Picker.Item label="Rent" value="rent" />
                          </Picker>
                          {errors.usage ? (
                            <Text style={styles.errorText}>{errors.usage}</Text>
                          ) : null}

                          <Text style={styles.label}>Facilities</Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 10,
                            }}
                          >
                            <View
                              style={[
                                styles.inputContainer,
                                { flex: 1, marginBottom: 0 },
                              ]}
                            >
                              <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Add new facility"
                                placeholderTextColor="gray"
                                value={newFacilityText}
                                onChangeText={setNewFacilityText}
                              />
                            </View>
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() => {
                                if (newFacilityText.trim()) {
                                  setCustomFacilities([
                                    ...customFacilities,
                                    newFacilityText.trim(),
                                  ]);
                                  setNewFacilityText("");
                                }
                              }}
                            >
                              <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {customFacilities.map((facility, index) => (
                              <View key={index} style={styles.facilityTag}>
                                <Text style={styles.facilityText}>
                                  {facility}
                                </Text>
                                <TouchableOpacity
                                  style={styles.removeButton}
                                  onPress={() => {
                                    setCustomFacilities(
                                      customFacilities.filter(
                                        (_, i) => i !== index,
                                      ),
                                    );
                                  }}
                                >
                                  <Text style={styles.removeButtonText}>-</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {[
                              "Water",
                              "Parking",
                              "Lift",
                              "AC",
                              "Non AC",
                              "Power Backup",
                            ].map((label) => {
                              const isSelected =
                                selectedFacilities.includes(label);
                              return (
                                <TouchableOpacity
                                  key={label}
                                  style={[
                                    styles.facilityTag,
                                    isSelected && styles.presetSelected,
                                  ]}
                                  onPress={() => {
                                    const exists =
                                      selectedFacilities.includes(label);
                                    setSelectedFacilities(
                                      exists
                                        ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                        : [...selectedFacilities, label],
                                    );
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.facilityText,
                                      isSelected && { color: "#ffffff" },
                                    ]}
                                  >
                                    {label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {errors.facilities ? (
                            <Text style={styles.errorText}>
                              {errors.facilities}
                            </Text>
                          ) : null}
                        </>
                      )}

                      {/* BANK DETAILS FOR ALL */}
                      {form.stayType !== "" && (
                        <>
                          <Text style={styles.sectionTitle}>Bank Details</Text>
                          <TextInput
                            placeholder="Bank Name"
                            style={[
                              styles.input,
                              errors.bankName && styles.inputError,
                            ]}
                            value={form.bankName}
                            onChangeText={(v) => {
                              setForm({ ...form, bankName: v });
                              setErrors({
                                ...errors,
                                bankName: validateBankName(v),
                              });
                            }}
                          />
                          {errors.bankName ? (
                            <Text style={styles.errorText}>
                              {errors.bankName}
                            </Text>
                          ) : null}

                          <TextInput
                            placeholder="IFSC"
                            style={[
                              styles.input,
                              errors.ifsc && styles.inputError,
                            ]}
                            value={form.ifsc}
                            autoCapitalize="characters"
                            maxLength={11}
                            onChangeText={(v) => {
                              setForm({ ...form, ifsc: v.toUpperCase() });
                              setErrors({ ...errors, ifsc: validateIFSC(v) });
                            }}
                          />
                          {errors.ifsc ? (
                            <Text style={styles.errorText}>{errors.ifsc}</Text>
                          ) : null}

                          <TextInput
                            placeholder="Account Number"
                            style={[
                              styles.input,
                              errors.accountNo && styles.inputError,
                            ]}
                            value={form.accountNo}
                            keyboardType="numeric"
                            maxLength={18}
                            onChangeText={(v) => {
                              setForm({ ...form, accountNo: v });
                              setErrors({
                                ...errors,
                                accountNo: validateAccountNo(v),
                              });
                            }}
                          />
                          {errors.accountNo ? (
                            <Text style={styles.errorText}>
                              {errors.accountNo}
                            </Text>
                          ) : null}
                        </>
                      )}

                      {/* DOCUMENTS */}
                      {form.stayType !== "" && (
                        <>
                          <Text style={styles.sectionTitle}>Documents</Text>
                          {/* Property document (single) */}
                          <View style={{ marginVertical: 5 }}>
                            <Text style={styles.label}>Property Document</Text>
                            <TouchableOpacity
                              style={[
                                styles.btn,
                                {
                                  backgroundColor: LIGHT_PURPLE,
                                },
                                errors.document_property && {
                                  borderColor: "#dc2626",
                                  borderWidth: 2,
                                },
                              ]}
                              onPress={() => pickDoc("property")}
                            >
                              <Text style={{ color: "#fff" }}>
                                {form.documents.property
                                  ? "Uploaded ✓"
                                  : "Upload"}
                              </Text>
                            </TouchableOpacity>
                            {errors.document_property ? (
                              <Text style={styles.errorText}>
                                {errors.document_property}
                              </Text>
                            ) : null}
                          </View>

                          {/* Home pictures (multiple) */}
                          <View style={{ marginVertical: 5 }}>
                            <Text style={styles.label}>
                              {form.stayType === "hostel"
                                ? "Hostel Images"
                                : form.stayType === "apartment"
                                  ? "Apartment Images"
                                  : "Commercial Images"}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.btn,
                                  {
                                    flex: 1,
                                    backgroundColor:
                                      Array.isArray(form.documents.homePics) &&
                                      form.documents.homePics.length > 0
                                        ? "#10b981" // Green for success
                                        : LIGHT_PURPLE,
                                  },
                                  errors.document_homePics && {
                                    borderColor: "#dc2626",
                                    borderWidth: 2,
                                  },
                                ]}
                                onPress={() => pickDoc("homePics")}
                              >
                                <Text style={{ color: "#fff" }}>
                                  {Array.isArray(form.documents.homePics) &&
                                  form.documents.homePics.length > 0
                                    ? `Uploaded ${form.documents.homePics.length} ✓`
                                    : "Add Image"}
                                </Text>
                              </TouchableOpacity>

                              {Array.isArray(form.documents.homePics) &&
                                form.documents.homePics.length > 0 && (
                                  <TouchableOpacity
                                    style={[
                                      styles.btn,
                                      {
                                        marginLeft: 10,
                                        backgroundColor: LIGHT_PURPLE,
                                        paddingHorizontal: 15,
                                      },
                                    ]}
                                    onPress={() => pickDoc("homePics")}
                                  >
                                    <Text style={{ color: "#fff" }}>
                                      + Upload More
                                    </Text>
                                  </TouchableOpacity>
                                )}
                            </View>
                            {errors.document_homePics ? (
                              <Text style={styles.errorText}>
                                {errors.document_homePics}
                              </Text>
                            ) : null}
                            {Array.isArray(form.documents.homePics) &&
                              form.documents.homePics.length > 0 && (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    marginTop: 8,
                                  }}
                                >
                                  {form.documents.homePics.map((img, idx) => (
                                    <View
                                      key={idx}
                                      style={{
                                        marginRight: 8,
                                        marginBottom: 8,
                                        position: "relative",
                                      }}
                                    >
                                      <Image
                                        source={{ uri: img.uri }}
                                        style={{
                                          width: 64,
                                          height: 64,
                                          borderRadius: 6,
                                          borderWidth: 1,
                                          borderColor: "#cbd5e0",
                                        }}
                                      />
                                      <TouchableOpacity
                                        onPress={() => {
                                          const current = Array.isArray(
                                            form.documents.homePics,
                                          )
                                            ? form.documents.homePics
                                            : [];
                                          const updated = current.filter(
                                            (_, i) => i !== idx,
                                          );
                                          const newErrors = { ...errors };
                                          if (updated.length === 0) {
                                            newErrors.document_homePics =
                                              "Home pictures are required";
                                          } else {
                                            delete newErrors.document_homePics;
                                          }
                                          setForm({
                                            ...form,
                                            documents: {
                                              ...form.documents,
                                              homePics: updated,
                                            },
                                          });
                                          setErrors(newErrors);
                                        }}
                                        style={{
                                          position: "absolute",
                                          top: -6,
                                          right: -6,
                                          backgroundColor: "#dc2626",
                                          borderRadius: 10,
                                          paddingHorizontal: 6,
                                          paddingVertical: 2,
                                        }}
                                      >
                                        <Text style={{ color: "#fff" }}>x</Text>
                                      </TouchableOpacity>
                                    </View>
                                  ))}
                                </View>
                              )}
                          </View>
                          {/* <View style={{ marginTop: 8, marginBottom: 4 }}>
                          <TouchableOpacity
                            style={[styles.btn, { backgroundColor: "#2F80ED" }]}
                            onPress={() => {
                              const q = (form.location || "").trim();
                              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "near me")}`;
                              Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
                            }}
                          >
                            <Text style={{ color: "#fff" }}>Open in Google Maps</Text>
                          </TouchableOpacity>
                        </View> */}
                        </>
                      )}
                    </>
                  )}

                  {/* ---------- STEP 3 ---------- */}
                  {step === 3 && (
                    <Step3 form={form} onUpdateFloors={handleUpdateFloors} />
                  )}

                  <View style={styles.actionBar}>
                    {step > 1 && (
                      <TouchableOpacity
                        style={[styles.btn, { flex: 1, marginRight: 8 }]}
                        onPress={() => setStep(step - 1)}
                      >
                        <Text style={{ color: "#fff" }}>Back</Text>
                      </TouchableOpacity>
                    )}

                    {step < 3 ? (
                      <TouchableOpacity
                        style={[
                          styles.btn,
                          { flex: 1 },
                          ((step === 1 && !validateStep1()) ||
                            (step === 2 && !validateStep2())) &&
                            styles.btnDisabled,
                        ]}
                        onPress={next}
                        disabled={
                          (step === 1 && !validateStep1()) ||
                          (step === 2 && !validateStep2())
                        }
                      >
                        <Text style={{ color: "#fff" }}>Next</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.btn,
                          { flex: 1, backgroundColor: "#6F6ED1" },
                        ]}
                        onPress={() => {
                          const floors = form.floorsData || [];

                          // Check floor
                          if (floors.length < 1) {
                            Alert.alert("Error", "Please add at least 1 floor");
                            return;
                          }

                          // HOSTEL → Rooms required
                          if (form.stayType === "hostel") {
                            const totalRooms = floors.reduce(
                              (sum, floor) =>
                                sum + (floor.rooms ? floor.rooms.length : 0),
                              0,
                            );

                            if (totalRooms < 1) {
                              Alert.alert(
                                "Error",
                                "Please add at least 1 room",
                              );
                              return;
                            }
                          }

                          // APARTMENT → Flats required
                          if (form.stayType === "apartment") {
                            const totalFlats = floors.reduce(
                              (sum, floor) =>
                                sum + (floor.flats ? floor.flats.length : 0),
                              0,
                            );

                            if (totalFlats < 1) {
                              Alert.alert(
                                "Error",
                                "Please add at least 1 flat",
                              );
                              return;
                            }
                          }

                          // COMMERCIAL → Sqft required
                          if (form.stayType === "commercial") {
                            if (!form.sqft || form.sqft === "") {
                              Alert.alert("Error", "Please enter square feet");
                              return;
                            }
                          }

                          submit();
                        }}
                      >
                        <Text style={{ color: "#fff" }}>Submit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function Step3({ form, onUpdateFloors }) {
  const stayType = form?.stayType || "";
  const [floorInput, setFloorInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [floors, setFloors] = useState([]);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsOpen, setRoomsOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const [roomSelectionMode, setRoomSelectionMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomBatchModalOpen, setRoomBatchModalOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const roomSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);

  useEffect(() => {
    if (roomsOpen) {
      Animated.timing(roomSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      roomSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [roomsOpen, roomSlideAnim]);

  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);

  const generateFloors = () => {
    Keyboard.dismiss();
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert("Limit", "Floors cannot exceed 60");
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            rooms: [],
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
  };

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };

  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setSelectedRoom(null);
      setRoomsOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert("Delete Floors", `Delete ${selectedFloors.length} floor(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchRooms = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(30, num);
    if (capped !== num) {
      Alert.alert("Limit", "Rooms per floor cannot exceed 30");
    }
    const updated = [...floors];
    selectedFloors.forEach((idx) => {
      updated[idx].rooms = Array.from({ length: capped }, (_, i) => ({
        roomNo: i + 1,
        beds: 1,
      }));
    });
    setFloors(updated);
    setRoomInput("");
    setBatchModalOpen(false);
    setSelectionMode(false);
    setSelectedFloors([]);
  };

  const addRoomManually = () => {
    if (selectedFloor === null) return;
    const updated = [...floors];
    const currentRooms = updated[selectedFloor].rooms;
    if (currentRooms.length >= 30) {
      Alert.alert("Limit", "Rooms per floor cannot exceed 30");
      return;
    }
    const newRoom = { roomNo: currentRooms.length + 1, beds: 1 };
    updated[selectedFloor].rooms = [...currentRooms, newRoom];
    setFloors(updated);
  };

  const handleRoomLongPress = (index) => {
    setRoomSelectionMode(true);
    setSelectedRooms([index]);
  };

  const handleRoomPress = (index) => {
    if (roomSelectionMode) {
      if (selectedRooms.includes(index)) {
        const next = selectedRooms.filter((i) => i !== index);
        setSelectedRooms(next);
        if (next.length === 0) setRoomSelectionMode(false);
      } else {
        setSelectedRooms([...selectedRooms, index]);
      }
    } else {
      setSelectedRoom(selectedRoom === index ? null : index);
    }
  };

  const deleteSelectedRooms = () => {
    Alert.alert("Delete Rooms", `Delete ${selectedRooms.length} room(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = [...floors];
          const remainingRooms = updated[selectedFloor].rooms.filter(
            (_, idx) => !selectedRooms.includes(idx),
          );
          updated[selectedFloor].rooms = remainingRooms.map((r, i) => ({
            ...r,
            roomNo: i + 1,
          }));
          setFloors(updated);
          setRoomSelectionMode(false);
          setSelectedRooms([]);
        },
      },
    ]);
  };

  const applyBatchSharing = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    selectedRooms.forEach((idx) => {
      updated[selectedFloor].rooms[idx].beds = Math.min(8, num);
    });
    setFloors(updated);
    setRoomInput("");
    setRoomBatchModalOpen(false);
    setRoomSelectionMode(false);
    setSelectedRooms([]);
  };

  const updateBeds = (change) => {
    const updated = [...floors];
    const room = updated[selectedFloor].rooms[selectedRoom];
    room.beds = Math.max(1, Math.min(8, room.beds + change));
    setFloors(updated);
  };

  const generateRoomsForFloor = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0 || selectedFloor === null) return;
    const capped = Math.min(30, num);
    if (capped !== num) {
      Alert.alert("Limit", "Rooms per floor cannot exceed 30");
    }
    const updated = [...floors];
    updated[selectedFloor].rooms = Array.from({ length: capped }, (_, i) => ({
      roomNo: i + 1,
      beds: 1,
    }));
    setFloors(updated);
    setRoomInput("");
  };

  const totalRoomsCount = floors.reduce((acc, f) => acc + f.rooms.length, 0);
  const currentFloorRooms =
    selectedFloor !== null ? floors[selectedFloor]?.rooms.length : 0;
  const currentFloorBeds =
    selectedFloor !== null
      ? floors[selectedFloor]?.rooms.reduce((sum, r) => sum + r.beds, 0)
      : 0;

  return stayType === "apartment" ? (
    <ApartmentLayout onUpdateFloors={onUpdateFloors} />
  ) : stayType === "commercial" ? (
    <CommercialLayout onUpdateFloors={onUpdateFloors} />
  ) : (
    <View style={step3Styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={step3Styles.row}>
          <TextInput
            placeholder="No. of Floors"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={step3Styles.input}
          />
          <TouchableOpacity style={step3Styles.setBtn} onPress={generateFloors}>
            <Text style={step3Styles.btnText}>
              {floors.length ? "Update" : "Set"}
            </Text>
          </TouchableOpacity>
        </View>

        {floors.length > 0 ? (
          <View style={step3Styles.centerContainer}>
            <TouchableOpacity
              style={step3Styles.buildingBox}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <View style={step3Styles.iconCircle}>
                <Ionicons name="business" size={50} color={LIGHT_PURPLE} />
              </View>
              <Text style={step3Styles.buildingText}>Configure Building</Text>
              <Text style={step3Styles.buildingSubText}>
                {floors.length} Floors • {totalRoomsCount} Rooms total
              </Text>
              <View style={step3Styles.manageBadge}>
                <Text style={step3Styles.manageText}>Open Layout Editor</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={LIGHT_PURPLE}
                />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={step3Styles.emptyState}>
            <Ionicons name="business-outline" size={60} color={LIGHT_PURPLE} />
            <Text style={step3Styles.emptyText}>
              Enter floor count to start building
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} Selected`
                  : "Select a Floor"}
              </Text>
              {selectionMode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={step3Styles.gridContainer}>
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                          step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    Floor {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {floor.rooms.length} Rooms
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>Apply Rooms</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={step3Styles.closeBtn}
                onPress={() => setBuildingOpen(false)}
              >
                <Text style={step3Styles.btnText}>Done</Text>
              </TouchableOpacity>
            )}

            {roomsOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: roomSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setRoomsOpen(false);
                      setRoomSelectionMode(false);
                      setSelectedRooms([]);
                    }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color={LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                  <Text style={step3Styles.headerTitle}>
                    {roomSelectionMode
                      ? `${selectedRooms.length} Selected`
                      : `Floor ${floors[selectedFloor].floorNo}`}
                  </Text>
                  {roomSelectionMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setRoomSelectionMode(false);
                        setSelectedRooms([]);
                      }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!roomSelectionMode && <View style={{ width: 28 }} />}
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder="Rooms count"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={roomInput}
                    onChangeText={setRoomInput}
                    style={step3Styles.input}
                  />
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={generateRoomsForFloor}
                  >
                    <Text style={step3Styles.btnText}>Set</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={addRoomManually}
                  >
                    <Ionicons name="add" size={18} color={WHITE} />
                    <Text style={step3Styles.btnText}> Add</Text>
                  </TouchableOpacity>
                </View>

                <View style={step3Styles.counterBox}>
                  <Text style={step3Styles.counterText}>
                    Rooms: {currentFloorRooms} | Total Beds: {currentFloorBeds}
                  </Text>
                </View>

                <ScrollView contentContainerStyle={step3Styles.gridContainer}>
                  {floors[selectedFloor].rooms.map((room, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        step3Styles.gridCard,
                        (selectedRoom === index ||
                          selectedRooms.includes(index)) &&
                          step3Styles.selectedCard,
                      ]}
                      onLongPress={() => handleRoomLongPress(index)}
                      onPress={() => handleRoomPress(index)}
                    >
                      {roomSelectionMode && (
                        <View
                          style={[
                            step3Styles.checkCircle,
                            selectedRooms.includes(index) &&
                              step3Styles.checkCircleActive,
                          ]}
                        >
                          {selectedRooms.includes(index) && (
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color="white"
                            />
                          )}
                        </View>
                      )}
                      <Text
                        style={[
                          step3Styles.gridCardTitle,
                          (selectedRoom === index ||
                            selectedRooms.includes(index)) && {
                            color: "#2F80ED",
                          },
                        ]}
                      >
                        {floors[selectedFloor].floorNo * 100 + room.roomNo}
                      </Text>
                      <Text style={step3Styles.cardSub}>
                        {room.beds} Sharing
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {roomSelectionMode ? (
                  <View style={step3Styles.selectionFooter}>
                    <TouchableOpacity
                      style={step3Styles.smallActionBtn}
                      onPress={() =>
                        setSelectedRooms(
                          floors[selectedFloor].rooms.map((_, i) => i),
                        )
                      }
                    >
                      <Text style={step3Styles.smallBtnText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        step3Styles.smallActionBtn,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                      onPress={deleteSelectedRooms}
                    >
                      <Text
                        style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={step3Styles.primaryBtn}
                      onPress={() => setRoomBatchModalOpen(true)}
                    >
                      <Text style={step3Styles.btnText}>Apply Sharing</Text>
                    </TouchableOpacity>
                  </View>
                ) : selectedRoom !== null ? (
                  <View style={step3Styles.sharingBox}>
                    <Text style={step3Styles.sharingTitle}>
                      Beds in Room{" "}
                      {floors[selectedFloor].floorNo * 100 +
                        floors[selectedFloor].rooms[selectedRoom].roomNo}
                    </Text>
                    <View style={step3Styles.sharingRow}>
                      <TouchableOpacity onPress={() => updateBeds(-1)}>
                        <Ionicons
                          name="remove-circle"
                          size={48}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                      <Text style={step3Styles.bedCount}>
                        {floors[selectedFloor].rooms[selectedRoom].beds}
                      </Text>
                      <TouchableOpacity onPress={() => updateBeds(1)}>
                        <Ionicons
                          name="add-circle"
                          size={48}
                          color={LIGHT_PURPLE}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={step3Styles.closeBtn}
                    onPress={() => setRoomsOpen(false)}
                  >
                    <Text style={step3Styles.btnText}>Done</Text>
                  </TouchableOpacity>
                )}

                {roomBatchModalOpen && (
                  <View style={step3Styles.batchPopup}>
                    <Text style={step3Styles.popupTitle}>
                      Apply Sharing to {selectedRooms.length} Rooms
                    </Text>
                    <TextInput
                      placeholder="No."
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={roomInput}
                      onChangeText={setRoomInput}
                      autoFocus
                      style={step3Styles.batchInput}
                    />
                    <View style={step3Styles.row}>
                      <TouchableOpacity
                        style={step3Styles.secondaryBtn}
                        onPress={() => setRoomBatchModalOpen(false)}
                      >
                        <Text style={step3Styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                        onPress={applyBatchSharing}
                      >
                        <Text style={step3Styles.btnText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {batchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  Set Rooms for {selectedFloors.length} Floors
                </Text>
                <TextInput
                  placeholder="Rooms per floor"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={roomInput}
                  onChangeText={setRoomInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchRooms}
                  >
                    <Text style={step3Styles.btnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function ApartmentLayout({ onUpdateFloors }) {
  const [floorInput, setFloorInput] = useState("");
  const [flatInput, setFlatInput] = useState("");
  const [bhkInput, setBhkInput] = useState("");
  const [floors, setFloors] = useState([]);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatsOpen, setFlatsOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const [flatSelectionMode, setFlatSelectionMode] = useState(false);
  const [selectedFlats, setSelectedFlats] = useState([]);
  const [bhkBatchModalOpen, setBhkBatchModalOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const flatSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);

  useEffect(() => {
    if (flatsOpen) {
      Animated.timing(flatSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      flatSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [flatsOpen, flatSlideAnim]);

  const generateFloors = () => {
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert("Limit", "Floors cannot exceed 60");
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            flats: [],
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
  };

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };
  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setSelectedFlat(null);
      setFlatsOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert("Delete Floors", `Delete ${selectedFloors.length} floor(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchFlats = () => {
    const num = parseInt(flatInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(20, num);
    if (capped !== num) {
      Alert.alert("Limit", "Flats per floor cannot exceed 20");
    }
    const updated = [...floors];
    selectedFloors.forEach((idx) => {
      updated[idx].flats = Array.from({ length: capped }, (_, i) => ({
        flatNo: i + 1,
        bhk: 1,
      }));
    });
    setFloors(updated);
    setFlatInput("");
    setBatchModalOpen(false);
    setSelectionMode(false);
    setSelectedFloors([]);
  };

  const addFlatManually = () => {
    if (selectedFloor === null) return;
    const updated = [...floors];
    const currentFlats = updated[selectedFloor].flats;
    if (currentFlats.length >= 20) {
      Alert.alert("Limit", "Flats per floor cannot exceed 20");
      return;
    }
    const newFlat = { flatNo: currentFlats.length + 1, bhk: 1 };
    updated[selectedFloor].flats = [...currentFlats, newFlat];
    setFloors(updated);
  };

  const handleFlatLongPress = (index) => {
    setFlatSelectionMode(true);
    setSelectedFlats([index]);
  };
  const handleFlatPress = (index) => {
    if (flatSelectionMode) {
      if (selectedFlats.includes(index)) {
        const next = selectedFlats.filter((i) => i !== index);
        setSelectedFlats(next);
        if (next.length === 0) setFlatSelectionMode(false);
      } else {
        setSelectedFlats([...selectedFlats, index]);
      }
    } else {
      setSelectedFlat(selectedFlat === index ? null : index);
    }
  };

  const deleteSelectedFlats = () => {
    Alert.alert("Delete Flats", `Delete ${selectedFlats.length} flat(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = [...floors];
          const remainingFlats = updated[selectedFloor].flats.filter(
            (_, idx) => !selectedFlats.includes(idx),
          );
          updated[selectedFloor].flats = remainingFlats.map((r, i) => ({
            ...r,
            flatNo: i + 1,
          }));
          setFloors(updated);
          setFlatSelectionMode(false);
          setSelectedFlats([]);
        },
      },
    ]);
  };

  const applyBatchBhk = () => {
    const num = parseInt(bhkInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    selectedFlats.forEach((idx) => {
      updated[selectedFloor].flats[idx].bhk = Math.min(6, Math.max(1, num));
    });
    setFloors(updated);
    setBhkInput("");
    setBhkBatchModalOpen(false);
    setFlatSelectionMode(false);
    setSelectedFlats([]);
  };

  const updateBhk = (change) => {
    const updated = [...floors];
    const flat = updated[selectedFloor].flats[selectedFlat];
    flat.bhk = Math.max(1, Math.min(6, flat.bhk + change));
    setFloors(updated);
  };

  const generateFlatsForFloor = () => {
    const num = parseInt(flatInput);
    if (isNaN(num) || num <= 0 || selectedFloor === null) return;
    const capped = Math.min(20, num);
    if (capped !== num) {
      Alert.alert("Limit", "Flats per floor cannot exceed 20");
    }
    const updated = [...floors];
    updated[selectedFloor].flats = Array.from({ length: capped }, (_, i) => ({
      flatNo: i + 1,
      bhk: 1,
    }));
    setFloors(updated);
    setFlatInput("");
  };

  const totalFlatsCount = floors.reduce((acc, f) => acc + f.flats.length, 0);

  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);

  return (
    <View style={step3Styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={step3Styles.row}>
          <TextInput
            placeholder="No. of Floors"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={step3Styles.input}
          />
          <TouchableOpacity
            style={step3Styles.setBtn}
            onPress={() => {
              Keyboard.dismiss();
              generateFloors();
            }}
          >
            <Text style={step3Styles.btnText}>
              {floors.length > 0 ? "Update" : "Set"}
            </Text>
          </TouchableOpacity>
        </View>

        {floors.length > 0 ? (
          <View style={step3Styles.centerContainer}>
            <TouchableOpacity
              style={step3Styles.buildingBox}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <View style={step3Styles.iconCircle}>
                <Ionicons name="business" size={50} color="#7209B7" />
              </View>
              <Text style={step3Styles.buildingText}>Configure Building</Text>
              <Text style={step3Styles.buildingSubText}>
                {floors.length} Floors • {totalFlatsCount} Flats total
              </Text>
              <View style={step3Styles.manageBadge}>
                <Text style={step3Styles.manageText}>Open Layout Editor</Text>
                <Ionicons name="chevron-forward" size={16} color="#7209B7" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={step3Styles.emptyState}>
            <Ionicons name="business-outline" size={60} color="#D1D5DB" />
            <Text style={step3Styles.emptyText}>
              Enter floor count to start building
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} Selected`
                  : "Select a Floor"}
              </Text>
              {selectionMode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={step3Styles.gridContainer}>
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                          step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    Floor {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {floor.flats.length} Flats
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>Apply Flats</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={step3Styles.closeBtn}
                onPress={() => setBuildingOpen(false)}
              >
                <Text style={step3Styles.btnText}>Done</Text>
              </TouchableOpacity>
            )}

            {flatsOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: flatSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setFlatsOpen(false);
                      setFlatSelectionMode(false);
                      setSelectedFlats([]);
                    }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color={LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                  <Text style={step3Styles.headerTitle}>
                    {flatSelectionMode
                      ? `${selectedFlats.length} Selected`
                      : `Floor ${floors[selectedFloor].floorNo}`}
                  </Text>
                  {flatSelectionMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setFlatSelectionMode(false);
                        setSelectedFlats([]);
                      }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!flatSelectionMode && <View style={{ width: 28 }} />}
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder="Flats count"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={flatInput}
                    onChangeText={setFlatInput}
                    style={step3Styles.input}
                  />
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={generateFlatsForFloor}
                  >
                    <Text style={step3Styles.btnText}>Set</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={addFlatManually}
                  >
                    <Ionicons name="add" size={18} color={WHITE} />
                    <Text style={step3Styles.btnText}> Add</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={step3Styles.gridContainer}>
                  {floors[selectedFloor].flats.map((flat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        step3Styles.gridCard,
                        (selectedFlat === index ||
                          selectedFlats.includes(index)) &&
                          step3Styles.selectedCard,
                      ]}
                      onLongPress={() => handleFlatLongPress(index)}
                      onPress={() => handleFlatPress(index)}
                    >
                      {flatSelectionMode && (
                        <View
                          style={[
                            step3Styles.checkCircle,
                            selectedFlats.includes(index) &&
                              step3Styles.checkCircleActive,
                          ]}
                        >
                          {selectedFlats.includes(index) && (
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color="white"
                            />
                          )}
                        </View>
                      )}
                      <Text
                        style={[
                          step3Styles.gridCardTitle,
                          (selectedFlat === index ||
                            selectedFlats.includes(index)) && {
                            color: "#7209B7",
                          },
                        ]}
                      >
                        {floors[selectedFloor].floorNo * 100 + flat.flatNo}
                      </Text>
                      <Text style={step3Styles.cardSub}>{flat.bhk} BHK</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {flatSelectionMode ? (
                  <View style={step3Styles.selectionFooter}>
                    <TouchableOpacity
                      style={step3Styles.smallActionBtn}
                      onPress={() =>
                        setSelectedFlats(
                          floors[selectedFloor].flats.map((_, i) => i),
                        )
                      }
                    >
                      <Text style={step3Styles.smallBtnText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        step3Styles.smallActionBtn,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                      onPress={deleteSelectedFlats}
                    >
                      <Text
                        style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={step3Styles.primaryBtn}
                      onPress={() => setBhkBatchModalOpen(true)}
                    >
                      <Text style={step3Styles.btnText}>Apply BHK</Text>
                    </TouchableOpacity>
                  </View>
                ) : selectedFlat !== null ? (
                  <View style={step3Styles.sharingBox}>
                    <Text style={step3Styles.sharingTitle}>
                      BHK for Flat{" "}
                      {floors[selectedFloor].floorNo * 100 +
                        floors[selectedFloor].flats[selectedFlat].flatNo}
                    </Text>
                    <View style={step3Styles.sharingRow}>
                      <TouchableOpacity onPress={() => updateBhk(-1)}>
                        <Ionicons
                          name="remove-circle"
                          size={48}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                      <Text style={step3Styles.bedCount}>
                        {floors[selectedFloor].flats[selectedFlat].bhk}
                      </Text>
                      <TouchableOpacity onPress={() => updateBhk(1)}>
                        <Ionicons
                          name="add-circle"
                          size={48}
                          color={LIGHT_PURPLE}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={step3Styles.closeBtn}
                    onPress={() => setFlatsOpen(false)}
                  >
                    <Text style={step3Styles.btnText}>Done</Text>
                  </TouchableOpacity>
                )}

                {bhkBatchModalOpen && (
                  <View style={step3Styles.batchPopup}>
                    <Text style={step3Styles.popupTitle}>
                      Apply BHK to {selectedFlats.length} Flats
                    </Text>
                    <TextInput
                      placeholder="No."
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={bhkInput}
                      onChangeText={setBhkInput}
                      autoFocus
                      style={step3Styles.batchInput}
                    />
                    <View style={step3Styles.row}>
                      <TouchableOpacity
                        style={step3Styles.secondaryBtn}
                        onPress={() => setBhkBatchModalOpen(false)}
                      >
                        <Text style={step3Styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                        onPress={applyBatchBhk}
                      >
                        <Text style={step3Styles.btnText}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {batchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  Set Flats for {selectedFloors.length} Floors
                </Text>
                <TextInput
                  placeholder="Flats per floor"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={flatInput}
                  onChangeText={setFlatInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchFlats}
                  >
                    <Text style={step3Styles.btnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function CommercialLayout({ onUpdateFloors }) {
  const [floorInput, setFloorInput] = useState("");
  const [floors, setFloors] = useState([]);
  const [buildingOpen, setBuildingOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const areaSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [areaBatchModalOpen, setAreaBatchModalOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");

  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);

  useEffect(() => {
    if (areaOpen) {
      Animated.timing(areaSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      areaSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [areaOpen, areaSlideAnim]);

  const generateFloors = () => {
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert("Limit", "Floors cannot exceed 60");
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            area: null,
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
  };

  const configuredCount = floors.filter(
    (f) => typeof f.area === "number",
  ).length;

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };

  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setAreaOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert("Delete Floors", `Delete ${selectedFloors.length} floor(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchArea = () => {
    const num = parseInt(areaInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    selectedFloors.forEach((idx) => {
      updated[idx].area = num;
    });
    setFloors(updated);
    setAreaInput("");
    setAreaBatchModalOpen(false);
    setSelectionMode(false);
    setSelectedFloors([]);
  };

  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);

  return (
    <View style={step3Styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={step3Styles.row}>
          <TextInput
            placeholder="No. of Floors"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={step3Styles.input}
          />
          <TouchableOpacity style={step3Styles.setBtn} onPress={generateFloors}>
            <Text style={step3Styles.btnText}>
              {floors.length > 0 ? "Update" : "Set"}
            </Text>
          </TouchableOpacity>
        </View>

        {floors.length > 0 ? (
          <View style={step3Styles.centerContainer}>
            <TouchableOpacity
              style={step3Styles.buildingBox}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <View style={step3Styles.iconCircle}>
                <Ionicons name="business" size={50} color="#7209B7" />
              </View>
              <Text style={step3Styles.buildingText}>Configure Building</Text>
              <Text style={step3Styles.buildingSubText}>
                {floors.length} Floors • {configuredCount} Configured
              </Text>
              <View style={step3Styles.manageBadge}>
                <Text style={step3Styles.manageText}>Open Layout Editor</Text>
                <Ionicons name="chevron-forward" size={16} color="#7209B7" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={step3Styles.emptyState}>
            <Ionicons name="business-outline" size={60} color="#D1D5DB" />
            <Text style={step3Styles.emptyText}>
              Enter floor count to start building
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} Selected`
                  : "Select a Floor"}
              </Text>
              {selectionMode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView contentContainerStyle={step3Styles.gridContainer}>
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                          step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    Floor {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {typeof floor.area === "number"
                      ? `${floor.area} sq.ft`
                      : "No area"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setAreaBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>Apply Area</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={step3Styles.closeBtn}
                onPress={() => setBuildingOpen(false)}
              >
                <Text style={step3Styles.btnText}>Done</Text>
              </TouchableOpacity>
            )}

            {areaOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: areaSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setAreaOpen(false);
                    }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color={LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                  <Text
                    style={step3Styles.headerTitle}
                  >{`Floor ${floors[selectedFloor].floorNo}`}</Text>
                  <View style={{ width: 28 }} />
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder="Area (sq.ft)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={areaInput}
                    onChangeText={setAreaInput}
                    style={[step3Styles.input, step3Styles.inputCompact]}
                  />
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={() => {
                      const num = parseInt((areaInput || "").trim(), 10);
                      if (isNaN(num) || num <= 0) return;
                      const updated = [...floors];
                      updated[selectedFloor].area = num;
                      setFloors(updated);
                      setAreaOpen(false);
                      setAreaInput("");
                    }}
                  >
                    <Text style={step3Styles.btnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {areaBatchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  Apply Area to {selectedFloors.length} Floors
                </Text>
                <TextInput
                  placeholder="sq.ft"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={areaInput}
                  onChangeText={setAreaInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setAreaBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchArea}
                  >
                    <Text style={step3Styles.btnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const step3Styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: NAVY,
  },
  cardText: {
    fontSize: 14,
    color: GRAY,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  row: { flexDirection: "row", marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: NAVY,
  },
  setBtn: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 12,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  btnText: { color: WHITE, fontWeight: "600" },
  centerContainer: {
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buildingBox: {
    backgroundColor: WHITE,
    width: "100%",
    paddingVertical: 40,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buildingText: { color: NAVY, fontWeight: "800", fontSize: 22 },
  buildingSubText: { color: GRAY, fontSize: 14, marginTop: 8 },
  manageBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 25,
  },
  manageText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 4,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: DOT_INACTIVE,
    marginBottom: 20,
  },
  emptyText: {
    color: GRAY,
    marginTop: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: LIGHT_GRAY,
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: { color: NAVY, fontSize: 20, fontWeight: "bold" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingBottom: 20 },
  gridCard: {
    backgroundColor: WHITE,
    width: "30%",
    margin: "1.5%",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  selectedCard: {
    borderColor: LIGHT_PURPLE,
    borderWidth: 2,
    backgroundColor: LIGHT_GRAY,
  },
  gridCardTitle: { color: NAVY, fontWeight: "600", fontSize: 14 },
  cardSub: { color: GRAY, fontSize: 11, marginTop: 4 },
  roomsScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LIGHT_GRAY,
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  roomsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: { color: NAVY, fontSize: 18, fontWeight: "bold" },
  counterBox: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  counterText: { color: LIGHT_PURPLE, fontWeight: "700" },
  closeBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },
  sharingBox: {
    backgroundColor: WHITE,
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  sharingTitle: {
    color: GRAY,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  sharingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bedCount: {
    color: NAVY,
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 30,
  },
  checkCircle: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleActive: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: LIGHT_PURPLE,
  },
  selectionFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  smallActionBtn: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 14,
    width: 75,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  smallBtnText: { color: LIGHT_PURPLE, fontWeight: "700", fontSize: 12 },
  primaryBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
  },
  secondaryBtn: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  secondaryBtnText: { color: LIGHT_PURPLE, fontWeight: "600" },
  batchPopup: {
    backgroundColor: WHITE,
    padding: 25,
    borderRadius: 25,
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  popupTitle: {
    color: LIGHT_PURPLE,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  batchInput: {
    backgroundColor: LIGHT_GRAY,
    padding: 15,
    borderRadius: 12,
    color: NAVY,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  inputCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    height: 40,
    borderRadius: 8,
    width: "60%",
    alignSelf: "center",
    marginBottom: 8,
  },
});
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: "flex-start", // Reverted to flex-start to allow paddingTop
    alignItems: "stretch",
    paddingVertical: 10,
    paddingTop: 50, // Set padding to push content down
  },
  card: {
    width: "100%",
    height: "100%",
    maxWidth: 720,
    alignSelf: "center",
    backgroundColor: WHITE,
    borderRadius: 12, // Added border radius
    paddingTop: 10,
    paddingHorizontal: 30, // Increased horizontal padding
    paddingBottom: 20,
    marginVertical: 20, // Added vertical margin
    marginHorizontal: 15, // Added horizontal margin
    elevation: 6, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: LIGHT_PURPLE,
  },
  input: {
    color: "black",
    fontSize: 16,
    paddingVertical: 12, // Increased vertical padding for taller text boxes
  },
  inputError: { borderColor: "#dc2626", borderWidth: 2 },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginBottom: 10,
    marginTop: -3,
  },
  btnDisabled: { backgroundColor: LIGHT_PURPLE, opacity: 0.5 },
  picker: {
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    marginBottom: 10,
    color: LIGHT_PURPLE,
  },
  btn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 14,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 0,
  },
  btnText: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 16,
  },
  //  walker: {
  //   position: "absolute",
  //   top: -2, // Adjust as needed
  //   left: 10, // Adjust as needed
  //   zIndex: 1,
  // },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 10,
    marginTop: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  stepWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepItem: { alignItems: "center" },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
  },
  circleText: { color: WHITE, fontWeight: "bold", fontSize: 14 },
  stepLabel: { marginTop: 4, fontSize: 12, color: LIGHT_PURPLE },
  line: {
    height: 2,
    flex: 1,
    marginHorizontal: 5,
    marginTop: 6,
    backgroundColor: DOT_INACTIVE,
    position: "relative",
  },
  lineOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: LIGHT_PURPLE,
    transform: [{ scaleX: 0 }],
  },

  label: { fontWeight: "bold", marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  floorBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 5,
  },
  floorBtnText: {
    color: WHITE,
    fontWeight: "bold",
  },
  roomBtn: {
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  roomBtnText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
  },
  sharingWrap: { marginTop: 5, flexDirection: "row", flexWrap: "wrap" },
  sharingBtn: {
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 3,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  sharingBtnText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 12,
  },
  addFloorBtn: {
    marginTop: 20,
    backgroundColor: LIGHT_PURPLE,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addFloorBtnText: {
    color: WHITE,
    fontWeight: "bold",
  },
  addRoomBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 10,
    borderRadius: 20,
    marginTop: 5,
    alignItems: "center",
  },
  addRoomBtnText: {
    color: WHITE,
    fontWeight: "bold",
  },
  oval: {
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    margin: 4,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  ovalText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: WHITE,
    borderColor: DOT_INACTIVE,
    marginBottom: 10,
  },
  inputContainerStep2: {
    borderColor: DOT_INACTIVE, // Light gray border for step 2 inputs
  },
  inputIcon: {
    marginRight: 10, // Add some space between icon and text input
  },
  passwordToggle: {
    padding: 5,
  },
  addButton: {
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
  facilityTag: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  facilityText: {
    color: NAVY,
    marginRight: 5,
  },
  removeButton: {
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "bold",
  },
  presetSelected: {
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
  },
  mapActionBtn: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  mapActionText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionItem: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  suggestionText: {
    color: GRAY,
    fontSize: 14,
  },
  map: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#000",
  },
  mapWrap: { position: "relative" },
  mapControls: { position: "absolute", right: 8, top: 8, alignItems: "center" },
  zoomBtn: {
    backgroundColor: WHITE,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  zoomText: { color: NAVY, fontSize: 20, fontWeight: "700" },
  mapToggleWrap: { marginTop: 6, flexDirection: "row" },
  mapToggleBtn: {
    backgroundColor: WHITE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  mapToggleActive: { backgroundColor: LIGHT_PURPLE, borderColor: LIGHT_PURPLE },
  mapToggleText: { color: GRAY, fontWeight: "700", fontSize: 12 },
  mapToggleTextActive: { color: LIGHT_PURPLE },
});
