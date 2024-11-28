import { DropdownMenu } from "@/components/dropdown-menu"
import { Button } from "@/components/button"
import { Download } from "lucide-react"
import { useState } from "react"
import Hubspot from "@/icons/hubspot"
import Salesforce from "@/icons/salesforce"
import { CubeSolid } from "@/icons/index"
import { Prompt } from "@/components/prompt"
import { Input } from "@/components/input"
import { Label } from "@/components/label"

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
      skipColumnGroupHeaders: true,
      skipRowGroups: true,
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

interface PremiumFeatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
}

export function PremiumFeatureModal({ open, onOpenChange, featureName }: PremiumFeatureModalProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle email submission to API
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </form>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action onClick={handleSubmit}>Sign up for early access</Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}
