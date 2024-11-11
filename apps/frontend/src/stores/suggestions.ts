import { create } from "zustand"

interface SuggestionsState {
  selectedSuggestions: Set<string>
  toggleSuggestion: (suggestionKey: string) => void
  clearSelections: () => void
  isSelected: (suggestionKey: string) => boolean
}

export const useSuggestionsStore = create<SuggestionsState>((set, get) => ({
  selectedSuggestions: new Set<string>(),
  
  toggleSuggestion: (suggestionKey: string) => {
    set((state) => {
      const newSet = new Set(state.selectedSuggestions)
      if (newSet.has(suggestionKey)) {
        newSet.delete(suggestionKey)
      } else {
        newSet.add(suggestionKey)
      }
      return { selectedSuggestions: newSet }
    })
  },

  clearSelections: () => {
    set({ selectedSuggestions: new Set() })
  },

  isSelected: (suggestionKey: string) => {
    return get().selectedSuggestions.has(suggestionKey)
  },
})) 