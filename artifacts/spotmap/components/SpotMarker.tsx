import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import Colors from "@/constants/colors";
import { Spot } from "@/context/SpotContext";

const SPOT_COLOR_MAP: Record<string, string> = {
  purple: Colors.spots.purple,
  orange: Colors.spots.orange,
  green:  Colors.spots.green,
};

const TYPE_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  coupon:  "ticket-percent",
  product: "gift",
  cash:    "cash",
  mystery: "help-circle",
  package: "package-variant-closed",
  tag:     "tag",
};

interface SpotMarkerProps {
  spot: Spot;
  nearby: boolean;
  onPress: (spot: Spot) => void;
}

function pinColor(spot: Spot, nearby: boolean) {
  if (spot.collected) return "#BDBDBD";
  if (!nearby)        return "#9E9E9E";
  return SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
}

function pinIcon(spot: Spot, nearby: boolean): keyof typeof MaterialCommunityIcons.glyphMap {
  if (spot.collected) return "check-circle";
  if (!nearby)        return "lock";
  return TYPE_ICON[spot.type] ?? "star";
}

// ─── Pin view (no SVG — pure React Native Views) ────────────────────────────
// Layout:  [circle head 40×40]
//          [triangle tip 14×10]
// Total container: 40 wide × 56 tall.
// anchor={{ x:0.5, y: 50/56 }} → tip of triangle sits on the coordinate.
// All content is within [0,0]–[40,56], no overflow possible.
function PinView({ spot, nearby }: { spot: Spot; nearby: boolean }) {
  const color = pinColor(spot, nearby);
  const icon  = pinIcon(spot, nearby);

  return (
    <View collapsable={false} style={styles.container}>
      {/* Circle head */}
      <View collapsable={false} style={[styles.head, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>

      {/* Triangle tip — drawn with border trick, no SVG needed */}
      <View
        collapsable={false}
        style={[
          styles.tip,
          {
            borderTopColor: color,
          },
        ]}
      />
    </View>
  );
}

export function SpotMarker({ spot, nearby, onPress }: SpotMarkerProps) {
  if (Platform.OS === "web") return null;

  // Start tracking view changes so Android renders the icon font,
  // then stop after 1 s for performance.
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 50 / 56 }}
    >
      <PinView spot={spot} nearby={nearby} />
    </Marker>
  );
}

const HEAD = 40;
const TIP_W = 14;
const TIP_H = 10;
const TOTAL_H = HEAD + TIP_H + 6; // 56 — 6 px bottom buffer so Android never clips

const styles = StyleSheet.create({
  container: {
    width: HEAD,
    height: TOTAL_H,
    alignItems: "center",
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    alignItems: "center",
    justifyContent: "center",
    // Elevation on Android (rendered into the bitmap snapshot, no overflow issue)
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: TIP_W / 2,
    borderRightWidth: TIP_W / 2,
    borderTopWidth: TIP_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    // borderTopColor set inline with the spot colour
  },
});
