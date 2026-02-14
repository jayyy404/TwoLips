import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONT_SIZES } from "../../config/theme";

interface SnapViewerProps {
  imageUrl: string | null;
  currentIndex: number;
  totalSnaps: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SnapViewer({
  imageUrl,
  currentIndex,
  totalSnaps,
  onClose,
}: SnapViewerProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

      {/* Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.errorText}>Image not available</Text>
        </View>
      )}

      {/* Snap counter */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {currentIndex + 1}/{totalSnaps}
        </Text>
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={30} color={COLORS.white} />
      </TouchableOpacity>

      {/* Bottom text */}
      <View style={styles.bottomText}>
        <Text style={styles.infoText}>Snap disappears after viewing</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
  },
  counterBadge: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  counterText: {
    color: COLORS.black,
    fontWeight: "bold",
    fontSize: FONT_SIZES.md,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 16,
    padding: 4,
  },
  bottomText: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
  },
  infoText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: FONT_SIZES.md,
  },
  errorText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FONT_SIZES.lg,
  },
});
