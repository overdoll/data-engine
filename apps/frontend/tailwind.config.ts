import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import { FONT_FAMILY_MONO } from "./src/ui-preset/constants"
import { FONT_FAMILY_SANS } from "./src/ui-preset/constants"
import { theme } from "./src/ui-preset/theme/extension/theme"
import { typography } from "./src/ui-preset/theme/tokens/typography"
import { colors } from "./src/ui-preset/theme/tokens/colors"
import { effects } from "./src/ui-preset/theme/tokens/effects"
import plugin from "tailwindcss/plugin"
import { components } from "./src/ui-preset/theme/tokens/components"

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: ["class", '[data-mode="dark"]'],
  plugins: [
    plugin(function medusaUi({ addBase, addComponents, config }) {
      const [darkMode, className = ".dark"] = ([] as string[]).concat(config("darkMode", "media"))

      addBase({
        "*": {
          borderColor: "var(--border-base)",
        },
      })

      addComponents(typography)

      addBase({
        ":root": { ...colors.light, ...effects.light },
        ...components.light,
      })

      if (darkMode === "class") {
        addBase({
          [className]: { ...colors.dark, ...effects.dark },
        })
      } else {
        addBase({
          "@media (prefers-color-scheme: dark)": {
            ":root": { ...colors.dark, ...effects.dark },
            ...components.dark,
          },
        })
      }
    }),
    animate,
  ],
  theme: {
    extend: {
      ...theme.extend,
      fontFamily: {
        sans: FONT_FAMILY_SANS,
        mono: FONT_FAMILY_MONO,
      },
      transitionProperty: {
        fg: "color, background-color, border-color, box-shadow, opacity",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0px" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0px" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
}
export default config
