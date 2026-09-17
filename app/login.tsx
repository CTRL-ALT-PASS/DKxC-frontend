import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { cssInterop } from "nativewind";
import { useState } from "react";
import { Text, View } from "react-native";
import eyeOffIcon from "../assets/icons/eye-off.png";
import eyeIcon from "../assets/icons/eye.png";
import lockIcon from "../assets/icons/lock.png";
import mailIcon from "../assets/icons/mail.png";
import logoLight from "../assets/images/darcys-logo-light.png";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { ADMIN_USER, CURRENT_USER } from "../constants/mockData";

cssInterop(LinearGradient, { className: "style" });

export default function LoginScreen() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (employeeId === CURRENT_USER.employeeId && pin === CURRENT_USER.pin) {
      router.replace("/(pos)/menu");
    } else if (employeeId === ADMIN_USER.employeeId && pin === ADMIN_USER.pin) {
      router.replace("/(inventory)/dashboard")
    } else {
      setError("Invalid employee ID or PIN");
    }
  };

  return (
    <LinearGradient colors={["#2F5A3F", "#14291C"]} className="flex-1 items-center justify-center px-6">
      <Image source={logoLight} style={{ width: 140, height: 140, marginBottom: 32 }} contentFit="contain" />
      <View className="bg-slate-100 rounded-2xl p-6 w-full max-w-sm">
        <Text className="text-center text-lg font-bold mb-4">LOGIN</Text>

        <Text className="text-xs text-slate-500 mb-1">Employee ID</Text>
        <TextField
          icon={mailIcon}
          placeholder="DCY-000(sample)"
          value={employeeId}
          onChangeText={setEmployeeId}
          autoCapitalize="characters"
        />

        <Text className="text-xs text-slate-500 mt-4 mb-1">Pin</Text>
        <TextField
          icon={lockIcon}
          rightIcon={showPin ? eyeIcon : eyeOffIcon}
          onRightIconPress={() => setShowPin((s) => !s)}
          placeholder="Enter 5 pin number"
          value={pin}
          onChangeText={setPin}
          secureTextEntry={!showPin}
          keyboardType="number-pad"
          maxLength={5}
        />

        {!!error && <Text className="text-warn text-xs mt-2">{error}</Text>}
        <Button label="Log In" onPress={handleLogin} className="mt-6" />
      </View>
    </LinearGradient>
  );
}
