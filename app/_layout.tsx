import { CartProvider } from "@/context/CartContext";
import "@/global.css";
import { AuthProvider, useAuth } from "../context/AuthContext";

import { Stack } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

function RootNavigator() {
  const { user, isLoading, sessionError, retrySessionRestore } = useAuth();

  // Wait until session restoration finishes.
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2F5A3F" />
        <Text className="mt-4 text-slate-600">Restoring session...</Text>
      </View>
    );
  }

  // Don't mistake a network failure for an invalid token.
  if (sessionError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-2 text-center text-xl font-bold text-slate-800">
          Unable to restore session
        </Text>

        <Text className="mb-6 text-center text-slate-500">
          Check your connection and confirm that the server is running.
        </Text>

        <Pressable
          onPress={() => void retrySessionRestore()}
          className="rounded-xl bg-darcy px-6 py-3"
        >
          <Text className="font-semibold text-white">Try Again</Text>
        </Pressable>
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
