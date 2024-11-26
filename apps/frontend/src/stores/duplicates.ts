import { create } from "zustand"

interface DeduplicationStats {
  duplicateRows: number
  totalRows: number
}

interface DuplicatesState {
  selectedColumns: string[]
  isDeduplicating: boolean
  stats: DeduplicationStats | null
  duplicateRows: Record<string, string[]>
  setSelectedColumns: (columns: string[]) => void
  toggleColumn: (columnId: string) => void
  setIsDeduplicating: (loading: boolean) => void
  setStats: (stats: DeduplicationStats | null) => void
  resetState: () => void
  setDuplicateRows: (duplicateRows: Record<string, string[]>) => void
}

export const useDuplicatesStore = create<DuplicatesState>((set) => ({
  selectedColumns: [],
  isDeduplicating: false,
  stats: null,
  duplicateRows: {},
  setSelectedColumns: (columns) => set({ selectedColumns: columns }),
  toggleColumn: (columnId) =>
    set((state) => ({
      selectedColumns: state.selectedColumns.includes(columnId)
        ? state.selectedColumns.filter((id) => id !== columnId)
        : [...state.selectedColumns, columnId],
    })),
  setIsDeduplicating: (loading) => set({ isDeduplicating: loading }),
  setStats: (stats) => set({ stats }),
  resetState: () =>
    set({ selectedColumns: [], isDeduplicating: false, stats: null, duplicateRows: {} }),
  setDuplicateRows: (duplicateRows) => set({ duplicateRows }),
}))
