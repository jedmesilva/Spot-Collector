import React from "react";
import { View } from "react-native";
import { Spot } from "@/context/SpotContext";

interface SpotMarkerProps {
  spot: Spot;
  nearby: boolean;
  onPress: (spot: Spot) => void;
}

export function SpotMarker(_props: SpotMarkerProps) {
  return <View />;
}
