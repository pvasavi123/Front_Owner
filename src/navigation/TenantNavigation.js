import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TenantHomeScreen from "../screens/tenant/TenantHomeScreen";
import IssuesScreen from "../screens/tenant/TenantIssuesScreen";
import PaymentScreen from "../screens/tenant/TenantPaymentScreen";
import ProfileScreen from "../screens/tenant/TenantProfileScreen";
import COLORS from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function TenantNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Issues") iconName = "alert-circle";
          else if (route.name === "Payment") iconName = "card";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={TenantHomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Issues"
        component={IssuesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
