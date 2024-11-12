import { create } from "zustand"
import type { Suggestion } from "@/utils/api"

interface SuggestionsState {
  selectedSuggestions: Set<string>
  toggleSuggestion: (suggestion: Suggestion) => void
  clearSelections: () => void
  isSelected: (suggestion: Suggestion) => boolean
  selectAll: (suggestions: Suggestion[]) => void
  isAllSelected: (suggestions: Suggestion[]) => boolean
}

export const useSuggestionsStore = create<SuggestionsState>((set, get) => ({
  selectedSuggestions: new Set<string>(),

  toggleSuggestion: (suggestion: Suggestion) => {
    const suggestionKey = suggestion.suggestion_id
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
    const suggestionKey = suggestion.suggestion_id
    return get().selectedSuggestions.has(suggestionKey)
  },

  selectAll: (suggestions: Suggestion[]) => {
    const currentState = get()
    const allSelected = currentState.isAllSelected(suggestions)

    if (allSelected) {
      currentState.clearSelections()
    } else {
      set({
        selectedSuggestions: new Set(suggestions.map((s) => s.suggestion_id)),
      })
    }
  },

  isAllSelected: (suggestions: Suggestion[]) => {
    const state = get()
    return suggestions.length > 0 && suggestions.every((s) => state.isSelected(s))
  },
}))
