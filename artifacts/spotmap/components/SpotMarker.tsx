import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
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

function SpotPinView({ spot, nearby }: SpotMarkerProps) {
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName: keyof typeof MaterialCommunityIcons.glyphMap = spot.collected
    ? "check"
    : nearby
      ? (TYPE_ICON_MAP[spot.type] ?? "help-circle")
      : "lock";

  const borderColor = spot.collected ? "#C0C0C8" : nearby ? color : "#C0C0C8";
  const innerBg = spot.collected ? "#C0C0C8" : nearby ? color : "#C0C0C8";

  return (
    <View style={[styles.outer, { borderColor, opacity: spot.collected ? 0.45 : 1 }]}>
      <View style={[styles.inner, { backgroundColor: innerBg }]}>
        <MaterialCommunityIcons name={iconName} size={16} color="#FFFFFF" />
      </View>
    </View>
  );
}

export const SpotMarker = React.memo(function SpotMarker(props: SpotMarkerProps) {
  if (Platform.OS === "web") return null;

  return (
    <Marker
      coordinate={{ latitude: props.spot.latitude, longitude: props.spot.longitude }}
      onPress={() => props.onPress(props.spot)}
      tracksViewChanges={false}
    >
      <SpotPinView {...props} />
    </Marker>
  );
});

const styles = StyleSheet.create({
  outer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  inner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
