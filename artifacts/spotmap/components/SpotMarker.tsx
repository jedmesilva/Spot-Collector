import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Circle, Path } from "react-native-svg";

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

// Exact Google Maps / Material Design "place" pin path
// Original viewBox "0 0 24 24", pin occupies x:5-19, y:2-22
// We use viewBox "4 1 16 22" to crop tightly, rendered at 36×50
const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

// Circle head center in the original coordinate space → (12, 9), radius ≈ 7
// In our viewBox "4 1 16 22" rendered at 36×50:
//   x: (12-4)/16 * 36 = 18,  y: (9-1)/22 * 50 ≈ 18
//   radius: 7/16 * 36 ≈ 15.75
const ICON_CX = 18;
const ICON_CY = 18;
const SVG_W = 36;
const SVG_H = 50;
const VIEWBOX = "4 1 16 22";

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

  const fill  = spotFill(spot, nearby);
  const icon  = spotIcon(spot, nearby);
  const iconSize = 14;

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1.0 }}
    >
      {/* Single View with collapsable=false prevents Android from hiding custom markers */}
      <View
        collapsable={false}
        style={{ width: SVG_W, height: SVG_H }}
      >
        {/* Pin SVG — shadow layer */}
        <Svg
          width={SVG_W}
          height={SVG_H}
          viewBox={VIEWBOX}
          style={{ position: "absolute", top: 2, left: 1 }}
        >
          <Path d={PIN_PATH} fill="rgba(0,0,0,0.22)" />
        </Svg>

        {/* Pin SVG — white border */}
        <Svg
          width={SVG_W + 4}
          height={SVG_H + 4}
          viewBox="3.2 0.2 17.6 23.6"
          style={{ position: "absolute", top: -2, left: -2 }}
        >
          <Path d={PIN_PATH} fill="white" />
        </Svg>

        {/* Pin SVG — coloured fill */}
        <Svg
          width={SVG_W}
          height={SVG_H}
          viewBox={VIEWBOX}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Path d={PIN_PATH} fill={fill} />
          {/* Small translucent inner circle for depth */}
          <Circle cx={12} cy={9} r={2.8} fill="rgba(255,255,255,0.3)" />
        </Svg>

        {/* Icon centred over the circular head */}
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
