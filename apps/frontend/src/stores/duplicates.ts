import { create } from "zustand"

interface DuplicatesState {
  selectedColumns: string[]
  setSelectedColumns: (columns: string[]) => void
  toggleColumn: (columnId: string) => void
  resetState: () => void
}

export const useDuplicatesStore = create<DuplicatesState>((set) => ({
  selectedColumns: [],
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  toggleColumn: (columnId) =>
    set((state) => ({
      selectedColumns: state.selectedColumns.includes(columnId)
        ? state.selectedColumns.filter((id) => id !== columnId)
        : [...state.selectedColumns, columnId],
    })),
  resetState: () => set({ selectedColumns: [] }),
}))
