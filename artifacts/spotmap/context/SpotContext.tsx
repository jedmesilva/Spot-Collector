import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SpotType = "coupon" | "product" | "cash" | "mystery";
export type SpotColor = "purple" | "orange" | "green";

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  color: SpotColor;
  latitude: number;
  longitude: number;
  description: string;
  reward: string;
  radius: number;
  collected: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

const INITIAL_SPOTS: Spot[] = [
  {
    id: "1",
    name: "Parque Ibirapuera",
    type: "coupon",
    color: "green",
    latitude: -23.5874,
    longitude: -46.6576,
    description: "Um cupom exclusivo escondido perto do lago do parque.",
    reward: "30% OFF em qualquer loja parceira",
    radius: 150,
    collected: false,
  },
  {
    id: "2",
    name: "Museu do Ipiranga",
    type: "mystery",
    color: "purple",
    latitude: -23.5857,
    longitude: -46.6108,
    description: "Um prêmio misterioso guardado entre estas paredes históricas.",
    reward: "Surpresa! Descubra ao chegar.",
    radius: 100,
    collected: false,
  },
  {
    id: "3",
    name: "Avenida Paulista",
    type: "cash",
    color: "orange",
    latitude: -23.5631,
    longitude: -46.6544,
    description: "Dinheiro em forma de crédito esperando por você.",
    reward: "R$ 15,00 em créditos na plataforma",
    radius: 200,
    collected: false,
  },
  {
    id: "4",
    name: "Mercado Municipal",
    type: "product",
    color: "orange",
    latitude: -23.5413,
    longitude: -46.6296,
    description: "Um produto exclusivo escondido entre as bancas.",
    reward: "Kit degustação de produtos artesanais",
    radius: 120,
    collected: false,
  },
  {
    id: "5",
    name: "Pinacoteca do Estado",
    type: "mystery",
    color: "purple",
    latitude: -23.5344,
    longitude: -46.6333,
    description: "A arte esconde mais do que pinturas aqui.",
    reward: "Surpresa! Descubra ao chegar.",
    radius: 100,
    collected: false,
  },
  {
    id: "6",
    name: "Vila Madalena",
    type: "coupon",
    color: "green",
    latitude: -23.5508,
    longitude: -46.6896,
    description: "Arte de rua e graffiti marcam este bairro criativo.",
    reward: "1 consumação grátis em bar parceiro",
    radius: 150,
    collected: false,
  },
  {
    id: "7",
    name: "Liberdade",
    type: "product",
    color: "purple",
    latitude: -23.5593,
    longitude: -46.634,
    description: "Tesouros culturais escondidos no bairro japonês de SP.",
    reward: "Box de produtos japoneses importados",
    radius: 130,
    collected: false,
  },
  {
    id: "8",
    name: "Jardins",
    type: "cash",
    color: "green",
    latitude: -23.5671,
    longitude: -46.6717,
    description: "Avenidas sofisticadas escondem recompensas em dinheiro.",
    reward: "R$ 25,00 em créditos na plataforma",
    radius: 180,
    collected: false,
  },
];

export function getDistance(loc: UserLocation, spot: Spot): number {
  const R = 6371000;
  const φ1 = (loc.latitude * Math.PI) / 180;
  const φ2 = (spot.latitude * Math.PI) / 180;
  const Δφ = ((spot.latitude - loc.latitude) * Math.PI) / 180;
  const Δλ = ((spot.longitude - loc.longitude) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STORAGE_KEY = "@spotmap_spots_v2";

interface SpotContextValue {
  spots: Spot[];
  collectedCount: number;
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation | null) => void;
  isNearby: (spot: Spot) => boolean;
  distanceTo: (spot: Spot) => number | null;
  collectSpot: (id: string) => void;
  resetSpots: () => void;
}

const SpotContext = createContext<SpotContextValue | null>(null);

export function SpotProvider({ children }: { children: React.ReactNode }) {
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].reward !== undefined) {
            setSpots(parsed);
          } else {
            setSpots(INITIAL_SPOTS);
          }
        } catch {
          setSpots(INITIAL_SPOTS);
        }
      }
    });
  }, []);

  const saveSpots = useCallback((updated: Spot[]) => {
    setSpots(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const collectSpot = useCallback(
    (id: string) => {
      const updated = spots.map((s) =>
        s.id === id ? { ...s, collected: true } : s
      );
      saveSpots(updated);
    },
    [spots, saveSpots]
  );

  const resetSpots = useCallback(() => {
    saveSpots(INITIAL_SPOTS);
  }, [saveSpots]);

  const distanceTo = useCallback(
    (spot: Spot): number | null => {
      if (!userLocation) return null;
      return getDistance(userLocation, spot);
    },
    [userLocation]
  );

  const isNearby = useCallback(
    (spot: Spot): boolean => {
      if (!userLocation) return false;
      return getDistance(userLocation, spot) <= spot.radius;
    },
    [userLocation]
  );

  const collectedCount = spots.filter((s) => s.collected).length;

  return (
    <SpotContext.Provider
      value={{
        spots,
        collectedCount,
        userLocation,
        setUserLocation,
        isNearby,
        distanceTo,
        collectSpot,
        resetSpots,
      }}
    >
      {children}
    </SpotContext.Provider>
  );
}

export function useSpots() {
  const ctx = useContext(SpotContext);
  if (!ctx) throw new Error("useSpots must be used within SpotProvider");
  return ctx;
}
