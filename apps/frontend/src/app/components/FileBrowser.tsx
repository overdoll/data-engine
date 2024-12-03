import { useFiles } from "@/utils/api"
import { format } from "date-fns"
import Link from "next/link"
import { Label } from "@/components/label"
import { DataDeletionNotice } from "./DataDeletionNotice"
import { Heading } from "@/components/heading"
import { FileUpload } from "./FileUpload"
import { useUser } from "@clerk/nextjs"
import FileBrowserSkeleton from "./FileBrowserSkeleton"
import { Alert } from "@/components/alert"
import { UpgradeButton } from "./UpgradeButton"

export function FileBrowser() {
  const { data: files, isLoading } = useFiles()

  const { user } = useUser()
  const isPaid = user?.publicMetadata?.is_paid

  const firstName = user?.firstName || "there"
  const overFileLimit = files?.length && files.length >= 3 && !isPaid

  if (isLoading) return <FileBrowserSkeleton />

  return (
    <div
      className={`grid grid-cols-1 ${
        files?.length ? "md:grid-cols-[1fr_0.85fr]" : ""
      } gap-8 py-3 px-2 h-[calc(100vh-55px)]`}
    >
      {!overFileLimit ? (
        <div className="flex flex-col items-center justify-center">
          <div className="max-w-md w-full mx-auto space-y-4 relative">
            <Heading className="text-center">Hey {firstName}! ✨</Heading>
            <Label className="text-center block text-gray-600">
              Upload your CSV file to get started
            </Label>
            <div>
              <FileUpload />
            </div>
          </div>
          <DataDeletionNotice />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="max-w-md w-full mx-auto space-y-4 relative">
            <Heading className="text-center">Hey {firstName}! ✨</Heading>
            <Label className="text-center block text-gray-600">
              Looks like you&apos;ve hit the file limit. Upgrade to upload more files.
            </Label>
            <div className="flex justify-center">
              <UpgradeButton />
            </div>
          </div>
        </div>
      )}
      {files && files.length > 0 && (
        <div className="flex flex-col w-full my-auto items-center">
          <Heading className="px-4 text-center">Your files 📄</Heading>
          <div className="overflow-y-auto gap-2 m-2">
            {files.map((file) => (
              <Link
                key={file.uuid}
                href={`/files/${file.uuid}`}
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
      )}
    </div>
  )
}
