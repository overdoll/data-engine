import { useUploadFile } from "@/utils/api"
import { FileUpload as FileUploadComponent } from "@/components/file-upload"

export function FileUpload() {
  const { mutate, error } = useUploadFile()

  return (
    <div className="flex items-center gap-4 w-[300px]">
      <FileUploadComponent
        hasError={!!error}
        label="Upload File"
        formats={["csv"]}
        onUploaded={(files) => {
          const formData = new FormData()
          formData.append("file", files[0].file)
          mutate(formData)
        }}
      />
    </div>
  )
}
