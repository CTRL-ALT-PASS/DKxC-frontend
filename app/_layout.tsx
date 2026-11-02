import { CartProvider } from "@/context/CartContext";
import "@/global.css";
import { AuthProvider, useAuth } from "../context/AuthContext";

import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Wait until session restoration finishes.
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#BE185D" />
        <Text className="mt-4 text-slate-600">Restoring session...</Text>
      </View>
    );
  }

  const isManager = user?.role.toLowerCase() === "manager";
  const isAuthenticated = user !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only unauthenticated users can access login. */}
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      {/* Managers can access inventory routes. */}
      <Stack.Protected guard={isAuthenticated && isManager}>
        <Stack.Screen name="(inventory)" />
      </Stack.Protected>

      {/* Other authenticated employees can access POS routes. */}
      <Stack.Protected guard={isAuthenticated && !isManager}>
        <Stack.Screen name="(pos)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}