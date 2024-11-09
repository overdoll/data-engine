import { Button } from "@/components/button"
import { useUploadFile } from "@/utils/api"

export function FileUpload() {
  const { mutateAsync, isPending } = useUploadFile()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const formData = new FormData()
    formData.append("file", e.target.files[0])

    await mutateAsync(formData)
  }

  return (
    <div className="flex items-center gap-4">
      <input type="file" onChange={handleUpload} className="hidden" id="file-upload" />
      <label htmlFor="file-upload">
        <Button size="large" disabled={isPending} asChild>
          <span>{isPending ? "Uploading..." : "Upload File"}</span>
        </Button>
      </label>
    </div>
  )
}
