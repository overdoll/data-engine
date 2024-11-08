"use client"

import { useFiles } from "@/utils/api"

interface FileListProps {
  onFileSelect: (fileId: string) => void
}

export function FileList({ onFileSelect }: FileListProps) {
  const { data: files, isLoading } = useFiles()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-2">
      {files?.map((file) => (
        <button
          key={file.id}
          onClick={() => onFileSelect(file.id)}
          className="w-full p-2 text-left hover:bg-gray-100 rounded"
        >
          {file.fileName}
        </button>
      ))}
    </div>
  )
}
