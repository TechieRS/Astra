import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Preferences {
  sessionId: string | null;
  callsign: string;
  reducedMotion: boolean;
  largeText: boolean;
  guidance: boolean;
  setSession: (id: string | null) => void;
  setCallsign: (callsign: string) => void;
  setPreference: (
    key: "reducedMotion" | "largeText" | "guidance",
    value: boolean,
  ) => void;
}
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      sessionId: null,
      callsign: "Pathfinder",
      reducedMotion: false,
      largeText: false,
      guidance: true,
      setSession: (sessionId) => set({ sessionId }),
      setCallsign: (callsign) => set({ callsign }),
      setPreference: (key, value) => set({ [key]: value }),
    }),
    { name: "astra-preferences-v1" },
  ),
);
