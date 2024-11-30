"use client"

import { Label } from "@/components/label"
import { Tooltip, TooltipProvider } from "@/components/tooltip"
import QuestionMark from "@/icons/question-mark"

export function DataDeletionNotice() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Label size="xsmall" className="text-gray-400">
        All data is automatically deleted after 24 hours
      </Label>
      <TooltipProvider>
        <Tooltip
          content="Your data belongs to you. We never sell or use your data for commercial purposes, and automatically delete it after 24 hours for your privacy and security."
          className="w-[500px]"
        >
          <QuestionMark className="h-4 w-4 text-gray-400 hover:text-gray-500" />
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
