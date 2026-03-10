import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

export default function TenantHomeScreen() {
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedHostelType, setSelectedHostelType] = useState("");
  const [selectedTenantType, setSelectedTenantType] = useState("");
  const [selectedCommercialFeature, setSelectedCommercialFeature] =
    useState("");
  const [minRating, setMinRating] = useState(0);
  const [nearMe, setNearMe] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locationName, setLocationName] = useState("Fetching location...");
  const [isModalVisible, setModalVisible] = useState(false);
  const [mainSearch, setMainSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const step = useRef(0);
  const promoScrollRef = useRef(null);

  const API_URL =
    "https://3a95-2400-3b01-7-c4f-85bf-dd3e-1754-58a0.ngrok-free.app/api/properties/listing/";

  const categories = [
    { id: "1", name: "All", icon: "grid-outline" },
    { id: "2", name: "Hostel", icon: "bed-outline" },
    { id: "3", name: "Apartment", icon: "home-outline" },
    { id: "4", name: "Commercial", icon: "business-outline" },
  ];

  const offers = [
    {
      id: 1,
      title: "Limited Offer!",
      desc: "Get 20% off on your first month",
      color: "#667eea",
      icon: "gift-outline",
    },
    {
      id: 2,
      title: "Refer & Earn",
      desc: "Get ₹500 for every successful referral",
      color: "#764ba2",
      icon: "people-outline",
    },
    {
      id: 3,
      title: "New Listing",
      desc: "Premium PGs available in Gachibowli",
      color: "#2d3436",
      icon: "flash-outline",
    },
  ];

  const formatFacilityName = (facility) => {
    const map = {
      wifi: "WiFi",
      parking: "Parking",
      lift: "Lift",
      power_backup: "Power Backup",
      security: "Security",
      play_area: "Play Area",
      mess: "Food",
      laundry: "Laundry",
      water: "Water",
      ac: "AC",
      non_ac: "Non AC",
    };

    return map[facility] || facility;
  };

  const transformProperty = (item, index) => {
    return {
      id: item.id?.toString() || String(index + 1),
      type: item.type || "",
      hostelType: item.hostelType || "",
      name: item.name || "",
      address: item.address || "",
      contact: item.contact || "",
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      image: item.image || "https://via.placeholder.com/400x300?text=No+Image",
      isAvailable: item.isAvailable ?? true,
      rating: item.rating ?? 0,
      facilities: Array.isArray(item.facilities)
        ? item.facilities.map(formatFacilityName)
        : [],
      allowedTenants: item.allowedTenants || "",
      rules: item.rules || [],
    };
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      const serverData = Array.isArray(json.data) ? json.data : [];
      const formattedData = serverData.map((item, index) =>
        transformProperty(item, index),
      );

      setAllProperties(formattedData);
    } catch (err) {
      console.log("Fetch Properties Error:", err);
      setError("Failed to load properties");
      setAllProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (item) => {
    setSelectedProperty(item);
  };

  useEffect(() => {
    getLocation();
    fetchProperties();
  }, []);

  const getLocation = async () => {
    try {
      setLocationName("Fetching location...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Location permission denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      setUserCoords({ latitude, longitude });
      setMainSearch("");

      let addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        setLocationName(
          `${addr.district || addr.name || ""}, ${addr.city || addr.region || ""}`,
        );
      }
    } catch (error) {
      console.log("Location Error:", error);
      setLocationName("Unable to fetch location");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (offers.length > 0) {
        step.current = step.current >= offers.length - 1 ? 0 : step.current + 1;
        promoScrollRef.current?.scrollTo({
          x: step.current * (CARD_WIDTH + 15),
          animated: true,
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [offers.length]);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredProperties = allProperties.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(mainSearch.toLowerCase()) ||
      item.address.toLowerCase().includes(mainSearch.toLowerCase());

    const matchesType = selectedType === "All" || item.type === selectedType;

    let matchesDistance = true;
    if (nearMe > 0) {
      if (userCoords && item.latitude !== null && item.longitude !== null) {
        const distance = getDistance(
          userCoords.latitude,
          userCoords.longitude,
          item.latitude,
          item.longitude,
        );
        matchesDistance = distance <= nearMe;
      } else {
        matchesDistance = false;
      }
    }

    const matchesRating = (item.rating ?? 0) >= minRating;

    const matchesFacilities =
      selectedFacilities.length === 0 ||
      selectedFacilities.every((f) => item.facilities?.includes(f));

    let matchesSpecial = true;

    if (item.type === "Hostel" && selectedHostelType) {
      matchesSpecial =
        item.hostelType?.toLowerCase() === selectedHostelType.toLowerCase();
    }

    if (item.type === "Apartment" && selectedTenantType) {
      if (selectedTenantType === "Family") {
        matchesSpecial =
          item.allowedTenants === "FamilyOnly" ||
          item.allowedTenants === "FamilyAndBachelor";
      } else if (selectedTenantType === "Bachelor") {
        matchesSpecial =
          item.allowedTenants === "BachelorsOnly" ||
          item.allowedTenants === "FamilyAndBachelor";
      } else if (selectedTenantType === "1BHK") {
        matchesSpecial = item.facilities?.includes("1BHK");
      } else if (selectedTenantType === "2BHK") {
        matchesSpecial = item.facilities?.includes("2BHK");
      } else if (selectedTenantType === "3BHK") {
        matchesSpecial = item.facilities?.includes("3BHK");
      }
    }

    if (item.type === "Commercial" && selectedCommercialFeature) {
      matchesSpecial = item.facilities?.some((facility) =>
        facility
          .toLowerCase()
          .includes(selectedCommercialFeature.toLowerCase()),
      );
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesDistance &&
      matchesRating &&
      matchesFacilities &&
      matchesSpecial &&
      item.isAvailable
    );
  });

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            homeStyles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text>Loading properties...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            homeStyles.container,
            { justifyContent: "center", alignItems: "center", padding: 20 },
          ]}
        >
          <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity
            onPress={fetchProperties}
            style={{
              backgroundColor: "#667eea",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (selectedProperty) {
    return (
      <PropertyDetailsScreen
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={homeStyles.container}>
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.headerTitle}>Find Property</Text>
            <Text style={homeStyles.headerSub}>{locationName}</Text>
          </View>
          <View style={homeStyles.headerIcons}>
            <TouchableOpacity style={homeStyles.notifBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={homeStyles.searchWrapper}>
          <View style={homeStyles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={homeStyles.input}
              placeholder="Search name or location..."
              value={mainSearch}
              onChangeText={setMainSearch}
            />

            <TouchableOpacity
              onPress={() => {
                getLocation();
                fetchProperties();
              }}
              style={{
                paddingHorizontal: 10,
                borderLeftWidth: 1,
                borderLeftColor: "#eee",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="locate" size={22} color="#667eea" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={homeStyles.filterTrigger}
            >
              <Ionicons name="options-outline" size={22} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={homeStyles.promoWrapper}>
            <ScrollView
              ref={promoScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 15}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {offers.map((offer) => (
                <View
                  key={offer.id}
                  style={[
                    homeStyles.promoCard,
                    { backgroundColor: offer.color },
                  ]}
                >
                  <View style={homeStyles.promoTextContainer}>
                    <Text style={homeStyles.promoTitle}>{offer.title}</Text>
                    <Text style={homeStyles.promoDesc}>{offer.desc}</Text>
                  </View>
                  <Ionicons
                    name={offer.icon}
                    size={70}
                    color="rgba(255,255,255,0.2)"
                    style={homeStyles.promoIcon}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={homeStyles.categoryWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedType(cat.name)}
                  style={homeStyles.categoryItem}
                >
                  <View
                    style={[
                      homeStyles.iconBox,
                      selectedType === cat.name && homeStyles.activeIconBox,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={selectedType === cat.name ? "#fff" : "#667eea"}
                    />
                  </View>
                  <Text
                    style={[
                      homeStyles.categoryLabel,
                      selectedType === cat.name &&
                        homeStyles.activeCategoryLabel,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={homeStyles.listHeader}>
            <Text style={homeStyles.listTitle}>{selectedType} Listings</Text>
            <Text style={homeStyles.countText}>
              {filteredProperties.length} items
            </Text>
          </View>

          {filteredProperties.map((item, index) => (
            <TouchableOpacity
              key={`${item.type}-${item.id}-${index}`}
              activeOpacity={0.9}
              onPress={() => handlePress(item)}
            >
              <View style={homeStyles.card}>
                <Image
                  source={{ uri: item.image }}
                  style={homeStyles.cardImg}
                  resizeMode="cover"
                />
                <View style={homeStyles.ratingTag}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={homeStyles.ratingText}>
                    {item.rating ? item.rating : "New"}
                  </Text>
                </View>
                <View style={homeStyles.cardBody}>
                  <View style={homeStyles.row}>
                    <Text style={homeStyles.cardName}>{item.name}</Text>
                  </View>
                  <Text style={homeStyles.cardSub}>
                    {item.type} • {item.address}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredProperties.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={homeStyles.noResults}>No properties found.</Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={homeStyles.modalOverlay}>
            <View style={[homeStyles.modalContent, { height: "80%" }]}>
              <View style={homeStyles.modalHeader}>
                <Text style={homeStyles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={30} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={homeStyles.filterLabel}>Near By (Distance)</Text>
                <View style={homeStyles.filterRow}>
                  {[5, 10].map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      style={[
                        homeStyles.chip,
                        nearMe === dist && homeStyles.activeChip,
                      ]}
                      onPress={() => setNearMe(nearMe === dist ? 0 : dist)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={nearMe === dist ? "#fff" : "#667eea"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          homeStyles.chipText,
                          nearMe === dist && homeStyles.activeChipText,
                        ]}
                      >
                        Within {dist} KM
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={homeStyles.filterLabel}>Minimum Rating</Text>
                <View style={homeStyles.filterRow}>
                  {[3, 4, 4.5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        homeStyles.chip,
                        minRating === r && homeStyles.activeChip,
                      ]}
                      onPress={() => setMinRating(minRating === r ? 0 : r)}
                    >
                      <Ionicons
                        name="star"
                        size={14}
                        color={minRating === r ? "#fff" : "#FFD700"}
                      />
                      <Text
                        style={[
                          homeStyles.chipText,
                          minRating === r && homeStyles.activeChipText,
                        ]}
                      >
                        {" "}
                        {r}+
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={homeStyles.divider} />
                <Text style={homeStyles.filterLabel}>Category Specifics</Text>

                {selectedType === "Hostel" && (
                  <View>
                    <Text style={homeStyles.subLabel}>Hostel Type</Text>
                    <View style={homeStyles.filterRow}>
                      {["Boys", "Girls", "Coliving"].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            homeStyles.chip,
                            selectedHostelType === t && homeStyles.activeChip,
                          ]}
                          onPress={() =>
                            setSelectedHostelType(
                              selectedHostelType === t ? "" : t,
                            )
                          }
                        >
                          <Text
                            style={[
                              homeStyles.chipText,
                              selectedHostelType === t &&
                                homeStyles.activeChipText,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedType === "Apartment" && (
                  <View>
                    <Text style={homeStyles.subLabel}>Tenant / Size</Text>
                    <View style={homeStyles.filterRow}>
                      {["Family", "Bachelor", "1BHK", "2BHK", "3BHK"].map(
                        (t) => (
                          <TouchableOpacity
                            key={t}
                            style={[
                              homeStyles.chip,
                              selectedTenantType === t && homeStyles.activeChip,
                            ]}
                            onPress={() =>
                              setSelectedTenantType(
                                selectedTenantType === t ? "" : t,
                              )
                            }
                          >
                            <Text
                              style={[
                                homeStyles.chipText,
                                selectedTenantType === t &&
                                  homeStyles.activeChipText,
                              ]}
                            >
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  </View>
                )}

                {selectedType === "Commercial" && (
                  <View>
                    <Text style={homeStyles.subLabel}>Property Purpose</Text>
                    <View style={homeStyles.filterRow}>
                      {["Office", "Shop", "Coworking", "Warehouse"].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            homeStyles.chip,
                            selectedCommercialFeature === t &&
                              homeStyles.activeChip,
                          ]}
                          onPress={() =>
                            setSelectedCommercialFeature(
                              selectedCommercialFeature === t ? "" : t,
                            )
                          }
                        >
                          <Text
                            style={[
                              homeStyles.chipText,
                              selectedCommercialFeature === t &&
                                homeStyles.activeChipText,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {selectedType === "All" && (
                  <Text
                    style={{
                      color: "#999",
                      fontStyle: "italic",
                      marginBottom: 10,
                    }}
                  >
                    Select a category to see specific filters
                  </Text>
                )}

                <Text style={homeStyles.filterLabel}>Amenities</Text>
                <View style={homeStyles.filterRow}>
                  {[
                    "WiFi",
                    "Parking",
                    "AC",
                    "Gym",
                    "Security",
                    "Laundry",
                    "Food",
                    "Lift",
                    "Power Backup",
                  ].map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        homeStyles.chip,
                        selectedFacilities.includes(f) && homeStyles.activeChip,
                      ]}
                      onPress={() =>
                        setSelectedFacilities((prev) =>
                          prev.includes(f)
                            ? prev.filter((x) => x !== f)
                            : [...prev, f],
                        )
                      }
                    >
                      <Text
                        style={[
                          homeStyles.chipText,
                          selectedFacilities.includes(f) &&
                            homeStyles.activeChipText,
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                  <TouchableOpacity
                    style={[
                      homeStyles.applyBtn,
                      { flex: 1, backgroundColor: "#eee" },
                    ]}
                    onPress={() => {
                      setSelectedFacilities([]);
                      setSelectedHostelType("");
                      setSelectedTenantType("");
                      setSelectedCommercialFeature("");
                      setMinRating(0);
                      setNearMe(0);
                    }}
                  >
                    <Text style={{ color: "#333" }}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[homeStyles.applyBtn, { flex: 2 }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Apply Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PropertyDetailsScreen({ property, onBack }) {
  const [reviewImage, setReviewImage] = useState(null);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const [sharing, setSharing] = useState("");

  const [bhkType, setBhkType] = useState("");
  const [tenantType, setTenantType] = useState("");
  const [officeType, setOfficeType] = useState("");
  const [area, setArea] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");

  const galleryImages = property?.image
    ? [property.image, property.image, property.image]
    : [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1560184897-ae75f418493e",
      ];

  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const facilityIcons = {
    WiFi: "wifi",
    Food: "silverware-fork-knife",
    AC: "air-conditioner",
    Laundry: "washing-machine",
    Security: "shield-check",
    "24/7 Security": "shield-check",
    Housekeeping: "broom",
    Parking: "parking",
    Lift: "elevator",
    Gym: "dumbbell",
    "Power Backup": "battery-charging",
    Balcony: "home-floor-1",
    "Conference Room": "account-group",
    Reception: "desk",
    CCTV: "cctv",
    "Central AC": "air-conditioner",
    Water: "water",
    "Play Area": "soccer",
    "Non AC": "fan",
  };

  const ruleIcons = {
    "No Smoking": "smoking-off",
    "No Pets": "paw-off",
    "No Parties": "party-popper",
    "Visitors Allowed": "account-multiple-check",
    "Quiet Hours": "volume-off",
    "Late Entry": "clock-outline",
    "Security Deposit": "cash-lock",
    "Notice Period": "calendar-clock",
  };

  const promotionalOffers = [
    {
      id: "1",
      title: "Zero Brokerage",
      desc: "Book directly through the app.",
      code: "DIRECT2026",
      icon: "handshake",
      tag: "SPONSORED",
      colors: ["#667eea", "#764ba2"],
    },
    {
      id: "2",
      title: "Festive Rent Off",
      desc: "Flat ₹2000 off on 1st month.",
      code: "FESTIVE50",
      icon: "gift",
      tag: "LIMITED",
      colors: ["#4facfe", "#00f2fe"],
    },
    {
      id: "3",
      title: "New Year Special",
      desc: "Flat 10% off on first month rent",
      icon: "gift-outline",
      tag: "Festive",
      color: "#f093fb",
    },
  ];

  const reviews = [
    {
      id: "1",
      user: "Rahul S.",
      rating: 5,
      comment:
        "Amazing place! The staff is very helpful and the Wi-Fi is fast.",
      date: "2 days ago",
    },
    {
      id: "2",
      user: "Anjali P.",
      rating: 4,
      comment:
        "Very clean rooms and great location. Highly recommended for students.",
      date: "1 week ago",
    },
    {
      id: "3",
      user: "Amit K.",
      rating: 5,
      comment: "Best value for money in this area. Very secure.",
      date: "Oct 2025",
    },
  ];

  if (!property) {
    return (
      <View style={styles.center}>
        <Text>No Property Data</Text>
      </View>
    );
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.name}\nLocation: ${property.address || "In the city"}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReviewSubmit = () => {
    if (userRating === 0) {
      alert("Please select a rating!");
      return;
    }
    alert(`Thank you! Review submitted with ${userRating} stars!`);
    setModalVisible(false);
    setUserComment("");
    setUserRating(5);
  };

  const makeCall = () => Linking.openURL(`tel:${property.contact}`);
  const openWhatsApp = () =>
    Linking.openURL(
      `whatsapp://send?phone=${property.contact}&text=Hi, I am interested in ${property.name}`,
    );

  const openInGoogleMaps = () => {
    const latitude = property.latitude;
    const longitude = property.longitude;

    if (latitude === null || longitude === null) {
      alert("Location not available");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const confirmBooking = () => {
    if (!checkIn.trim()) {
      alert("Please enter a Check-in date");
      return;
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(checkIn)) {
      alert("Please enter Check-in date in DD/MM/YYYY format");
      return;
    }

    if (checkOut.trim() && !dateRegex.test(checkOut)) {
      alert("Invalid Check-out format. Use DD/MM/YYYY or leave it blank.");
      return;
    }

    if (property.type === "Hostel") {
      const guestNum = Number(guests);
      const sharingNum = Number(sharing);

      if (
        !guests ||
        isNaN(guestNum) ||
        guestNum <= 0 ||
        !Number.isInteger(guestNum)
      ) {
        alert("Please enter a valid whole number of guests (minimum 1)");
        return;
      }

      if (!sharing || isNaN(sharingNum) || sharingNum <= 0 || sharingNum > 8) {
        alert("Please enter a valid sharing preference (1 to 8 persons)");
        return;
      }
    }

    if (property.type === "Apartment") {
      if (!bhkType.trim()) {
        alert("Please specify BHK type (e.g., 2BHK)");
        return;
      }
      if (!tenantType) {
        alert("Please select Tenant Type (Family or Bachelor)");
        return;
      }
    }

    if (property.type === "Commercial") {
      const areaNum = Number(area);
      if (!officeType.trim()) {
        alert("Please enter the Office Type");
        return;
      }
      if (!area || isNaN(areaNum) || areaNum <= 0) {
        alert("Please enter a valid area in sq.ft");
        return;
      }
    }

    alert(
      `Booking Request Sent! 🎉\nWe will contact you shortly regarding ${property.name}.`,
    );

    setCheckIn("");
    setCheckOut("");
    setGuests("");
    setSharing("");
    setBhkType("");
    setOfficeType("");
    setArea("");
    setTenantType("");
    setBookingVisible(false);
  };

  const pickReviewImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert("Permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const sizeInKb = fileInfo.size / 1024;

        console.log("Image size:", sizeInKb);

        if (sizeInKb > 500) {
          alert("Image must be under 500KB");
          return;
        }

        setReviewImage(uri);
      }
    } catch (error) {
      console.log("Image Picker Error:", error);
      alert("Something went wrong while picking image.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={onShare} style={styles.backBtn}>
            <Ionicons name="share-outline" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Image source={{ uri: property.image }} style={styles.mainImage} />

        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.name}>{property.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {property.isAvailable ? "Available" : "Full"}
              </Text>
            </View>
          </View>

          <Text style={styles.typeText}>
            {property.type} • ⭐ {property.rating || "New"} ({reviews.length}{" "}
            reviews)
          </Text>

          <View style={{ marginTop: 25 }}>
            <View style={styles.promoHeader}>
              <Text style={styles.sectionTitlePromo}>Available Offers</Text>
              <TouchableOpacity onPress={() => alert("All coupons visible")}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 20,
                paddingRight: 10,
                paddingVertical: 5,
              }}
            >
              {promotionalOffers.map((offer) => (
                <View key={offer.id} style={styles.premiumOfferCard}>
                  <View
                    style={[
                      styles.colorAccent,
                      {
                        backgroundColor: offer.colors
                          ? offer.colors[0]
                          : offer.color,
                      },
                    ]}
                  />

                  <View style={styles.offerInnerContent}>
                    <View style={styles.offerMainRow}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor:
                              (offer.colors ? offer.colors[0] : offer.color) +
                              "15",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={offer.icon}
                          size={22}
                          color={offer.colors ? offer.colors[0] : offer.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.offerTitleText}>{offer.title}</Text>
                        <Text style={styles.offerSubtitleText}>
                          {offer.desc}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.offerSeparator} />

                    <View style={styles.offerBottomRow}>
                      <View style={styles.couponPill}>
                        <Text style={styles.couponPillText}>
                          {offer.code || "NO CODE"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.applyOfferBtn,
                          {
                            backgroundColor: offer.colors
                              ? offer.colors[0]
                              : offer.color,
                          },
                        ]}
                        onPress={() =>
                          alert(`Applied: ${offer.code || "Offer"}`)
                        }
                      >
                        <Text style={styles.applyOfferText}>APPLY</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.descriptionText}>
            This premium {property.type.toLowerCase()} offers a comfortable stay
            with all modern utilities. Located in a prime area with easy access
            to public transport and local markets.
          </Text>

          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.amenitiesGrid}>
            {property.facilities?.map((facility, index) => (
              <View key={index} style={styles.amenityItem}>
                <MaterialCommunityIcons
                  name={facilityIcons[facility] || "check-circle"}
                  size={22}
                  color="#667eea"
                />
                <Text style={styles.amenityLabel}>{facility}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.row, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>User Reviews</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
            >
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.seeAllText}>Write review</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => alert("Navigate to all reviews")}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reviewScroll}
          >
            {reviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.row}>
                  <Text style={styles.reviewUser}>{item.user}</Text>
                  <View style={styles.starBadge}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.starText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment} numberOfLines={3}>
                  {item.comment}
                </Text>
                <Text style={styles.reviewDate}>{item.date}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Location on Map</Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={{
                latitude: property.latitude || 17.385044,
                longitude: property.longitude || 78.486671,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: property.latitude || 17.385044,
                  longitude: property.longitude || 78.486671,
                }}
                title={property.name}
                description={property.address}
              />
            </MapView>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={openInGoogleMaps}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Open in Google Maps
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Property Gallery</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            {galleryImages.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedGalleryImage(img)}
              >
                <Image source={{ uri: img }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Property Rules & Policy</Text>
          <View style={styles.rulesContainer}>
            {property.rules && property.rules.length > 0 ? (
              property.rules.map((rule, index) => (
                <View key={index} style={styles.ruleRow}>
                  <View style={styles.ruleIconCircle}>
                    <MaterialCommunityIcons
                      name={ruleIcons[rule] || "information-outline"}
                      size={18}
                      color={rule.includes("No") ? "#ff4d4d" : "#667eea"}
                    />
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.descriptionText}>
                No specific rules listed.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate your experience</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setReviewImage(null);
                }}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingSubtitle}>Tap a star to rate</Text>

            <View style={styles.starRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setUserRating(star)}
                  style={styles.starWrapper}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={40}
                    color={star <= userRating ? "#FFD700" : "#ccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="How was the stay? The facilities? The location?"
              multiline
              numberOfLines={4}
              value={userComment}
              onChangeText={setUserComment}
            />

            <Text
              style={[
                styles.ratingSubtitle,
                { textAlign: "left", marginBottom: 5 },
              ]}
            >
              Add a photo (Max 500KB)
            </Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={pickReviewImage}
              >
                {reviewImage ? (
                  <Image
                    source={{ uri: reviewImage }}
                    style={styles.previewThumbnail}
                  />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera" size={24} color="#667eea" />
                    <Text style={styles.uploadText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>

              {reviewImage && (
                <TouchableOpacity
                  style={styles.removeImgBtn}
                  onPress={() => setReviewImage(null)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                  <Text style={{ color: "#ff4d4d", fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    userComment.length > 0 ? "#667eea" : "#aab8ff",
                },
              ]}
              onPress={() => {
                handleReviewSubmit();
                setReviewImage(null);
              }}
            >
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={bookingVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Property</Text>
              <TouchableOpacity onPress={() => setBookingVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Check-in Date (DD/MM/YYYY) *"
              value={checkIn}
              onChangeText={setCheckIn}
            />

            <TextInput
              style={styles.input}
              placeholder="Check-out Date (Optional)"
              value={checkOut}
              onChangeText={setCheckOut}
            />

            {property.type === "Hostel" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Number of Guests *"
                  keyboardType="number-pad"
                  value={guests}
                  onChangeText={setGuests}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Sharing (1-8 Persons) *"
                  keyboardType="number-pad"
                  value={sharing}
                  onChangeText={setSharing}
                />
              </>
            )}

            {property.type === "Apartment" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Select BHK (1BHK / 2BHK / 3BHK)"
                  value={bhkType}
                  onChangeText={setBhkType}
                />

                <Text style={{ fontWeight: "600", marginBottom: 10 }}>
                  Tenant Type
                </Text>

                <View
                  style={{ flexDirection: "row", gap: 15, marginBottom: 20 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.tenantBtn,
                      tenantType === "Family" && styles.activeTenantBtn,
                    ]}
                    onPress={() => setTenantType("Family")}
                  >
                    <Text
                      style={[
                        styles.tenantText,
                        tenantType === "Family" && styles.activeTenantText,
                      ]}
                    >
                      Family
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={property.allowedTenants === "FamilyOnly"}
                    style={[
                      styles.tenantBtn,
                      tenantType === "Bachelor" && styles.activeTenantBtn,
                      property.allowedTenants === "FamilyOnly" && {
                        opacity: 0.4,
                      },
                    ]}
                    onPress={() => setTenantType("Bachelor")}
                  >
                    <Text
                      style={[
                        styles.tenantText,
                        tenantType === "Bachelor" && styles.activeTenantText,
                      ]}
                    >
                      Bachelor
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {property.type === "Commercial" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Office Type (IT / Shop / Startup)"
                  value={officeType}
                  onChangeText={setOfficeType}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Required Area (in sq.ft)"
                  keyboardType="numeric"
                  value={area}
                  onChangeText={setArea}
                />
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={confirmBooking}>
              <Text style={styles.submitBtnText}>Request to Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.smallBtn} onPress={makeCall}>
          <Ionicons name="call" size={22} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => setBookingVisible(true)}
        >
          <Text style={styles.requestBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!selectedGalleryImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedGalleryImage(null)}
      >
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity
            style={styles.closeImageBtn}
            onPress={() => setSelectedGalleryImage(null)}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>

          {selectedGalleryImage && (
            <Image
              source={{ uri: selectedGalleryImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const homeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fe" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  headerIcons: { flexDirection: "row", gap: 10 },

  headerTitle: { fontSize: 22, fontWeight: "bold" },

  headerSub: { fontSize: 12, color: "gray" },

  notifBtn: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
    elevation: 1,
  },

  searchWrapper: { paddingHorizontal: 20, marginBottom: 15 },

  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    alignItems: "center",
    height: 50,
    elevation: 3,
  },

  input: { flex: 1, paddingHorizontal: 10 },

  filterTrigger: {
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 10,
  },

  promoWrapper: { marginBottom: 20 },

  promoCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    borderRadius: 20,
    padding: 20,
    height: 120,
    overflow: "hidden",
  },

  promoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  promoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  promoDesc: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },

  promoIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },

  categoryWrapper: { marginBottom: 20 },

  categoryScroll: { paddingHorizontal: 15 },

  categoryItem: {
    alignItems: "center",
    marginRight: 20,
    width: 70,
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 5,
  },

  activeIconBox: { backgroundColor: "#667eea" },

  categoryLabel: { fontSize: 11, color: "#999" },

  activeCategoryLabel: {
    color: "#667eea",
    fontWeight: "bold",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  listTitle: { fontSize: 16, fontWeight: "bold" },

  countText: { color: "#667eea", fontSize: 12 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
  },

  cardImg: {
    width: "100%",
    height: 160,
    backgroundColor: "#f0f0f0",
  },

  ratingTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 3,
  },

  cardBody: { padding: 15 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },

  cardSub: {
    color: "gray",
    fontSize: 12,
    marginTop: 4,
  },

  noResults: {
    textAlign: "center",
    marginTop: 10,
    color: "gray",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  applyBtn: {
    backgroundColor: "#667eea",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },

  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },

  subLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },

  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },

  activeChip: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },

  chipText: { fontSize: 13, color: "#555" },

  activeChipText: {
    color: "#fff",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: { padding: 10, backgroundColor: "#f0f2ff", borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 15 },
  mainImage: { width: "100%", height: 280 },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 22, fontWeight: "bold", flex: 1 },
  statusBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: "#667eea", fontWeight: "bold", fontSize: 11 },
  typeText: {
    color: "#667eea",
    fontWeight: "600",
    marginBottom: 15,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
  },
  descriptionText: { color: "#777", lineHeight: 20, fontSize: 14 },
  seeAllText: { color: "#667eea", fontSize: 14, fontWeight: "600" },

  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    padding: 10,
    borderRadius: 12,
    gap: 5,
  },
  amenityLabel: { fontSize: 12, color: "#555" },

  reviewScroll: { marginTop: 5 },
  reviewCard: {
    width: 220,
    backgroundColor: "#f8f9ff",
    padding: 15,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  reviewUser: { fontWeight: "bold", fontSize: 14 },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  starText: { fontSize: 10, fontWeight: "bold" },
  reviewComment: { fontSize: 12, color: "#666", marginTop: 8, lineHeight: 18 },
  reviewDate: { fontSize: 10, color: "#bbb", marginTop: 10 },

  mapContainer: {
    height: 160,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 5,
  },
  map: { ...StyleSheet.absoluteFillObject },
  galleryScroll: { marginTop: 5 },

  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
    gap: 8,
  },
  smallBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#f8f9ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  requestBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  requestBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },

  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  mapButton: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "#667eea",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    fontSize: 16,
  },

  tenantBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  activeTenantBtn: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },

  tenantText: {
    fontWeight: "600",
    color: "#333",
  },

  activeTenantText: {
    color: "#fff",
  },

  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  closeImageBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  galleryImage: {
    width: 140,
    height: 90,
    borderRadius: 15,
    marginRight: 12,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#eee",
  },

  ratingSubtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    fontSize: 14,
  },
  starRatingRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  starWrapper: {
    padding: 5,
  },
  textInput: {
    backgroundColor: "#f8f9ff",
    borderRadius: 15,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  submitBtn: {
    backgroundColor: "#667eea",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#667eea",
    borderStyle: "dashed",
    backgroundColor: "#f8f9ff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadText: {
    fontSize: 10,
    color: "#667eea",
    fontWeight: "bold",
    marginTop: 2,
  },
  previewThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 10,
    backgroundColor: "#fff0f0",
    borderRadius: 10,
  },

  rulesContainer: {
    backgroundColor: "#fdfdff",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#f0f2ff",
    marginTop: 5,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ruleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },

  offerScroll: {
    marginVertical: 10,
    marginLeft: -20,
    paddingLeft: 20,
  },
  offerCard: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: "relative",
    overflow: "hidden",
    height: 90,
    justifyContent: "center",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  offerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  offerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  offerDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  modernPromoCard: {
    width: 280,
    height: 160,
    borderRadius: 24,
    padding: 20,
    marginRight: 15,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#667eea",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitlePromo: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  premiumOfferCard: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 15,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  colorAccent: {
    width: 6,
    height: "100%",
  },
  offerInnerContent: {
    flex: 1,
    padding: 15,
  },
  offerMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  offerTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  offerSubtitleText: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  offerSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  offerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  couponPill: {
    backgroundColor: "#f8f9ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e5ff",
    borderStyle: "dashed",
  },
  couponPillText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#667eea",
    letterSpacing: 0.5,
  },
  applyOfferBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyOfferText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
