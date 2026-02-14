import React from "react";
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AVAILABLE_ANIMATIONS } from "../../config/constant";
import { COLORS, SPACING } from "../../config/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const DOCK_W = SCREEN_W * 0.88;

interface FlowerSelectorProps {
  selectedAnimation: string;
  onSelect: (name: string) => void;
}

export default function FlowerSelector({
  selectedAnimation,
  onSelect,
}: FlowerSelectorProps) {
  return (
    <View style={styles.dock}>
      <FlatList
        data={
          AVAILABLE_ANIMATIONS as unknown as (typeof AVAILABLE_ANIMATIONS)[number][]
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          const isSelected = selectedAnimation === item.name;
          return (
            <TouchableOpacity
              style={styles.itemWrapper}
              onPress={() => onSelect(item.name)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.circle, isSelected && styles.circleSelected]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    width: DOCK_W,
    height: 70,
    borderRadius: 50,
    backgroundColor: COLORS.glassSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignSelf: "center",
    justifyContent: "center",
    shadowColor: COLORS.glassShadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  itemWrapper: {
    alignItems: "center",
    marginHorizontal: SPACING.sm,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  circleSelected: {
    backgroundColor: "rgba(255, 209, 220, 0.55)",
    borderColor: COLORS.primaryPink,
    shadowColor: COLORS.pinkGlow,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    transform: [{ scale: 1.1 }],
  },
  emoji: {
    fontSize: 24,
  },
});
