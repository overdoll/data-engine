"use client"

import { useFiles } from "@/utils/api"

export function FileList() {
  const { data: files = [], isLoading } = useFiles()
  const handleFileClick = async (id: string) => {
    console.log(id)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
      {files.length === 0 ? (
        <p className="text-gray-500">No files uploaded yet</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              onClick={() => handleFileClick(file.id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
            >
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-gray-500">{new Date(file.uploadDate).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
