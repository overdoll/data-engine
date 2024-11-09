"use client"

import { DropdownMenu } from "@/components/dropdown-menu"
import { Button } from "@/components/button"
import { Download } from "lucide-react"
import { useFileMetadata } from "@/utils/api"

interface ExportDropdownProps {
  fileId: string
}

export function ExportDropdown({ fileId }: ExportDropdownProps) {
  const { data: metadata } = useFileMetadata(fileId)

  const handleExportCsv = () => {
    // Get the grid API from CsvViewer
    const gridApi = window.gridApi
    if (!gridApi) return

    // Get all row data
    const csvData = gridApi.getDataAsCsv({
      skipHeader: false,
      columnSeparator: ",",
    })

    // Create and trigger download
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${metadata?.fileName || "export"}.csv`)
    link.style.visibility = "hidden "
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={handleExportCsv}>CSV</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
