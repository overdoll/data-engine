import { DropdownMenu } from "@/components/dropdown-menu"
import { Button } from "@/components/button"
import { Download } from "lucide-react"
import { useState } from "react"
import Hubspot from "@/icons/hubspot"
import Salesforce from "@/icons/salesforce"
import { CubeSolid } from "@/icons/index"
import { Prompt } from "@/components/prompt"
import { Label } from "@/components/label"
import { useFeatureRequest } from "@/utils/api"
import { Textarea } from "@/components/textarea"

interface ExportDropdownProps {
  fileName: string
}

export function ExportDropdown({ fileName }: ExportDropdownProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<"hubspot" | "salesforce" | null>(null)

  const handleExportCsv = () => {
    // Get the grid API from CsvViewer
    const gridApi = window.gridApi
    if (!gridApi) return

    // Get all row data
    const csvData = gridApi.getDataAsCsv({
      skipHeader: false,
      columnSeparator: ",",
      skipColumnGroupHeaders: true,
      skipRowGroups: true,
      skipGroups: true,
      suppressGroupRows: true,
      onlySelected: false,
      allColumns: true,
      processGroupHeaderCallback: () => "", // Skip group header rows
      shouldRowBeSkipped: (params: any) => params.node.group, // Skip grouped rows
    })

    // Create and trigger download
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Cleaned by DMT - ${fileName || "export"}`)
    link.style.visibility = "hidden "
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePremiumExport = (feature: "hubspot" | "salesforce") => {
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
          <DropdownMenu.Item onClick={() => handlePremiumExport("hubspot")}>
            <Hubspot className="w-4 h-4 mr-2" />
            Hubspot
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => handlePremiumExport("salesforce")}>
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

interface PremiumFeatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: "hubspot" | "salesforce" | null
}

export function PremiumFeatureModal({ open, onOpenChange, featureName }: PremiumFeatureModalProps) {
  const [text, setText] = useState("")
  const { mutateAsync: submitFeatureRequest, isPending } = useFeatureRequest()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Submit feature request
    if (featureName) {
      await submitFeatureRequest({
        feature_type: featureName === "hubspot" ? "export-hubspot" : "export-salesforce",
        text, // Using email as the text field
      })
    }

    setText("")

    onOpenChange(false)
  }

  return (
    <Prompt open={open} onOpenChange={onOpenChange} variant="confirmation">
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Premium Feature</Prompt.Title>
          <Prompt.Description>
            {featureName} export is a premium feature. Sign up to get early access when it launches!
          </Prompt.Description>
        </Prompt.Header>
        <div className="space-y-1 p-6">
          <Label htmlFor="text">Tell us more</Label>
          <Textarea
            id="text"
            placeholder={`Tell us about what you would do with this data in your ${featureName} account`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action disabled={text.length < 3 || isPending} onClick={handleSubmit}>
            Sign up for early access
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}
