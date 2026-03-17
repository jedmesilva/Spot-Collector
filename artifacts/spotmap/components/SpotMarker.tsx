import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { G, Path } from "react-native-svg";

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

// ─── Pin geometry ──────────────────────────────────────────────────────────────
const W = 40;          // total SVG width
const H = 54;          // total SVG height
const CX = W / 2;      // 20 — pin horizontal center
const R = 16;          // radius of the circular head
const HEAD_CY = R + 1; // 17 — y-center of the head circle

// Outer teardrop (white border + shadow base)
function pinPath(cx: number, headCy: number, r: number, tipY: number) {
  return (
    `M ${cx} ${headCy - r} ` +
    `A ${r} ${r} 0 1 1 ${cx - 0.001} ${headCy - r} ` +
    `Q ${cx + r * 1.1} ${headCy + r * 0.9} ${cx} ${tipY} ` +
    `Q ${cx - r * 1.1} ${headCy + r * 0.9} ${cx} ${headCy - r} Z`
  );
}

const BORDER_PATH = pinPath(CX, HEAD_CY, R + 2, H - 2);      // white border
const FILL_PATH   = pinPath(CX, HEAD_CY, R,     H - 5);      // coloured fill
const SHADOW_PATH = pinPath(CX, HEAD_CY, R + 2, H - 2);      // drop shadow

function spotFill(spot: Spot, nearby: boolean) {
  if (spot.collected) return "#BDBDBD";
  if (!nearby) return "#9E9E9E";
  return SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
}

function spotIcon(spot: Spot, nearby: boolean): keyof typeof MaterialCommunityIcons.glyphMap {
  if (spot.collected) return "check";
  if (!nearby) return "lock";
  return TYPE_ICON_MAP[spot.type] ?? "star";
}

export function SpotMarker({ spot, nearby, onPress }: SpotMarkerProps) {
  if (Platform.OS === "web") return null;

  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(t);
  }, []);

  const fill = spotFill(spot, nearby);
  const icon = spotIcon(spot, nearby);

  // Icon position: centred in the circular head of the pin
  const iconSize = 15;
  const iconTop  = HEAD_CY - iconSize / 2;
  const iconLeft = CX - iconSize / 2;

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1.0 }}
    >
      {/* collapsable=false prevents Android from recycling this View and hiding the marker */}
      <View collapsable={false} style={{ width: W, height: H }}>
        {/* SVG pin shape */}
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Drop shadow */}
          <G transform="translate(1.5, 3)">
            <Path d={SHADOW_PATH} fill="rgba(0,0,0,0.20)" />
          </G>
          {/* White border */}
          <Path d={BORDER_PATH} fill="white" />
          {/* Coloured fill */}
          <Path d={FILL_PATH} fill={fill} />
        </Svg>

        {/* Icon layer — absolutely positioned over the circle head */}
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color="#fff"
          style={{ position: "absolute", top: iconTop, left: iconLeft }}
        />
      </View>
    </Marker>
  );
}
