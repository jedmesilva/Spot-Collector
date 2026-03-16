import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import Colors from "@/constants/colors";
import { Spot } from "@/context/SpotContext";

const SPOT_COLOR_MAP: Record<string, string> = {
  purple: Colors.spots.purple,
  orange: Colors.spots.orange,
  green: Colors.spots.green,
};

const TYPE_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  package: "package-variant-closed",
  tag: "tag",
  mystery: "help-circle",
};

interface SpotMarkerProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

function SpotMarkerCallout({ spot, onPress }: SpotMarkerProps) {
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName = TYPE_ICON_MAP[spot.type] ?? "help-circle";

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={false}
    >
      <View
        style={[
          styles.markerOuter,
          {
            borderColor: color,
            opacity: spot.collected ? 0.4 : 1,
          },
        ]}
      >
        <View style={[styles.markerInner, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={iconName} size={18} color="#FFFFFF" />
        </View>
      </View>
    </Marker>
  );
}

export const SpotMarker = React.memo(SpotMarkerCallout);

const styles = StyleSheet.create({
  markerOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  markerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
