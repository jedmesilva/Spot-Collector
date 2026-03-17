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
// Google Maps / Material Design "place" pin, original coords: x 5-19, y 2-22.
// We use viewBox "3 0 18 24" — 2-unit padding on all sides so stroke + shadow
// never overflow the SVG canvas (which would be clipped by the Android View).
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

// viewBox "3 0 18 24" rendered at 36×48 → uniform scale = 2×
// Head center: ((12-3)/18)*36 = 18 px,  ((9-0)/24)*48 = 18 px
const SVG_W = 36;
const SVG_H = 48;
const VB = "3 0 18 24";
const ICON_CX = 18; // px from left of SVG
const ICON_CY = 18; // px from top  of SVG

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
      anchor={{ x: 0.5, y: 1.0 }}
    >
      {/*
        Single View — collapsable=false prevents Android recycler from hiding it.
        EXACTLY SVG_W × SVG_H so nothing overflows (Android clips overflow by default).
      */}
      <View collapsable={false} style={{ width: SVG_W, height: SVG_H }}>

        {/* All pin layers in ONE SVG — no overflow, no clipping surprises */}
        <Svg
          width={SVG_W}
          height={SVG_H}
          viewBox={VB}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Drop shadow: same path shifted 0.4 right / 1 down (stays inside viewBox) */}
          <Path
            d={PIN_PATH}
            fill="rgba(0,0,0,0.22)"
            transform="translate(0.4, 1)"
          />
          {/* White border: thick white stroke + white fill */}
          <Path
            d={PIN_PATH}
            fill="white"
            stroke="white"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          {/* Coloured fill on top */}
          <Path d={PIN_PATH} fill={fill} />
        </Svg>

        {/* Icon absolutely centred over the circular head, WITHIN the View bounds */}
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
