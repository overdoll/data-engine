import { StorybookConfig } from "@storybook/nextjs"

import path from "path"

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  framework: "@storybook/nextjs",
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-styling",
  ],
  webpackFinal: async (config: any) => {
    config.resolve.alias["@/components"] = path.resolve(__dirname, "../src/components")
    config.resolve.alias["@/hooks"] = path.resolve(__dirname, "../src/hooks")
    config.resolve.alias["@/icons"] = path.resolve(__dirname, "../src/icons")
    config.resolve.alias["@/utils"] = path.resolve(__dirname, "../src/utils")
    return config
  },
}

export default config
