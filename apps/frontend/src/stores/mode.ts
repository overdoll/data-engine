import { create } from "zustand"

type Mode = "clean" | "deduplicate"

interface ModeState {
  mode: Mode
  setMode: (mode: Mode) => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: "clean",
  setMode: (mode) => set({ mode }),
}))
