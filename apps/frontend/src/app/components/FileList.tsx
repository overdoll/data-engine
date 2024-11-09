"use client"

import { useFiles } from "@/utils/api"
import { format } from "date-fns"

interface FileListProps {
  onFileSelect: (fileId: string) => void
}

export function FileList({ onFileSelect }: FileListProps) {
  const { data: files, isLoading } = useFiles()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col">
      {files?.map((file) => (
        <button
          key={file.id}
          onClick={() => onFileSelect(file.id)}
          className="animate-in fade-in-0 duration-200 py-1 px-3 text-center text-gray-500 hover:text-blue-500 flex items-center justify-between"
        >
          <span>{file.fileName}</span>
          <span className="ml-1 text-sm text-gray-400">
            {format(file.uploadDate, "MMM d, h:mm a")}
          </span>
        </button>
      ))}
      <p className="text-sm text-gray-400 mt-3 text-center">
        All data is automatically deleted after 24 hours
      </p>
    </div>
  )
}
