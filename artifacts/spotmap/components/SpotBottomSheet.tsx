import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Spot } from "@/context/SpotContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = 310;

const SPOT_COLOR_MAP: Record<string, string> = {
  purple: Colors.spots.purple,
  orange: Colors.spots.orange,
  green: Colors.spots.green,
};

const TYPE_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  package: "package-variant-closed",
  tag: "tag",
  mystery: "help-circle",
};

const TYPE_LABEL: Record<string, string> = {
  package: "Package",
  tag: "Tag",
  mystery: "Mystery",
};

interface Props {
  spot: Spot | null;
  onClose: () => void;
  onCollect: (id: string) => void;
}

export function SpotBottomSheet({ spot, onClose, onCollect }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT + 100)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [collectAnim] = useState(new Animated.Value(1));
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    if (spot) {
      setCollected(spot.collected);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT + 100,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [spot]);

  const handleCollect = useCallback(() => {
    if (!spot || collected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(collectAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(collectAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    setCollected(true);
    onCollect(spot.id);
  }, [spot, collected, collectAnim, onCollect]);

  if (!spot) return null;

  const spotColor = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName = TYPE_ICON_MAP[spot.type] ?? "help-circle";
  const typeLabel = TYPE_LABEL[spot.type] ?? "Spot";
  const isAlreadyCollected = spot.collected || collected;

  return (
    <>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: spotColor + "22" }]}>
            <MaterialCommunityIcons name={iconName} size={28} color={spotColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.spotName} numberOfLines={1}>
              {spot.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: spotColor + "18" }]}>
              <Text style={[styles.typeLabel, { color: spotColor }]}>
                {typeLabel}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="close" size={20} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.description}>{spot.description}</Text>

        <Animated.View style={{ transform: [{ scale: collectAnim }] }}>
          <Pressable
            onPress={handleCollect}
            disabled={isAlreadyCollected}
            style={({ pressed }) => [
              styles.collectBtn,
              {
                backgroundColor: isAlreadyCollected ? Colors.light.border : spotColor,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isAlreadyCollected ? "check-circle" : "star-shooting"}
              size={20}
              color={isAlreadyCollected ? Colors.light.textSecondary : "#fff"}
            />
            <Text
              style={[
                styles.collectBtnText,
                { color: isAlreadyCollected ? Colors.light.textSecondary : "#fff" },
              ]}
            >
              {isAlreadyCollected ? "Collected!" : "Collect Spot"}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  spotName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 22,
    fontFamily: "Inter_400Regular",
  },
  collectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
  },
  collectBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
