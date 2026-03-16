import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type SpotType = "coupon" | "product" | "cash" | "mystery" | "package" | "tag";
export type SpotColor = "purple" | "orange" | "green";

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  color: SpotColor;
  description: string;
  reward: string;
  latitude: number;
  longitude: number;
  collected: boolean;
  collectedAt?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface SpotsContextValue {
  spots: Spot[];
  collectSpot: (id: string) => Promise<void>;
  collectedCount: number;
  setUserLocation: (loc: UserLocation) => void;
  userLocation: UserLocation | null;
  isNearby: (spot: Spot) => boolean;
  distanceTo: (spot: Spot) => number;
}

const COLLECTION_RADIUS_METERS = 200;
const SPOTS_STORAGE_KEY = "spotmap:spots_v2";
const COLLECTED_KEY = "spotmap:collected";

const SPOT_TEMPLATES = [
  {
    id: "spot-1",
    name: "Desconto Especial",
    type: "coupon" as SpotType,
    color: "green" as SpotColor,
    description: "20% de desconto em qualquer compra na loja parceira mais próxima.",
    reward: "20% OFF",
  },
  {
    id: "spot-2",
    name: "Caixa Misteriosa",
    type: "mystery" as SpotType,
    color: "purple" as SpotColor,
    description: "O que estará dentro? Só coletando para descobrir!",
    reward: "Surpresa",
  },
  {
    id: "spot-3",
    name: "R$ 10 Cashback",
    type: "cash" as SpotType,
    color: "orange" as SpotColor,
    description: "Crédito direto na sua conta ao coletar este Spot.",
    reward: "R$ 10,00",
  },
  {
    id: "spot-4",
    name: "Fone Bluetooth",
    type: "product" as SpotType,
    color: "purple" as SpotColor,
    description: "Fone de ouvido sem fio para retirar na loja parceira.",
    reward: "Produto",
  },
  {
    id: "spot-5",
    name: "Cupom de Frete",
    type: "coupon" as SpotType,
    color: "orange" as SpotColor,
    description: "Ganhe frete grátis no próximo pedido em delivery.",
    reward: "Frete Grátis",
  },
  {
    id: "spot-6",
    name: "Pacote Premium",
    type: "package" as SpotType,
    color: "green" as SpotColor,
    description: "Um mês de assinatura premium em algum serviço surpresa.",
    reward: "1 mês Premium",
  },
  {
    id: "spot-7",
    name: "Tag Exclusiva",
    type: "tag" as SpotType,
    color: "purple" as SpotColor,
    description: "Colecione esta tag exclusiva do SpotMap para o seu perfil.",
    reward: "Tag Rara",
  },
  {
    id: "spot-8",
    name: "R$ 25 Cashback",
    type: "cash" as SpotType,
    color: "green" as SpotColor,
    description: "Crédito especial para usar em lojas parceiras.",
    reward: "R$ 25,00",
  },
];

// Scatter spots around a center point within a max radius (in meters)
function generateSpotsAround(
  centerLat: number,
  centerLon: number
): Spot[] {
  // Distribute spots in rings so they feel natural
  const offsets = [
    { distM: 180, angleDeg: 30 },
    { distM: 320, angleDeg: 110 },
    { distM: 250, angleDeg: 200 },
    { distM: 450, angleDeg: 300 },
    { distM: 150, angleDeg: 70 },
    { distM: 500, angleDeg: 160 },
    { distM: 380, angleDeg: 250 },
    { distM: 280, angleDeg: 340 },
  ];

  return SPOT_TEMPLATES.map((template, i) => {
    const { distM, angleDeg } = offsets[i % offsets.length];
    const angleRad = (angleDeg * Math.PI) / 180;
    // 1 degree lat ≈ 111320 m
    const deltaLat = (distM * Math.cos(angleRad)) / 111320;
    // 1 degree lon ≈ 111320 * cos(lat) m
    const deltaLon =
      (distM * Math.sin(angleRad)) / (111320 * Math.cos((centerLat * Math.PI) / 180));

    return {
      ...template,
      latitude: centerLat + deltaLat,
      longitude: centerLon + deltaLon,
      collected: false,
    };
  });
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SpotsContext = createContext<SpotsContextValue | null>(null);

export function SpotProvider({ children }: { children: React.ReactNode }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const spotsGenerated = useRef(false);

  // Load persisted spots on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SPOTS_STORAGE_KEY);
        if (raw) {
          const saved: Spot[] = JSON.parse(raw);
          if (saved && saved.length > 0) {
            setSpots(saved);
            spotsGenerated.current = true;
          }
        }
      } catch {}
    })();
  }, []);

  const setUserLocation = useCallback((loc: UserLocation) => {
    setUserLocationState(loc);

    // Generate spots around the user on first location fix (if not yet generated)
    if (!spotsGenerated.current) {
      spotsGenerated.current = true;
      const generated = generateSpotsAround(loc.latitude, loc.longitude);
      setSpots(generated);
      AsyncStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(generated)).catch(() => {});
    }
  }, []);

  const collectSpot = useCallback(async (id: string) => {
    setSpots((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, collected: true, collectedAt: Date.now() } : s
      );
      AsyncStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const distanceTo = useCallback(
    (spot: Spot): number => {
      if (!userLocation) return Infinity;
      return haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        spot.latitude,
        spot.longitude
      );
    },
    [userLocation]
  );

  const isNearby = useCallback(
    (spot: Spot): boolean => distanceTo(spot) <= COLLECTION_RADIUS_METERS,
    [distanceTo]
  );

  const collectedCount = spots.filter((s) => s.collected).length;

  return (
    <SpotsContext.Provider
      value={{
        spots,
        collectSpot,
        collectedCount,
        setUserLocation,
        userLocation,
        isNearby,
        distanceTo,
      }}
    >
      {children}
    </SpotsContext.Provider>
  );
}

export function useSpots(): SpotsContextValue {
  const ctx = useContext(SpotsContext);
  if (!ctx) throw new Error("useSpots must be used inside SpotProvider");
  return ctx;
}
