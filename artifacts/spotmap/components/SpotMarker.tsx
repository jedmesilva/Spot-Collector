import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import Colors from "@/constants/colors";
import { Spot } from "@/context/SpotContext";

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

interface SpotMarkerProps {
  spot: Spot;
  nearby: boolean;
  onPress: (spot: Spot) => void;
}

function SpotPinView({ spot, nearby }: Pick<SpotMarkerProps, "spot" | "nearby">) {
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName: keyof typeof MaterialCommunityIcons.glyphMap = spot.collected
    ? "check"
    : nearby
      ? (TYPE_ICON_MAP[spot.type] ?? "help-circle")
      : "lock";

  const ringColor = spot.collected ? "#B0B0BC" : nearby ? color : "#B0B0BC";
  const innerBg = spot.collected ? "#B0B0BC" : nearby ? color : "#B0B0BC";

  return (
    // collapsable={false} is required on Android to prevent view recycling that hides markers
    <View collapsable={false} style={styles.outer}>
      <View
        collapsable={false}
        style={[
          styles.ring,
          { borderColor: ringColor, opacity: spot.collected ? 0.5 : 1 },
        ]}
      >
        <View collapsable={false} style={[styles.inner, { backgroundColor: innerBg }]}>
          <MaterialCommunityIcons name={iconName} size={16} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

export function SpotMarker({ spot, nearby, onPress }: SpotMarkerProps) {
  if (Platform.OS === "web") return null;

  // tracksViewChanges must briefly be true so Android renders the custom view,
  // then we set it false for performance
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <SpotPinView spot={spot} nearby={nearby} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  ring: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  inner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
