import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
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

// Rosewood palette (from the design system)
const COLORS = {
  primary: "#BE185D",
  primaryBright: "#E11D48",
  secondary: "#4C0519",
  tertiary: "#FB7185",
  neutral: "#FFF1F2",
  bgDeep: "#1A0208",
  fieldBg: "#3A1220", // solid so browser autofill can't turn it white
  fieldBorder: "rgba(255, 241, 242, 0.14)",
  muted: "rgba(255, 241, 242, 0.55)",
  faint: "rgba(255, 241, 242, 0.35)",
  error: "#FDA4AF",
};

// Logo already contains the business name, so it is the only brand element.
const LOGO_SIZE = 220;

// Fixed-width form column so web and Android tablet render identically.
const FORM_WIDTH = 440;

// Chrome autofill paints inputs light blue/white; force it to match the field.
function useAutofillFix() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px ${COLORS.fieldBg} inset !important;
        -webkit-text-fill-color: ${COLORS.neutral} !important;
        caret-color: ${COLORS.neutral} !important;
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={[COLORS.secondary, "#2A030F", COLORS.bgDeep]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft radial-style glow (concentric circles work on web + Android) */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <View style={[styles.glow, { width: 1100, height: 1100, opacity: 0.05 }]} />
        <View style={[styles.glow, { width: 800, height: 800, opacity: 0.07 }]} />
        <View style={[styles.glow, { width: 520, height: 520, opacity: 0.1 }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Image
              source={logoLight}
              style={styles.logo}
              contentFit="contain"
            />

            <Text style={styles.portalTitle}>STAFF PORTAL LOGIN</Text>

            {/* Employee ID */}
            <Text style={styles.label}>EMPLOYEE ID</Text>
            <View style={styles.field}>
              <Image
                source={mailIcon}
                style={styles.icon}
                contentFit="contain"
                tintColor={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="DCY-000(sample)"
                placeholderTextColor={COLORS.faint}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="next"
              />
            </View>

            {/* PIN */}
            <View style={[styles.labelRow, { marginTop: 18 }]}>
              <Text style={styles.label}>PIN</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.forgot}>Forgot PIN?</Text>
              </Pressable>
            </View>
            <View style={styles.field}>
              <Image
                source={lockIcon}
                style={styles.icon}
                contentFit="contain"
                tintColor={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 5 pin number"
                placeholderTextColor={COLORS.faint}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                autoComplete="off"
                maxLength={5}
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPin((s) => !s)} hitSlop={10}>
                <Image
                  source={showPin ? eyeIcon : eyeOffIcon}
                  style={styles.icon}
                  contentFit="contain"
                  tintColor={COLORS.muted}
                />
              </Pressable>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            {/* Log in */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.buttonWrap,
                (pressed || loading) && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={[COLORS.primaryBright, COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.assist}>
              Need assistance? <Text style={styles.assistLink}>Contact Manager</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Text style={styles.footer}>
        © Darcy's Kitchen × Café. All rights reserved. Point of Sale System.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  flex: { flex: 1 },

  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: COLORS.tertiary,
  },

  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  form: { width: "100%", maxWidth: FORM_WIDTH },

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignSelf: "center",
    marginBottom: 20,
  },

  portalTitle: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 2,
    color: "#FDA4AF",
    textAlign: "center",
    marginBottom: 22,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontWeight: "600",
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.muted,
    marginBottom: 8,
  },
  forgot: {
    fontWeight: "500",
    fontSize: 11,
    color: COLORS.tertiary,
    marginBottom: 8,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.fieldBg,
    borderWidth: 1,
    borderColor: COLORS.fieldBorder,
  },
  icon: { width: 20, height: 20 },
  input: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.neutral,
    // removes the default focus outline on web
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : null),
  },

  error: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.error,
  },

  buttonWrap: {
    marginTop: 26,
    borderRadius: 14,
    shadowColor: COLORS.primaryBright,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontWeight: "700", fontSize: 14, color: "#fff" },

  assist: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.faint,
  },
  assistLink: { color: "#FDA4AF", fontWeight: "700" },

  footer: {
    textAlign: "center",
    fontSize: 10,
    color: COLORS.faint,
    paddingBottom: 18,
    paddingTop: 6,
  },
});