import type { Config } from "tailwindcss"
import medusaUi from "./src/ui-preset/plugin"
import animate from "tailwindcss-animate"

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: ["class", '[data-mode="dark"]'],
  plugins: [medusaUi, animate],
}
export default config
