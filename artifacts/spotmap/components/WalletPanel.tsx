import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Spot, useSpots } from "@/context/SpotContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

interface Props {
  visible: boolean;
  onClose: () => void;
}

function CollectedItem({ spot }: { spot: Spot }) {
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName = TYPE_ICON_MAP[spot.type] ?? "help-circle";

  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={iconName} size={22} color={color} />
      </View>
      <View style={styles.itemText}>
        <Text style={styles.itemName} numberOfLines={1}>
          {spot.name}
        </Text>
        <Text style={styles.itemType}>{spot.type}</Text>
      </View>
      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.accentGreen} />
    </View>
  );
}

export function WalletPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { spots, collectedCount } = useSpots();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const collectedSpots = spots.filter((s) => s.collected);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 250,
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
          toValue: SCREEN_HEIGHT,
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
  }, [visible]);

  return (
    <>
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <View style={styles.handle} />

        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>My Wallet</Text>
            <Text style={styles.panelSubtitle}>
              {collectedCount} spot{collectedCount !== 1 ? "s" : ""} collected
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="close" size={22} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        {collectedSpots.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={60}
              color={Colors.light.border}
            />
            <Text style={styles.emptyTitle}>No spots yet</Text>
            <Text style={styles.emptySubtitle}>
              Explore the map and collect spots to fill your wallet!
            </Text>
          </View>
        ) : (
          <FlatList
            data={collectedSpots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CollectedItem spot={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 20,
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 21,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 30,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  panelSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 3,
    fontFamily: "Inter_400Regular",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
  },
  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  itemType: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
    fontFamily: "Inter_400Regular",
  },
});
