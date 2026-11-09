import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import eyeOffIcon from "../assets/icons/eye-off.png";
import eyeIcon from "../assets/icons/eye.png";
import lockIcon from "../assets/icons/lock.png";
import mailIcon from "../assets/icons/mail.png";
import logoLight from "../assets/images/darcys-logo-light.png";
import { useAuth } from "../context/AuthContext";

cssInterop(LinearGradient, { className: "style" });

// Props like gradient `colors`, `tintColor` and `placeholderTextColor` can't
// take Tailwind classes, so they mirror tailwind.config.js. Keep in sync.
const HEX = {
  primary: "#BE185D", // primary
  primaryBright: "#E11D48", // primary-bright
  secondary: "#4C0519", // secondary
  canvas: "#1A0208", // canvas
  canvasMid: "#2A030F", // canvas-mid
  field: "#3A1220", // field
  neutral: "#FFF1F2", // neutral
  neutralMuted: "rgba(255, 241, 242, 0.55)", // neutral/55
  neutralFaint: "rgba(255, 241, 242, 0.35)", // neutral/35
};

// Chrome autofill paints inputs light blue/white; force it to match the field.
function useAutofillFix() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px ${HEX.field} inset !important;
        -webkit-text-fill-color: ${HEX.neutral} !important;
        caret-color: ${HEX.neutral} !important;
        transition: background-color 9999s ease-in-out 0s;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

export default function LoginScreen() {
  useAutofillFix();

  const router = useRouter();
  const { signIn } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    setError("");

    if (!employeeId.trim() || !pin) {
      setError("Please enter your employee ID and PIN.");
      return;
    }

    setLoading(true);

    try {
      const employee = await signIn(employeeId, pin);

      if (employee.role.toLowerCase() === "manager") {
        router.replace("/(inventory)/dashboard");
      } else {
        router.replace("/(pos)/menu");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={[HEX.secondary, HEX.canvasMid, HEX.canvas]}
        locations={[0, 0.55, 1]}
        className="absolute inset-0"
      />
      {/* Soft glow (concentric circles work on web + Android) */}
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <View className="absolute w-[1100px] h-[1100px] rounded-full bg-tertiary opacity-5" />
        <View className="absolute w-[800px] h-[800px] rounded-full bg-tertiary opacity-[0.07]" />
        <View className="absolute w-[520px] h-[520px] rounded-full bg-tertiary opacity-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-md">
            {/* Logo already contains the business name */}
            <Image
              source={logoLight}
              style={{ width: 220, height: 220, alignSelf: "center" }}
              contentFit="contain"
            />

            <Text className="mt-5 mb-6 text-center text-[11px] font-bold tracking-[2px] text-tertiary-soft">
              STAFF PORTAL LOGIN
            </Text>

            {/* Employee ID */}
            <Text className="mb-2 text-[10px] font-semibold tracking-[1px] text-neutral/55">
              EMPLOYEE ID
            </Text>
            <View className="flex-row items-center gap-3 h-[52px] px-4 rounded-2xl bg-field border border-neutral/15">
              <Image
                source={mailIcon}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor={HEX.neutralMuted}
              />
              <TextInput
                className="flex-1 h-full bg-transparent text-sm font-semibold text-neutral outline-none"
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="DCY-000(sample)"
                placeholderTextColor={HEX.neutralFaint}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="next"
              />
            </View>

            {/* PIN */}
            <View className="mt-[18px] flex-row items-center justify-between">
              <Text className="mb-2 text-[10px] font-semibold tracking-[1px] text-neutral/55">
                PIN
              </Text>
              <Pressable hitSlop={8}>
                <Text className="mb-2 text-[11px] font-medium text-tertiary">
                  Forgot PIN?
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center gap-3 h-[52px] px-4 rounded-2xl bg-field border border-neutral/15">
              <Image
                source={lockIcon}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor={HEX.neutralMuted}
              />
              <TextInput
                className="flex-1 h-full bg-transparent text-sm font-semibold text-neutral outline-none"
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 5 pin number"
                placeholderTextColor={HEX.neutralFaint}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                autoComplete="off"
                maxLength={5}
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPin((s) => !s)} hitSlop={10}>
                <Image
                  source={showPin ? eyeIcon : eyeOffIcon}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  tintColor={HEX.neutralMuted}
                />
              </Pressable>
            </View>

            {!!error && (
              <Text className="mt-2.5 text-xs text-tertiary-soft">{error}</Text>
            )}

            {/* Log in */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`mt-6 rounded-2xl shadow-lg shadow-primary-bright/40 ${
                loading ? "opacity-70" : "active:opacity-80"
              }`}
            >
              <LinearGradient
                colors={[HEX.primaryBright, HEX.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-[52px] rounded-2xl items-center justify-center"
              >
                <Text className="text-sm font-bold text-white">
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Text className="mt-5 text-center text-[11px] text-neutral/35">
              Need assistance?{" "}
              <Text className="font-bold text-tertiary-soft">Contact Manager</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Text className="pt-1.5 pb-[18px] text-center text-[10px] text-neutral/35">
        © Darcy's Kitchen × Café. All rights reserved. Point of Sale System.
      </Text>
    </View>
  );
}
