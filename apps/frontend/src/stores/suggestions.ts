import { create } from "zustand"
import type { Suggestion } from "@/utils/api"

interface SuggestionsState {
  selectedSuggestions: Set<string>
  toggleSuggestion: (suggestion: Suggestion) => void
  clearSelections: () => void
  isSelected: (suggestion: Suggestion) => boolean
}

export const useSuggestionsStore = create<SuggestionsState>((set, get) => ({
  selectedSuggestions: new Set<string>(),

  toggleSuggestion: (suggestion: Suggestion) => {
    const suggestionKey = suggestion.suggestionId
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

  isSelected: (suggestion: Suggestion) => {
    const suggestionKey = suggestion.suggestionId
    console.log(suggestionKey)
    console.log(get().selectedSuggestions.keys())
    return get().selectedSuggestions.has(suggestionKey)
  },
}))
