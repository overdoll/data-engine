"use client"
import { useEffect } from "react"

export function ScrollHandler() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("/#")) {
        e.preventDefault()
        const id = target.getAttribute("href")?.replace("/#", "")
        const element = document.getElementById(id!)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
