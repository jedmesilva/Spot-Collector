import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
const STORAGE_KEY = "spotmap:collected";

const INITIAL_SPOTS: Spot[] = [
  {
    id: "spot-1",
    name: "Desconto Starbucks",
    type: "coupon",
    color: "green",
    description: "20% de desconto em qualquer bebida na Avenida Paulista.",
    reward: "20% OFF",
    latitude: -23.5614,
    longitude: -46.6556,
    collected: false,
  },
  {
    id: "spot-2",
    name: "Caixa Misteriosa",
    type: "mystery",
    color: "purple",
    description: "O que estará dentro? Só coletando para descobrir!",
    reward: "Surpresa",
    latitude: -23.5648,
    longitude: -46.6489,
    collected: false,
  },
  {
    id: "spot-3",
    name: "R$ 10 Cashback",
    type: "cash",
    color: "orange",
    description: "Crédito direto na sua conta ao coletar este Spot.",
    reward: "R$ 10,00",
    latitude: -23.5599,
    longitude: -46.6611,
    collected: false,
  },
  {
    id: "spot-4",
    name: "Fone Bluetooth",
    type: "product",
    color: "purple",
    description: "Fone de ouvido sem fio para retirar na loja parceira.",
    reward: "Produto",
    latitude: -23.5671,
    longitude: -46.6522,
    collected: false,
  },
  {
    id: "spot-5",
    name: "Cupom iFood",
    type: "coupon",
    color: "orange",
    description: "Ganhe frete grátis no próximo pedido via iFood.",
    reward: "Frete Grátis",
    latitude: -23.5583,
    longitude: -46.6574,
    collected: false,
  },
  {
    id: "spot-6",
    name: "Pacote Premium",
    type: "package",
    color: "green",
    description: "Um mês de assinatura premium em algum serviço surpresa.",
    reward: "1 mês Premium",
    latitude: -23.5632,
    longitude: -46.6498,
    collected: false,
  },
  {
    id: "spot-7",
    name: "Tag Exclusiva",
    type: "tag",
    color: "purple",
    description: "Colecione esta tag exclusiva do SpotMap para o seu perfil.",
    reward: "Tag Rara",
    latitude: -23.5657,
    longitude: -46.6581,
    collected: false,
  },
  {
    id: "spot-8",
    name: "R$ 25 Cashback",
    type: "cash",
    color: "green",
    description: "Crédito especial para usar em lojas parceiras.",
    reward: "R$ 25,00",
    latitude: -23.5608,
    longitude: -46.6535,
    collected: false,
  },
];

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
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const collected: string[] = JSON.parse(raw);
        setSpots((prev) =>
          prev.map((s) =>
            collected.includes(s.id) ? { ...s, collected: true } : s
          )
        );
      } catch {}
    });
  }, []);

  const collectSpot = useCallback(async (id: string) => {
    setSpots((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, collected: true, collectedAt: Date.now() } : s
      );
      const collectedIds = updated
        .filter((s) => s.collected)
        .map((s) => s.id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collectedIds));
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
