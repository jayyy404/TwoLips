import LottieView from "lottie-react-native";
import React, { RefObject, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ANIMATION_ASSETS } from "../../config/constant";
import { BORDER_RADIUS, COLORS, FONT_SIZES } from "../../config/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
// Derive from height so everything fits in one viewport (iPhone 16 Safari = ~660px)
const CARD_H = Math.min(SCREEN_H * 0.5, SCREEN_W * 0.8 * (4 / 3));
const CARD_W = CARD_H * (3 / 4);

interface SnapCardProps {
  currentSnapImage: string | null;
  hasSnaps: boolean;
  currentSnapIndex: number;
  totalSnaps: number;
  isSendingPoke: boolean;
  selectedAnimation: string;
  lottieRef: RefObject<LottieView | null>;
  onTap: () => void;
}

export default function SnapCard({
  currentSnapImage,
  hasSnaps,
  currentSnapIndex,
  totalSnaps,
  isSendingPoke,
  selectedAnimation,
  lottieRef,
  onTap,
}: SnapCardProps) {
  const animationSource =
    ANIMATION_ASSETS[selectedAnimation] ?? ANIMATION_ASSETS["flower"];

  // Gentle floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onTap}
        activeOpacity={0.92}
        disabled={isSendingPoke && !hasSnaps}
      >
        {/* Glass border glow */}
        <View style={styles.glassInner}>
          {/* Show snap image or Lottie animation */}
          {currentSnapImage ? (
            <Image
              source={{ uri: currentSnapImage }}
              style={styles.snapImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.lottieContainer}>
              <LottieView
                ref={lottieRef}
                source={animationSource}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>
          )}

          {/* Loading overlay */}
          {isSendingPoke && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={COLORS.white} size="large" />
            </View>
          )}

          {/* Snap counter badge */}
          {hasSnaps && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {currentSnapIndex + 1}/{totalSnaps}
              </Text>
            </View>
          )}

          {/* Tap instruction */}
          {hasSnaps && (
            <View style={styles.instructionContainer}>
              <View style={styles.instructionBadge}>
                <Text style={styles.instructionText}>
                  Tap to view • Swipe to navigate
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.glassSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.glassShadow,
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: "hidden",
  },
  glassInner: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
  },
  snapImage: {
    width: "100%",
    height: "100%",
  },
  lottieContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  counterBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  counterText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: FONT_SIZES.sm,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  instructionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  instructionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
