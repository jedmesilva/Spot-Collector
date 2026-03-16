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

const TYPE_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  coupon: "ticket-percent",
  product: "gift",
  cash: "cash",
  mystery: "help-circle",
  package: "package-variant-closed",
  tag: "tag",
};

const TYPE_LABEL: Record<string, string> = {
  coupon: "Cupom",
  product: "Produto",
  cash: "Dinheiro",
  mystery: "Mistério",
};

function WebSpotCard({
  spot,
  onPress,
}: {
  spot: Spot;
  onPress: (s: Spot) => void;
}) {
  const color = Colors.spots[spot.color as keyof typeof Colors.spots] ?? Colors.accent;
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
        <Text style={styles.spotCardType}>
          {TYPE_LABEL[spot.type] ?? spot.type}
        </Text>
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
  const { spots, collectSpot, collectedCount, setUserLocation, userLocation } = useSpots();
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [walletVisible, setWalletVisible] = useState(false);
  const mapRef = useRef<any>(null);
  const collectBounce = useRef(new Animated.Value(1)).current;
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const loc = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      };
      setUserLocation(loc);
      mapRef.current?.animateToRegion(
        { ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800
      );

      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      );
    })();

    return () => {
      locationSub.current?.remove();
    };
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
      mapRef.current?.animateToRegion(
        { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600
      );
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          const region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          mapRef.current?.animateToRegion(region, 600);
        }
      } catch {
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
              Escaneie o QR code no Expo Go para explorar o mapa ao vivo
            </Text>
          </View>
          <Text style={styles.sectionTitle}>Todos os Spots</Text>
          {spots.map((spot) => (
            <WebSpotCard key={spot.id} spot={spot} onPress={handleSpotPress} />
          ))}
        </ScrollView>
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
