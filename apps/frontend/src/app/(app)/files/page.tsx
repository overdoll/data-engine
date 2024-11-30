"use client"

import { FileList } from "../../components/FileList"
import { Label } from "@/components/label"
import { FileUpload } from "../../components/FileUpload"
import { RedirectToSignIn, SignedOut, UserButton, useUser } from "@clerk/nextjs"
import { SignedIn } from "@clerk/nextjs"
import { StyledTopBar } from "@/components/topbar/top-bar"
import { Heading } from "@/components/heading"
import { DataDeletionNotice } from "../../components/DataDeletionNotice"

export default function Home() {
  const { user } = useUser()
  const firstName = user?.firstName || "there"

  return (
    <>
      <SignedIn>
        <StyledTopBar>
          <Label className="font-normal text-base">Data Merge Tool</Label>
          <UserButton />
        </StyledTopBar>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2 min-h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center">
            <div className="max-w-md w-full space-y-4">
              <Heading className="text-center">Hey {firstName}! ✨</Heading>
              <Label className="text-center block text-gray-600">
                Upload your CSV files to get started with data merging
              </Label>
              <FileUpload />
              <DataDeletionNotice />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-hidden">
            <FileList />
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
