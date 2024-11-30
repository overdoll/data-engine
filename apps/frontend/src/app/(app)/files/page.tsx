"use client"

import { FileList } from "../../components/FileList"
import { Label } from "@/components/label"
import { FileUpload } from "../../components/FileUpload"
import { RedirectToSignIn, SignedOut, UserButton } from "@clerk/nextjs"
import { SignedIn } from "@clerk/nextjs"
import { StyledTopBar } from "@/components/topbar/top-bar"

export default function Home() {
  return (
    <>
      <SignedIn>
        <StyledTopBar>
          <Label className="font-normal text-base">Data Merge Tool</Label>
          <UserButton />
        </StyledTopBar>
        <div className="flex flex-col gap-3 items-center justify-center min-h-screen">
          <FileUpload />
          <FileList />
          <Label size="xsmall" className="text-gray-400 text-center">
            All data is automatically deleted after 24 hours
          </Label>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
