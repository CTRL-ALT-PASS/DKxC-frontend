import { Alert, Platform } from "react-native";

import { ApiError } from "@/services/apiClient";

export function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function confirm(
  title: string,
  message: string,
  confirmLabel = "OK",
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

/** Turns an ApiError (including 422 field errors) into a readable message. */
export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    const fieldMessages = e.errors ? Object.values(e.errors).flat() : [];
    return fieldMessages.length ? fieldMessages.join("\n") : e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}
