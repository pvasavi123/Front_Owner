import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import LoginScreen from "../screens/auth/LoginScreen";
import OwnerLoginScreen from "../screens/auth/OwnerLoginScreen";
import OwnerRegistrationScreen from "../screens/auth/OwnerRegistrationScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

import HomeScreen from "./HomeScreen";
import OwnerDashboard from "./OwnerDashboard";
import TenantDashboard from "./TenantDashboard";

import IssuesScreen from "../screens/tenant/IssuesScreen";
import PaymentScreen from "../screens/tenant/PaymentScreen";
import ProfileScreen from "../screens/tenant/ProfileScreen";
import TenantHomeScreen from "../screens/tenant/TenantHomeScreen";

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    // <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />

      <Stack.Screen name="LoginScreen" component={LoginScreen} />

      <Stack.Screen name="OwnerLoginScreen" component={OwnerLoginScreen} />

      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />

      <Stack.Screen
        name="OwnerRegistrationScreen"
        component={OwnerRegistrationScreen}
      />

      <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />

      <Stack.Screen name="TenantDashboard" component={TenantDashboard} />

      <Stack.Screen name="TenantHomeScreen" component={TenantHomeScreen} />

      <Stack.Screen name="IssuesScreen" component={IssuesScreen} />

      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />

      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
    // </NavigationContainer>
  );
}
