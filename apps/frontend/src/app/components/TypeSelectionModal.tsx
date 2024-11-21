import { Prompt } from "@/components/prompt"
import { FileTypeSelector } from "./FileTypeSelector"
import { useState } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"
import { DatasetType, useCsvMetadata, useUpdateDatasetType } from "@/utils/api"
import { Skeleton } from "@/components/skeleton"

interface TypeSelectionModalProps {
  fileId: string
}

export function TypeSelectionModal({ fileId }: TypeSelectionModalProps) {
  const { fileId: mostRecentFileId } = useMostRecentUpload()
  const { data: csvMetadata, isLoading } = useCsvMetadata(fileId)
  const [open, onOpenChange] = useState(mostRecentFileId === fileId)

  if (isLoading || !csvMetadata) return <></>

  return (
    <Prompt open={open} onOpenChange={onOpenChange} variant="confirmation">
      {isLoading || !csvMetadata ? (
        <div className="flex justify-center items-center p-6">
          <Skeleton className="w-full h-12" />
        </div>
      ) : (
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
  const { setFileId: setMostRecentFileId } = useMostRecentUpload()
  const [selectedType, setSelectedType] = useState<DatasetType>(datasetType)

  const handleTypeSelection = async (selectedType: DatasetType) => {
    if (selectedType !== datasetType) {
      await updateDatasetType(selectedType)
    }
    setMostRecentFileId(null)
    onClose()
  }

  return (
    <Prompt.Content>
      <Prompt.Header>
        <Prompt.Title>Select File Type</Prompt.Title>
        <Prompt.Description>Choose the type of file to begin deduplication</Prompt.Description>
      </Prompt.Header>
      <div className="p-6">
        <FileTypeSelector selectedType={selectedType} onTypeSelect={setSelectedType} />
      </div>
      <Prompt.Footer>
        <Prompt.Cancel onClick={onClose}>Cancel</Prompt.Cancel>
        <Prompt.Action onClick={() => handleTypeSelection(selectedType)} disabled={!selectedType}>
          Start deduplication
        </Prompt.Action>
      </Prompt.Footer>
    </Prompt.Content>
  )
}
