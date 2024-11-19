import { FileUpload as FileUploadComponent } from "@/components/file-upload"
import { useUploadFile } from "@/utils/api"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"

export function FileUpload() {
  const router = useRouter()
  const { mutate, isPending } = useUploadFile()
  const [pendingFile, setPendingFile] = useState<string | undefined>(undefined)
  const setMostRecentFileId = useMostRecentUpload((state) => state.setFileId)

  return (
    <FileUploadComponent
      label="Upload File"
      formats={["csv"]}
      pendingFile={isPending ? pendingFile : undefined}
      onUploaded={(files) => {
        const file = files[0].file
        setPendingFile(file.name)

        const formData = new FormData()
        formData.append("file", file)

        mutate(formData, {
          onSuccess: (response) => {
            setPendingFile(undefined)
            setMostRecentFileId(response.id)
            router.push(`/files/${response.friendlyId}`)
          },
        })
      }}
    />
  )
}
