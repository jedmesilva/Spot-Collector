import React from "react";
import { View } from "react-native";
import { Spot } from "@/context/SpotContext";

// Web stub — the real SpotMarker.native.tsx is used on native platforms.
// On web, the map is not used so this component is never rendered.
interface SpotMarkerProps {
  spot: Spot;
  onPress: (spot: Spot) => void;
}

export function SpotMarker(_props: SpotMarkerProps) {
  return <View />;
}
