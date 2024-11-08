import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import { theme } from "./src/theme/extension/theme"
import { typography } from "./src/theme/tokens/typography"
import { colors } from "./src/theme/tokens/colors"
import { effects } from "./src/theme/tokens/effects"
import plugin from "tailwindcss/plugin"
import { components } from "./src/theme/tokens/components"
import { fontFamily } from "tailwindcss/defaultTheme"

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
        sans: ["Inter", ...fontFamily.sans],
        mono: ["Roboto Mono", ...fontFamily.mono],
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
