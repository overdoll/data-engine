import { Label } from "@radix-ui/react-dropdown-menu"
import { DatasetType } from "./DatasetType"
import { ExportDropdown } from "./ExportDropdown"
import { ModeToggle } from "./ModeToggle"
import { useCsvMetadata } from "@/utils/api"
import Head from "next/head"
import Link from "next/link"

export function TopBar({ fileId }: { fileId: string }) {
  const { data: metadata } = useCsvMetadata(fileId)

  if (!metadata) return <></>
  return (
    <>
      <Head>{metadata?.metadata.original_filename}</Head>
      <div className="w-full border-b px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DatasetType datasetType={metadata.metadata.dataset_type} />
          <span className="text-gray-400">/</span>
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <span>Files</span>
          </Link>
          <span className="text-gray-400">/</span>
          <Label>{metadata.metadata.original_filename}</Label>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <ExportDropdown fileName={metadata.metadata.original_filename} />
        </div>
      </div>
    </>
  )
}
