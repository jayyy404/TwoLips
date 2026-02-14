import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { ANIMATION_ASSETS } from "../../config/constant";
import { COLORS } from "../../config/theme";

interface FullscreenAnimationProps {
  animationType: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FullscreenAnimation({
  animationType,
  onClose,
}: FullscreenAnimationProps) {
  const lottieRef = useRef<LottieView>(null);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    // Animate scale from 0.4 to 1.0 over 10 seconds
    scale.value = withTiming(1.0, {
      duration: 10000,
      easing: Easing.inOut(Easing.cubic),
    });

    // Auto-close after 10 seconds
    const timeout = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [onClose, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const assetSource =
    ANIMATION_ASSETS[animationType] ?? ANIMATION_ASSETS["flower"];

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#FFD1DC", "#B3E5FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.center}>
          <Animated.View style={[styles.lottieContainer, animatedStyle]}>
            <LottieView
              ref={lottieRef}
              source={assetSource}
              autoPlay
              loop
              style={styles.lottie}
            />
          </Animated.View>
        </View>

        <View style={styles.bottomText}>
          <Text style={styles.text}>Blooming for 10 seconds</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieContainer: {
    width: 320,
    height: 320,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  bottomText: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
  },
  text: {
    textAlign: "center",
    color: COLORS.text,
    fontSize: 14,
    letterSpacing: 1,
  },
});
