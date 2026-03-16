import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SpotBottomSheet } from "@/components/SpotBottomSheet";
import { SpotMarker } from "@/components/SpotMarker";
import { WalletPanel } from "@/components/WalletPanel";
import Colors from "@/constants/colors";
import { Spot, useSpots } from "@/context/SpotContext";

const SAO_PAULO_REGION: Region = {
  latitude: -23.5631,
  longitude: -46.6544,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const SPOT_COLOR_MAP: Record<string, string> = {
  purple: Colors.spots.purple,
  orange: Colors.spots.orange,
  green: Colors.spots.green,
};

const TYPE_ICON_MAP: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  package: "package-variant-closed",
  tag: "tag",
  mystery: "help-circle",
};

function WebSpotCard({
  spot,
  onPress,
}: {
  spot: Spot;
  onPress: (s: Spot) => void;
}) {
  const color = SPOT_COLOR_MAP[spot.color] ?? Colors.accent;
  const icon = TYPE_ICON_MAP[spot.type] ?? "help-circle";
  return (
    <Pressable
      onPress={() => onPress(spot)}
      style={({ pressed }) => [
        styles.spotCard,
        {
          borderLeftColor: color,
          opacity: pressed ? 0.8 : spot.collected ? 0.45 : 1,
        },
      ]}
    >
      <View style={[styles.spotCardIcon, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.spotCardText}>
        <Text style={styles.spotCardName} numberOfLines={1}>
          {spot.name}
        </Text>
        <Text style={styles.spotCardType}>{spot.type}</Text>
      </View>
      {spot.collected ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={20}
          color={Colors.accentGreen}
        />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={Colors.light.textSecondary}
        />
      )}
    </Pressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { spots, collectSpot, collectedCount } = useSpots();
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [walletVisible, setWalletVisible] = useState(false);
  const mapRef = useRef<any>(null);
  const collectBounce = useRef(new Animated.Value(1)).current;
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const region: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setUserLocation(region);
        mapRef.current?.animateToRegion(region, 800);
      }
    })();
  }, []);

  const handleSpotPress = useCallback((spot: Spot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSpot(spot);
  }, []);

  const handleCollect = useCallback(
    (id: string) => {
      collectSpot(id);
      Animated.sequence([
        Animated.timing(collectBounce, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(collectBounce, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setSelectedSpot(null), 1200);
    },
    [collectSpot, collectBounce]
  );

  const handleWallet = useCallback(() => {
    setSelectedSpot(null);
    setWalletVisible(true);
  }, []);

  const handleCenterMap = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userLocation) {
      mapRef.current?.animateToRegion(userLocation, 600);
    } else {
      // Try to get location on demand if not yet available
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          const region: Region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setUserLocation(region);
          mapRef.current?.animateToRegion(region, 600);
        }
      } catch {
        // Fall back to São Paulo if location unavailable
        mapRef.current?.animateToRegion(SAO_PAULO_REGION, 600);
      }
    }
  }, [userLocation]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const isNative = Platform.OS !== "web";

  return (
    <View style={styles.container}>
      {isNative ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={SAO_PAULO_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          onPress={() => {
            if (selectedSpot) setSelectedSpot(null);
          }}
        >
          {spots.map((spot) => (
            <SpotMarker key={spot.id} spot={spot} onPress={handleSpotPress} />
          ))}
        </MapView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topInset + 90, paddingBottom: bottomInset + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mapHint}>
            <MaterialCommunityIcons
              name="map-outline"
              size={36}
              color={Colors.accent}
            />
            <Text style={styles.mapHintText}>
              Scan the QR code in Expo Go on your phone to explore the live map
            </Text>
          </View>
          <Text style={styles.sectionTitle}>All Spots</Text>
          {spots.map((spot) => (
            <WebSpotCard key={spot.id} spot={spot} onPress={handleSpotPress} />
          ))}
        </ScrollView>
      )}

      {/* Floating buttons column (wallet + recenter) — native only */}
      {isNative && (
        <View style={[styles.floatingBtns, { bottom: 24 + bottomInset }]}>
          <Animated.View style={{ transform: [{ scale: collectBounce }] }}>
            <Pressable
              onPress={handleWallet}
              style={({ pressed }) => [
                styles.walletBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <MaterialCommunityIcons name="wallet" size={18} color="#fff" />
              {collectedCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{collectedCount}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={handleCenterMap}
            style={({ pressed }) => [
              styles.floatingBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
              color={Colors.primary}
            />
          </Pressable>
        </View>
      )}

      {/* User avatar — top left */}
      {isNative && (
        <Pressable
          style={[styles.avatarBtn, { top: topInset + 12 }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <View style={styles.avatarInner}>
            <MaterialCommunityIcons name="account" size={26} color="#fff" />
          </View>
        </Pressable>
      )}

      <SpotBottomSheet
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onCollect={handleCollect}
      />

      <WalletPanel
        visible={walletVisible}
        onClose={() => setWalletVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10 },
  mapHint: {
    backgroundColor: Colors.accent + "10",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  mapHintText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  walletBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accentGreen,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  floatingBtns: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  floatingBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  spotCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  spotCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  spotCardText: { flex: 1 },
  spotCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  spotCardType: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
    fontFamily: "Inter_400Regular",
  },
});
