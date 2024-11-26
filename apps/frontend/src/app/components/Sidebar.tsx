"use client"

import { SuggestionsSidebar } from "./SuggestionsSidebar"
import { DuplicateColumnSidebar } from "./DuplicateColumnSidebar"
import { useModeStore } from "@/stores/mode"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Loader2 } from "lucide-react"

interface SidebarProps {
  fileId: string
}

export function Sidebar({ fileId }: SidebarProps) {
  const { mode } = useModeStore()
  const { isDeduplicating, stats } = useDuplicatesStore()

  return (
    <div className="h-[calc(100vh-79px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[350px]">
      {mode === "clean" ? (
        <SuggestionsSidebar fileId={fileId} />
      ) : (
        <>
          <DuplicateColumnSidebar fileId={fileId} />
          {isDeduplicating && (
            <div className="p-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deduplicating...
            </div>
          )}
          {stats && !isDeduplicating && (
            <div className="p-4 border-t text-sm text-muted-foreground">
              Found {stats.duplicateRows} duplicate rows out of {stats.totalRows} total rows
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 border-b h-[64px]">
      <div className="flex justify-between items-center h-full my-auto">{children}</div>
    </div>
  )
}
