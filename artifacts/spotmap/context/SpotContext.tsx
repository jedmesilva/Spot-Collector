import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SpotType = "package" | "tag" | "mystery";
export type SpotColor = "purple" | "orange" | "green";

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  color: SpotColor;
  latitude: number;
  longitude: number;
  description: string;
  collected: boolean;
}

const INITIAL_SPOTS: Spot[] = [
  {
    id: "1",
    name: "Parque Ibirapuera",
    type: "package",
    color: "green",
    latitude: -23.5874,
    longitude: -46.6576,
    description: "A legendary urban park with surprises hidden near the lake.",
    collected: false,
  },
  {
    id: "2",
    name: "Museu do Ipiranga",
    type: "mystery",
    color: "purple",
    latitude: -23.5857,
    longitude: -46.6108,
    description: "Ancient secrets locked within these historic walls.",
    collected: false,
  },
  {
    id: "3",
    name: "Avenida Paulista",
    type: "tag",
    color: "orange",
    latitude: -23.5631,
    longitude: -46.6544,
    description: "The heart of São Paulo buzzing with hidden marks.",
    collected: false,
  },
  {
    id: "4",
    name: "Mercado Municipal",
    type: "package",
    color: "orange",
    latitude: -23.5413,
    longitude: -46.6296,
    description: "A vibrant market with surprises tucked between the stalls.",
    collected: false,
  },
  {
    id: "5",
    name: "Pinacoteca do Estado",
    type: "mystery",
    color: "purple",
    latitude: -23.5344,
    longitude: -46.6333,
    description: "Art hides more than just paintings here.",
    collected: false,
  },
  {
    id: "6",
    name: "Vila Madalena",
    type: "tag",
    color: "green",
    latitude: -23.5508,
    longitude: -46.6896,
    description: "Street art and graffiti mark this creative neighborhood.",
    collected: false,
  },
  {
    id: "7",
    name: "Liberdade",
    type: "package",
    color: "purple",
    latitude: -23.5593,
    longitude: -46.634,
    description: "Cultural treasures hidden in São Paulo's Japantown.",
    collected: false,
  },
  {
    id: "8",
    name: "Jardins",
    type: "tag",
    color: "green",
    latitude: -23.5671,
    longitude: -46.6717,
    description: "Upscale avenues conceal collectible marks.",
    collected: false,
  },
];

const STORAGE_KEY = "@spotmap_spots";

interface SpotContextValue {
  spots: Spot[];
  collectedCount: number;
  nearbyCount: number;
  collectSpot: (id: string) => void;
  resetSpots: () => void;
}

const SpotContext = createContext<SpotContextValue | null>(null);

export function SpotProvider({ children }: { children: React.ReactNode }) {
  const [spots, setSpots] = useState<Spot[]>(INITIAL_SPOTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setSpots(JSON.parse(stored));
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

  const collectedCount = spots.filter((s) => s.collected).length;
  const nearbyCount = spots.filter((s) => !s.collected).length;

  return (
    <SpotContext.Provider
      value={{ spots, collectedCount, nearbyCount, collectSpot, resetSpots }}
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
