import { HeadingSkeleton } from "@/components/skeleton"
import { useFiles } from "@/utils/api"
import { format } from "date-fns"
import Link from "next/link"
import { Label } from "@/components/label"

export function FileList() {
  const { data: files, isLoading } = useFiles()

  if (isLoading)
    return Array.from({ length: 5 }).map((_, i) => <HeadingSkeleton characters={50} key={i} />)

  if (!files?.length) {
    return <div className="text-center text-gray-500 py-4">No files uploaded yet</div>
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-4 px-3 py-2 border-b border-gray-200">
        <Label className="font-medium">Filename</Label>
        <Label className="font-medium text-right">Uploaded</Label>
      </div>
      <div className="overflow-y-auto max-h-[60vh]">
        {files.map((file) => (
          <Link
            key={file.id}
            href={`/files/${file.id}`}
            className="animate-in fade-in-0 duration-200 py-2 px-3 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded grid grid-cols-2 gap-4"
          >
            <span className="truncate">{file.original_filename}</span>
            <span className="text-sm text-gray-400 text-right">
              {file.created_at
                ? format(new Date(file.created_at), "MMM d, h:mm a")
                : "Unknown date"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
