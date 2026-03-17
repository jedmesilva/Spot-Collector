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

function accentColor(spot: Spot, nearby: boolean) {
  if (spot.collected) return "#BDBDBD";
  if (!nearby)        return "#9E9E9E";
  return SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
}

function markerIcon(spot: Spot, nearby: boolean): keyof typeof MaterialCommunityIcons.glyphMap {
  if (spot.collected) return "check";
  if (!nearby)        return "lock";
  return TYPE_ICON[spot.type] ?? "star";
}

// ─── Dimensions ──────────────────────────────────────────────────────────────
// HEAD  = diameter of the white outer circle (the pin "head")
// INNER = diameter of the coloured circle inside the head
// TIP_* = the downward-pointing triangle using the CSS border trick
// BUFFER= extra pixels below the tip so Android never clips it
const HEAD   = 46;
const INNER  = 34;
const TIP_W  = 18;
const TIP_H  = 14;
const BUFFER = 8;
// Total view height: HEAD + TIP_H + BUFFER (triangle overlaps head by 2 px)
const TOTAL_H = HEAD + TIP_H - 2 + BUFFER; // = 66

// anchor.y: tip of the triangle should sit on the coordinate.
// Tip y-position from top = HEAD + TIP_H - 2 = 58
const ANCHOR_Y = (HEAD + TIP_H - 2) / TOTAL_H; // ≈ 0.879

function PinView({ spot, nearby }: { spot: Spot; nearby: boolean }) {
  const color = accentColor(spot, nearby);
  const icon  = markerIcon(spot, nearby);

  return (
    <View collapsable={false} style={styles.container}>

      {/* ── White outer circle (the pin head) ── */}
      <View collapsable={false} style={styles.head}>
        {/* Coloured inner circle with the icon */}
        <View collapsable={false} style={[styles.inner, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={16} color="#fff" />
        </View>
      </View>

      {/* ── Downward triangle tip ─────────────────────────────────────────────
          Slightly overlaps the head (marginTop: -2) so there's no visible gap.
          The overlap is absorbed by the container, which is sized with BUFFER
          room at the bottom — no content exits the View bounds.            */}
      <View
        collapsable={false}
        style={[styles.tip, { borderTopColor: "#ffffff" }]}
      />
    </View>
  );
}

export function SpotMarker({ spot, nearby, onPress }: SpotMarkerProps) {
  if (Platform.OS === "web") return null;

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
      anchor={{ x: 0.5, y: ANCHOR_Y }}
    >
      <PinView spot={spot} nearby={nearby} />
    </Marker>
  );
}

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
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    // Shadow — baked into the marker bitmap on Android, no overflow
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tip: {
    marginTop: -2,      // overlap slightly with the head to hide the seam
    width: 0,
    height: 0,
    borderLeftWidth:  TIP_W / 2,
    borderRightWidth: TIP_W / 2,
    borderTopWidth:   TIP_H,
    borderLeftColor:  "transparent",
    borderRightColor: "transparent",
    // borderTopColor applied inline (always white — pin body colour)
  },
});
