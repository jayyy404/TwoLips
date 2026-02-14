import { Alert, Platform } from "react-native";
export function showToast(title: string, message: string): void {
  if (Platform.OS === "web") {
    // window.alert works in all browsers & PWA shells
    window.alert(title ? `${title}\n${message}` : message);
  } else {
    Alert.alert(title, message);
  }
}
