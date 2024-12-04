"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"

export function CrispProvider() {
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      ;(window as any).$crisp.push(["set", "user:email", [user.emailAddresses[0].emailAddress]])
    }
  }, [user])

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
              window.$crisp = [];
              window.CRISP_WEBSITE_ID = "c361ec23-1940-49ca-bf99-e8aae5b7ea93";
              (function() {
                const d = document;
                const s = d.createElement("script");
                s.src = "https://client.crisp.chat/l.js";
                s.async = 1;
                d.getElementsByTagName("head")[0].appendChild(s);
              })();
            `,
      }}
    />
  )
}
