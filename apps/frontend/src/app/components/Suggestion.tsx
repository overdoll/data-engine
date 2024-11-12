"use client"

import { Checkbox } from "@/components/checkbox"
import type { Suggestion as SuggestionType } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"

interface SuggestionProps {
  suggestion: SuggestionType
}

export function Suggestion({ suggestion }: SuggestionProps) {
  const { toggleSuggestion, isSelected } = useSuggestionsStore()

  return (
    <div className="p-4 border rounded-md flex gap-3">
      <div className="flex items-start pt-0.5">
        <Checkbox
          checked={isSelected(suggestion)}
          onCheckedChange={() => toggleSuggestion(suggestion)}
        />
      </div>
      <div className="flex-1 cursor-pointer" onClick={() => toggleSuggestion(suggestion)}>
        <h3 className="font-medium mb-1">Column: {suggestion.columnId}</h3>
        <p className="text-sm text-gray-600">
          Suggested Classification: {suggestion.classification}
        </p>
      </div>
    </div>
  )
}
