import { DropdownMenu } from "@/components/dropdown-menu"
import { Button } from "@/components/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { PremiumFeatureModal } from "./PremiumFeatureModal"
import Hubspot from "@/icons/hubspot"
import Salesforce from "@/icons/salesforce"
import { CubeSolid } from "@/icons/index"

interface ExportDropdownProps {
  fileName: string
}

export function ExportDropdown({ fileName }: ExportDropdownProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string>("")

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
    link.setAttribute("download", `${fileName || "export"}.csv`)
    link.style.visibility = "hidden "
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePremiumExport = (feature: string) => {
    setSelectedFeature(feature)
    setModalOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onClick={() => handlePremiumExport("Hubspot")}>
            <Hubspot className="w-4 h-4 mr-2" />
            Hubspot
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => handlePremiumExport("Salesforce")}>
            <Salesforce className="w-4 h-4 mr-2" />
            Salesforce
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handleExportCsv}>
            <CubeSolid className="w-4 h-4 mr-2" />
            Comma-separated values (.csv)
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      <PremiumFeatureModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        featureName={selectedFeature}
      />
    </>
  )
}
