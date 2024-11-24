"use client"

import { SuggestionsList } from "./SuggestionsList"
import { Tabs } from "@/components/tabs/tabs"
import { useState } from "react"
import { DuplicateColumnSelector } from "./DuplicateColumnSelector"
import { useDeduplicate } from "@/utils/api"
import { useDuplicatesStore } from "@/stores/duplicates"
import { Button } from "@/components/button"

interface SidebarProps {
  fileId: string
}

export function Sidebar({ fileId }: SidebarProps) {
  const [activeTab, setActiveTab] = useState("fix")
  const { mutate: deduplicate, isPending } = useDeduplicate(fileId)
  const { selectedColumns } = useDuplicatesStore()

  return (
    <div className="h-[calc(100vh-79px)] bg-ui-bg-base border-ui-border-base flex flex-col rounded-lg border w-[350px]">
      <div className="p-2 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="fix">Fix</Tabs.Trigger>
            <Tabs.Trigger value="deduplicate">Deduplicate</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="fix" className="mt-2">
            <SuggestionsList fileId={fileId} />
          </Tabs.Content>
          <Tabs.Content value="deduplicate" className="mt-2">
            <DuplicateColumnSelector fileId={fileId} />
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  )
}
