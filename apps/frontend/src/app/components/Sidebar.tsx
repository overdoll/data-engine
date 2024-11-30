"use client"

import { SuggestionsSidebar } from "./SuggestionsSidebar"
import { DuplicateColumnSidebar } from "./DuplicateColumnSidebar"
import { useModeStore } from "@/stores/mode"

interface SidebarProps {
  fileId: string
}

export function Sidebar({ fileId }: SidebarProps) {
  const { mode } = useModeStore()

  return (
    <div className="h-[calc(100vh-79px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[350px]">
      {mode === "clean" ? (
        <SuggestionsSidebar fileId={fileId} />
      ) : (
        <DuplicateColumnSidebar fileId={fileId} />
      )}
    </div>
  )
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 border-b h-[52px] bg-ui-bg-component rounded-t-md">
      <div className="flex justify-between items-center h-full my-auto">{children}</div>
    </div>
  )
}
