import { create } from "zustand"

interface DuplicatesState {
  selectedColumns: string[]
  setSelectedColumns: (columns: string[]) => void
  isShowingDuplicates: boolean
  toggleColumn: (columnId: string) => void
  toggleDuplicates: () => void
  resetState: () => void
}

export const useDuplicatesStore = create<DuplicatesState>((set) => ({
  selectedColumns: [],
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  isShowingDuplicates: false,
  toggleColumn: (columnId) =>
    set((state) => ({
      selectedColumns: state.selectedColumns.includes(columnId)
        ? state.selectedColumns.filter((id) => id !== columnId)
        : [...state.selectedColumns, columnId],
    })),
  toggleDuplicates: () =>
    set((state) => ({
      isShowingDuplicates: !state.isShowingDuplicates,
    })),
  resetState: () => set({ isShowingDuplicates: false, selectedColumns: [] }),
}))
