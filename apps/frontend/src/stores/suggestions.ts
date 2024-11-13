import { create } from "zustand"
import type { Suggestion } from "@/utils/api"

interface SuggestionsState {
  selectedSuggestions: Suggestion[]
  toggleSuggestion: (suggestions: Suggestion | Suggestion[]) => void
  isSelected: (suggestions: Suggestion | Suggestion[]) => boolean
  clearSelections: () => void
}

export const useSuggestionsStore = create<SuggestionsState>((set, get) => ({
  selectedSuggestions: [],

  toggleSuggestion: (suggestionOrSuggestions) => {
    const suggestions = Array.isArray(suggestionOrSuggestions)
      ? suggestionOrSuggestions
      : [suggestionOrSuggestions]

    set((state) => {
      const newSelections = [...state.selectedSuggestions]

      suggestions.forEach((suggestion) => {
        const index = newSelections.findIndex((s) => s.suggestion_id === suggestion.suggestion_id)
        if (index === -1) {
          newSelections.push(suggestion)
        } else {
          newSelections.splice(index, 1)
        }
      })

      return { selectedSuggestions: newSelections }
    })
  },

  isSelected: (suggestions) => {
    const suggests = Array.isArray(suggestions) ? suggestions : [suggestions]

    const state = get()
    const selectedIds = new Set(state.selectedSuggestions.map((s) => s.suggestion_id))

    return suggests.every((suggestion) => selectedIds.has(suggestion.suggestion_id))
  },

  clearSelections: () => set({ selectedSuggestions: [] }),
}))
