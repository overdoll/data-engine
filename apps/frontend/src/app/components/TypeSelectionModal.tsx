import { Prompt } from "@/components/prompt"
import { FileTypeSelector } from "./FileTypeSelector"
import { useState } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"

interface TypeSelectionPromptProps {
  fileId: string
}

export function TypeSelectionModal({ fileId }: TypeSelectionPromptProps) {
  const { fileId: mostRecentFileId, setFileId: setMostRecentFileId } = useMostRecentUpload()
  const [open, onOpenChange] = useState(mostRecentFileId === fileId)

  const handleTypeSelection = (selectedType: string) => {
    console.log(`Starting deduplication for ${selectedType}`)
    setMostRecentFileId(null)
    onOpenChange(false)
  }

  const [selectedType, setSelectedType] = useState<string>("")

  return (
    <Prompt open={open} onOpenChange={onOpenChange} variant="confirmation">
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Select File Type</Prompt.Title>
          <Prompt.Description>Choose the type of file to begin deduplication</Prompt.Description>
        </Prompt.Header>
        <div className="p-6">
          <FileTypeSelector selectedType={selectedType} onTypeSelect={setSelectedType} />
        </div>
        <Prompt.Footer>
          <Prompt.Cancel onClick={() => onOpenChange(false)}>Cancel</Prompt.Cancel>
          <Prompt.Action onClick={() => handleTypeSelection(selectedType)} disabled={!selectedType}>
            Start deduplication
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}
