import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import OwnerHomeScreen from "../screens/owner/OwnerHomeScreen";
import OwnerIssuesScreen from "../screens/owner/OwnerIssuesScreen";
import OwnerPaymentScreen from "../screens/owner/OwnerPaymentScreen";
import OwnerProfileScreen from "../screens/owner/OwnerProfileScreen";

import COLORS from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function OwnerNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Payment") iconName = "card";
          else if (route.name === "Issues") iconName = "alert-circle";
          else if (route.name === "Profile") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={OwnerHomeScreen} />
      <Tab.Screen name="Payment" component={OwnerPaymentScreen} />
      <Tab.Screen name="Issues" component={OwnerIssuesScreen} />
      <Tab.Screen name="Profile" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
}
