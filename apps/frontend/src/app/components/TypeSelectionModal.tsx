import { Prompt } from "@/components/prompt"
import { useState } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"
import { DatasetType, useCsvMetadata, useUpdateDatasetType, useSendMessage } from "@/utils/api"
import { X } from "lucide-react"
import { Textarea } from "@/components/textarea"
import { DATASET_TYPES } from "@/utils/dataset-types"
import { DatasetTypeIcon } from "./DatasetTypeIcon"
import { Heading } from "@/components/heading"
import { Label } from "@/components/label"
import { toast } from "@/utils/toast"

interface TypeSelectionModalProps {
  fileId: string
}

export function TypeSelectionModal({ fileId }: TypeSelectionModalProps) {
  const { fileId: mostRecentFileId } = useMostRecentUpload()
  const { data: csvMetadata } = useCsvMetadata(fileId)
  const [open, onOpenChange] = useState(mostRecentFileId === fileId)

  return (
    <Prompt open={open} onOpenChange={onOpenChange} variant="confirmation">
      {csvMetadata && (
        <TypeSelectionModalContent
          fileId={fileId}
          datasetType={csvMetadata.metadata.dataset_type}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Prompt>
  )
}

type TypeSelectionModalContentProps = {
  fileId: string
  datasetType: DatasetType
  onClose: () => void
}

function TypeSelectionModalContent({
  fileId,
  datasetType,
  onClose,
}: TypeSelectionModalContentProps) {
  const { mutateAsync: updateDatasetType } = useUpdateDatasetType(fileId)
  const { mutateAsync: sendMessage } = useSendMessage()
  const { setFileId: setMostRecentFileId } = useMostRecentUpload()
  const [selectedType, setSelectedType] = useState<DatasetType>(datasetType)
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [otherDescription, setOtherDescription] = useState("")

  const handleTypeSelection = async (selectedType: DatasetType) => {
    if (selectedType !== datasetType) {
      await updateDatasetType(selectedType)
    }

    if (showOtherInput && otherDescription.trim()) {
      await sendMessage({
        title: "Unsupported Dataset Type",
        description: "User requested support for new dataset type",
        customerMessage: otherDescription.trim(),
      })

      toast("Feature request received", {
        description:
          "Thanks for letting us know more about your data! In the meantime, try using the tool with your current dataset type.",
        duration: 10000,
      })
    }

    setMostRecentFileId(null)
    onClose()
  }

  return (
    <Prompt.Content>
      <Prompt.Header>
        <Prompt.Title>Select file type</Prompt.Title>
        <Prompt.Description>
          Please tell us what kind of data you&apos;re uploading
        </Prompt.Description>
      </Prompt.Header>
      <div className="px-6 pt-6 flex flex-col gap-4">
        <FileTypeSelector selectedType={selectedType} onTypeSelect={setSelectedType} />
        <Label size="xsmall" className="text-gray-400">
          Selecting the type of data will help us optimize the deduplication process{" "}
          <Label
            size="xsmall"
            onClick={() => setShowOtherInput(!showOtherInput)}
            className="text-blue-500 cursor-pointer"
          >
            I don&apos;t see my data type here
          </Label>
        </Label>
        <div className="flex flex-col items-center space-y-4">
          {showOtherInput && (
            <div className="space-y-2 w-full border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="other-description">Tell us about your data</Label>
                <button
                  onClick={() => setShowOtherInput(false)}
                  className="text-gray-500 hover:text-gray-700 ml-auto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-gray-400 text-xs">
                  We only support contacts and companies right now, but we&apos;re more than
                  interested in hearing about your use-case and what you&apos;re trying to do!
                </Label>
              </div>
              <Textarea
                id="other-description"
                placeholder="What are you looking to do with this data?"
                value={otherDescription}
                rows={4}
                onChange={(e) => setOtherDescription(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
      <Prompt.Footer>
        <Prompt.Cancel onClick={onClose}>Cancel</Prompt.Cancel>
        <Prompt.Action
          onClick={() => handleTypeSelection(selectedType)}
          disabled={!selectedType || (showOtherInput && !otherDescription.trim())}
        >
          Start deduplication
        </Prompt.Action>
      </Prompt.Footer>
    </Prompt.Content>
  )
}

interface FileTypeSelectorProps {
  selectedType: DatasetType
  onTypeSelect: (type: DatasetType) => void
}

function FileTypeSelector({ selectedType, onTypeSelect }: FileTypeSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {DATASET_TYPES.map((type) => (
            <div
              key={type.id}
              className={`p-6 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                selectedType === type.id ? "border-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => onTypeSelect(type.id)}
            >
              <div className="flex items-center  gap-2">
                <DatasetTypeIcon type={type.id} className="w-5 my-auto h-full" />
                <Heading>{type.label}</Heading>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
