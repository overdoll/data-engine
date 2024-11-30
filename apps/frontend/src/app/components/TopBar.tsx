import { DatasetType } from "./DatasetType"
import { ExportDropdown } from "./ExportDropdown"
import { ModeToggle } from "./ModeToggle"
import { useCsvMetadata } from "@/utils/api"
import Head from "next/head"
import Link from "next/link"
import ArrowLeft from "@/icons/arrow-left"
import { Skeleton } from "@/components/skeleton"
import { UserButton } from "@clerk/nextjs"
import { StyledTopBar } from "../../components/topbar/top-bar"
import { Label } from "@/components/label/label"

export function TopBar({ fileId }: { fileId: string }) {
  const { data: metadata } = useCsvMetadata(fileId)

  return (
    <>
      <Head>{metadata?.metadata.original_filename}</Head>
      <StyledTopBar>
        <div className="flex items-center gap-2">
          <Link
            href="/files"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 w-[115px] font-normal text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to files</span>
          </Link>
          <span className="text-gray-400">/</span>
          {metadata && (
            <Label className="font-normal text-base">{metadata.metadata.original_filename}</Label>
          )}
        </div>

        {metadata ? (
          <div className="flex items-center gap-2">
            <DatasetType datasetType={metadata.metadata.dataset_type} />
            <ModeToggle />
            <ExportDropdown fileName={metadata.metadata.original_filename} />
            <UserButton />
          </div>
        ) : (
          <Skeleton className="h-7 w-full" />
        )}
      </StyledTopBar>
    </>
  )
}
