"use client"

import { Checkbox } from "@/components/checkbox"
import type { Suggestion as SuggestionType } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"

interface SuggestionProps {
  suggestion: SuggestionType
}

export function Suggestion({ suggestion }: SuggestionProps) {
  const { toggleSuggestion, isSelected } = useSuggestionsStore()
  const suggestionKey = `${suggestion.columnName}-${suggestion.action}`

  return (
    <div className="p-4 border rounded-md flex gap-3">
      <Checkbox
        checked={isSelected(suggestionKey)}
        onCheckedChange={() => toggleSuggestion(suggestionKey)}
      />
      <div className="flex-1">
        <h3 className="font-medium mb-1">{suggestion.columnName}</h3>
        <p className="text-sm text-gray-600">{suggestion.description}</p>
      </div>
    </div>
  )
}
