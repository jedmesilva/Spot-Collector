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
import { Spot, useSpots } from "@/context/SpotContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = 360;

const SPOT_COLOR_MAP: Record<string, string> = {
  purple: Colors.spots.purple,
  orange: Colors.spots.orange,
  green: Colors.spots.green,
};

const TYPE_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  coupon: "ticket-percent",
  product: "gift",
  cash: "cash",
  mystery: "help-circle",
  package: "package-variant-closed",
  tag: "tag",
};

const TYPE_LABEL: Record<string, string> = {
  coupon: "Cupom",
  product: "Produto",
  cash: "Dinheiro",
  mystery: "Mistério",
  package: "Pacote",
  tag: "Tag",
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface Props {
  spot: Spot | null;
  onClose: () => void;
  onCollect: (id: string) => void;
}

export function SpotBottomSheet({ spot, onClose, onCollect }: Props) {
  const insets = useSafeAreaInsets();
  const { isNearby, distanceTo } = useSpots();
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
  const nearby = isNearby(spot);
  const distance = distanceTo(spot);
  const canCollect = nearby && !isAlreadyCollected;

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

        {/* Reward box */}
        <View style={[styles.rewardBox, { borderColor: spotColor + "40", backgroundColor: spotColor + "0A" }]}>
          <MaterialCommunityIcons
            name={spot.type === "mystery" && !isAlreadyCollected ? "lock" : "gift-outline"}
            size={18}
            color={spotColor}
          />
          <Text style={[styles.rewardText, { color: spotColor }]}>
            {spot.type === "mystery" && !isAlreadyCollected
              ? "Recompensa misteriosa"
              : spot.reward}
          </Text>
        </View>

        {/* Distance / proximity status */}
        {!isAlreadyCollected && (
          <View style={[
            styles.distanceRow,
            { backgroundColor: nearby ? Colors.accentGreen + "12" : "#FFF3E0" }
          ]}>
            <MaterialCommunityIcons
              name={nearby ? "map-marker-check" : "map-marker-distance"}
              size={18}
              color={nearby ? Colors.accentGreen : "#F57C00"}
            />
            <Text style={[styles.distanceText, { color: nearby ? Colors.accentGreen : "#F57C00" }]}>
              {nearby
                ? "Você está na área! Pode coletar."
                : distance !== null
                  ? `Ainda ${formatDistance(distance)} de distância`
                  : "Localização necessária para coletar"}
            </Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: collectAnim }] }}>
          <Pressable
            onPress={canCollect ? handleCollect : () => {
              if (!isAlreadyCollected) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }}
            style={({ pressed }) => [
              styles.collectBtn,
              {
                backgroundColor: isAlreadyCollected
                  ? Colors.light.border
                  : canCollect
                    ? spotColor
                    : "#E0E0E0",
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                isAlreadyCollected
                  ? "check-circle"
                  : canCollect
                    ? "star-shooting"
                    : "lock-outline"
              }
              size={20}
              color={isAlreadyCollected ? Colors.light.textSecondary : canCollect ? "#fff" : "#9E9E9E"}
            />
            <Text
              style={[
                styles.collectBtnText,
                {
                  color: isAlreadyCollected
                    ? Colors.light.textSecondary
                    : canCollect
                      ? "#fff"
                      : "#9E9E9E",
                },
              ]}
            >
              {isAlreadyCollected
                ? "Coletado!"
                : canCollect
                  ? "Coletar Spot"
                  : "Chegue ao local para coletar"}
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
    marginBottom: 14,
    fontFamily: "Inter_400Regular",
  },
  rewardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  rewardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  distanceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
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
