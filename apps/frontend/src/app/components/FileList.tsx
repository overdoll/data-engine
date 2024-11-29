import { HeadingSkeleton } from "@/components/skeleton"
import { useFiles } from "@/utils/api"
import { format } from "date-fns"
import Link from "next/link"

export function FileList() {
  const { data: files, isLoading } = useFiles()

  if (isLoading)
    return Array.from({ length: 5 }).map((_, i) => <HeadingSkeleton characters={50} key={i} />)

  return (
    <div className="flex flex-col">
      {files?.map((file) => (
        <Link
          key={file.id}
          href={`/files/${file.id}`}
          className="animate-in fade-in-0 duration-200 py-1 px-3 text-center text-gray-500 hover:text-blue-500 flex items-center justify-between"
        >
          <span>{file.fileName}</span>
          <span className="ml-2 text-sm text-gray-400 hover:text-blue-500">
            {format(file.uploadDate, "MMM d, h:mm a")}
          </span>
        </Link>
      ))}
    </div>
  )
}
