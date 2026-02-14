import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../config/theme";

interface CameraButtonProps {
  isSending: boolean;
  onPress: () => void;
}

export default function CameraButton({
  isSending,
  onPress,
}: CameraButtonProps) {
  // Pulse glow animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring */}
      <Animated.View
        style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]}
      />
      <TouchableOpacity
        onPress={onPress}
        disabled={isSending}
        activeOpacity={0.85}
        style={styles.touchable}
      >
        <LinearGradient
          colors={["#FFD1DC", "#B3E5FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {isSending ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Ionicons name="camera" size={26} color={COLORS.white} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const BUTTON_SIZE = 66;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
  },
  glowRing: {
    position: "absolute",
    width: BUTTON_SIZE + 16,
    height: BUTTON_SIZE + 16,
    borderRadius: (BUTTON_SIZE + 16) / 2,
    backgroundColor: "rgba(255, 209, 220, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 209, 220, 0.4)",
  },
  touchable: {
    borderRadius: BUTTON_SIZE / 2,
    shadowColor: COLORS.pinkGlow,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
});
