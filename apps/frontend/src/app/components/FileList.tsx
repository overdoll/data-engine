"use client"

import { useFiles } from "@/utils/api"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

export function FileList() {
  const router = useRouter()
  const { data: files, isLoading } = useFiles()

  if (isLoading) {
    return <div>Loading...</div>
  }

  const handleFileSelect = (fileId: string) => {
    router.push(`/files/${fileId}`)
  }

  return (
    <div className="flex flex-col">
      {files?.map((file) => (
        <button
          key={file.friendlyId}
          onClick={() => handleFileSelect(file.friendlyId)}
          className="animate-in fade-in-0 duration-200 py-1 px-3 text-center text-gray-500 hover:text-blue-500 flex items-center justify-between"
        >
          <span>{file.fileName}</span>
          <span className="ml-2 text-sm text-gray-400 hover:text-blue-500">
            {format(file.uploadDate, "MMM d, h:mm a")}
          </span>
        </button>
      ))}
    </div>
  )
}
