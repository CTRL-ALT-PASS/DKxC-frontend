import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import "@/global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(pos)" />
          <Stack.Screen name="(inventory)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
