import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

import Colors from "@/constants/colors";
import { Spot, useSpots } from "@/context/SpotContext";

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
  onPress: (spot: Spot) => void;
}

function PulsingRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.9, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        {
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    />
  );
}

function SpotMarkerCallout({ spot, onPress }: SpotMarkerProps) {
  const { isNearby } = useSpots();
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const iconName = TYPE_ICON_MAP[spot.type] ?? "help-circle";
  const nearby = isNearby(spot);

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={() => onPress(spot)}
      tracksViewChanges={nearby}
    >
      <View style={styles.markerContainer}>
        {nearby && !spot.collected && <PulsingRing color={color} />}
        <View
          style={[
            styles.markerOuter,
            {
              borderColor: nearby && !spot.collected ? color : "#C0C0C8",
              opacity: spot.collected ? 0.4 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.markerInner,
              {
                backgroundColor: nearby && !spot.collected ? color : "#C0C0C8",
              },
            ]}
          >
            {nearby && !spot.collected ? (
              <MaterialCommunityIcons name={iconName} size={18} color="#FFFFFF" />
            ) : spot.collected ? (
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="lock" size={16} color="#FFFFFF" />
            )}
          </View>
        </View>
      </View>
    </Marker>
  );
}

export const SpotMarker = React.memo(SpotMarkerCallout);

const styles = StyleSheet.create({
  markerContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingRing: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
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
