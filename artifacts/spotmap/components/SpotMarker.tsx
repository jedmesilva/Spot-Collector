import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path } from "react-native-svg";

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

// ─── Pin geometry ─────────────────────────────────────────────────────────────
// Google Maps "place" pin path — tip at (12, 22) in original SVG coords.
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

// ViewBox "3 0 18 28":
//   • Horizontal:  3 → 21  (pin x: 5–19, 2-unit side padding)
//   • Vertical:    0 → 28  (pin y: 2–22, 2-unit top + 6-unit BOTTOM padding)
//
// Rendered at 36 × 56 px  →  uniform 2× scale.
//
//   Pin tip in pixels:  (22 / 28) × 56  =  44 px from top
//   6-unit bottom buffer → 12 px gap     →  clipping-safe on Android
//
//   Head centre:  ((12-3)/18)×36 = 18 px,  (9/28)×56 = 18 px
//
//   anchor.y = 44 / 56 ≈ 0.786  → tip of pin sits exactly on the coordinate.
const SVG_W = 36;
const SVG_H = 56;
const VB = "3 0 18 28";
const ICON_CX = 18;  // head centre x in screen pixels
const ICON_CY = 18;  // head centre y in screen pixels
const TIP_PX = 44;   // tip y position in screen pixels

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
  const iconSize = 14;

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={tracks}
      // anchor.y = TIP_PX / SVG_H → pin tip touches the coordinate exactly
      anchor={{ x: 0.5, y: TIP_PX / SVG_H }}
    >
      {/* collapsable=false: required on Android to prevent View recycler hiding marker.
          Width × Height matches the SVG exactly — no content exits these bounds. */}
      <View
        collapsable={false}
        style={{ width: SVG_W, height: SVG_H }}
      >
        <Svg
          width={SVG_W}
          height={SVG_H}
          viewBox={VB}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Shadow — shifted 0.4 right, 0.8 down in viewBox units (1.6 px down).
              Shadow tip at y ≈ 22.8 → pixel ≈ 45.6 — well within the 56 px View. */}
          <Path
            d={PIN_PATH}
            fill="rgba(0,0,0,0.22)"
            transform="translate(0.4, 0.8)"
          />
          {/* White border (slightly thicker stroke painted before the colour fill) */}
          <Path
            d={PIN_PATH}
            fill="white"
            stroke="white"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {/* Coloured fill */}
          <Path d={PIN_PATH} fill={fill} />
        </Svg>

        {/* Icon centred over the head — fully within the View bounds */}
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color="#fff"
          style={{
            position: "absolute",
            top: ICON_CY - iconSize / 2,
            left: ICON_CX - iconSize / 2,
          }}
        />
      </View>
    </Marker>
  );
}
