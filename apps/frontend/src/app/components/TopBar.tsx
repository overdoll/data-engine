import { DatasetType } from "./DatasetType"
import { ExportDropdown } from "./ExportDropdown"
import { ModeToggle } from "./ModeToggle"
import { useCsvMetadata } from "@/utils/api"
import Head from "next/head"
import Link from "next/link"
import { Skeleton } from "@/components/skeleton"
import { UserButton } from "@clerk/nextjs"
import { StyledTopBar } from "../../components/topbar/top-bar"
import { Label } from "@/components/label/label"
import { Logo } from "./Logo"
import { useEffect } from "react"

export function TopBar({ fileId }: { fileId: string }) {
  const { data: metadata } = useCsvMetadata(fileId)

  useEffect(() => {
    if (metadata?.metadata.original_filename) {
      document.title = `wispbit - ${metadata.metadata.original_filename}`
    }
  }, [metadata?.metadata.original_filename])

  return (
    <>
      <Head>{metadata?.metadata.original_filename}</Head>
      <StyledTopBar>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <span className="text-gray-400">/</span>
          <Link href="/files">
            <Label className="font-normal text-base text-gray-500 hover:text-gray-700 cursor-pointer">
              Files
            </Label>
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
          <Skeleton className="h-7 w-10" />
        )}
      </StyledTopBar>
    </>
  )
}
