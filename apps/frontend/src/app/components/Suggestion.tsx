"use client"

import { Checkbox } from "@/components/checkbox"
import type { Suggestion as SuggestionType } from "@/utils/api"
import { useSuggestionsStore } from "@/stores/suggestions"
import { Label } from "@/components/label"

interface SuggestionProps {
  suggestion: SuggestionType
}

export function Suggestion({ suggestion }: SuggestionProps) {
  const { toggleSuggestion, isSelected } = useSuggestionsStore()

  return (
    <div className="p-4 border rounded-md flex gap-3" onClick={() => toggleSuggestion(suggestion)}>
      <div className="flex items-start pt-0.5">
        <Checkbox
          checked={isSelected(suggestion)}
          onCheckedChange={() => toggleSuggestion(suggestion)}
        />
      </div>
      <div className="flex-1 cursor-pointer">
        <Label className="font-medium mb-1">{suggestion.label}</Label>
        <p className="text-sm text-gray-600">{suggestion.description}</p>
      </div>
    </div>
  )
}
