import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface LogoutConfirmationProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function LogoutConfirmation({
  visible,
  onCancel,
  onConfirm,
}: LogoutConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await onConfirm();
      onCancel();
    } catch {
      setError("Unable to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setError("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View className="flex-1 items-center justify-center px-6">
        {/* Darkened backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={handleCancel}
          disabled={loading}
          accessibilityLabel="Close logout confirmation"
        />

        {/* Centered dialog */}
        <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          {/* Icon */}
          <View className="mb-4 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <LogOut size={30} color="#2F5A3F" strokeWidth={2.2} />
            </View>
          </View>

          {/* Heading and description */}
          <Text className="mb-2 text-center text-2xl font-bold text-slate-800">
            Log out?
          </Text>

          <Text className="mb-6 text-center text-sm leading-6 text-slate-500">
            Are you sure you want to end your session?
          </Text>

          {/* Error message */}
          {!!error && (
            <Text
              accessibilityRole="alert"
              className="mb-4 text-center text-sm text-red-600"
            >
              {error}
            </Text>
          )}

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCancel}
              disabled={loading}
              className="h-12 flex-1 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
              accessibilityRole="button"
            >
              <Text className="font-semibold text-slate-700">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              className={`h-12 flex-1 items-center justify-center rounded-xl ${
                loading ? "bg-green-900/60" : "bg-darcy"
              }`}
              accessibilityRole="button"
            >
              <Text className="font-semibold text-white">
                {loading ? "Logging out..." : "Log out"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
