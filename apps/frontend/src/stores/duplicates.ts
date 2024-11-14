import { create } from 'zustand'

interface DuplicatesStore {
  isShowingDuplicates: boolean
  toggleDuplicates: () => void
}

export const useDuplicatesStore = create<DuplicatesStore>((set) => ({
  isShowingDuplicates: false,
  toggleDuplicates: () => set((state) => ({ isShowingDuplicates: !state.isShowingDuplicates })),
})) 