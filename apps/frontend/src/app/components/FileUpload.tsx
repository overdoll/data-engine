import { FileUpload as FileUploadComponent } from "@/components/file-upload"
import { useUploadFile } from "@/utils/api"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMostRecentUpload } from "@/stores/mostRecentUpload"
import { toast } from "@/utils/toast"
import { isAxiosError } from "axios"

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
            router.push(`/files/${response.id}`)
          },
          onError: (error) => {
            if (isAxiosError(error)) {
              const err = error.response?.data.error
              if (err) {
                toast.error(err)
              } else {
                toast.error("An unknown error occurred")
              }
            }
          },
        })
      }}
    />
  )
}
