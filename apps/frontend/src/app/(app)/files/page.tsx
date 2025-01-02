"use client"

import { FileBrowser } from "../../components/FileBrowser"
import { Label } from "@/components/label"
import { RedirectToSignIn, SignedOut, UserButton } from "@clerk/nextjs"
import { SignedIn } from "@clerk/nextjs"
import { StyledTopBar } from "@/components/topbar/top-bar"
import { Logo } from "../../components/Logo"
import { SubscriptionStatusBadge } from "../../components/SubscriptionStatusBadge"

export default function Home() {
  return (
    <>
      <SignedIn>
        <StyledTopBar>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-gray-400">/</span>
            <Label className="font-normal text-base">Files</Label>
          </div>
          <div className="flex items-center gap-2">
            <SubscriptionStatusBadge />
            <UserButton />
          </div>
        </StyledTopBar>
        <FileBrowser />
      </SignedIn>
    </>
  )
}
