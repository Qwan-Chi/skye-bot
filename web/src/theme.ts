import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  globalCss: {
    "html, body": {
      backgroundColor: "var(--tg-theme-bg-color)",
      color: "var(--tg-theme-text-color)",
    },
    "::-webkit-scrollbar": {
      width: "0px",
      background: "transparent",
    },
  },
  theme: {
    tokens: {
      radii: {
        sm: { value: "6px" },
        md: { value: "10px" },
        lg: { value: "12px" },
        xl: { value: "16px" },
        "2xl": { value: "20px" },
        full: { value: "9999px" },
      },
    },
    semanticTokens: {
      colors: {
        "bg.default": { value: "var(--tg-theme-bg-color)" },
        "bg.subtle": { value: "var(--tg-theme-secondary-bg-color)" },
        "bg.muted": { value: "var(--tg-theme-section-bg-color)" },
        "bg.emphasized": { value: "var(--tg-theme-header-bg-color)" },
        "fg.default": { value: "var(--tg-theme-text-color)" },
        "fg.muted": { value: "var(--tg-theme-hint-color)" },
        "fg.subtle": { value: "var(--tg-theme-subtitle-text-color)" },
        "accent.default": { value: "var(--tg-theme-button-color)" },
        "accent.fg": { value: "var(--tg-theme-button-text-color)" },
        "accent.text": { value: "var(--tg-theme-accent-text-color)" },
        "accent.link": { value: "var(--tg-theme-link-color)" },
        "border.default": { value: "var(--tg-theme-section-separator-color)" },
        "border.muted": { value: "var(--tg-theme-section-separator-color)" },
        "danger.default": { value: "var(--tg-theme-destructive-text-color)" },
        "bottomBar.bg": { value: "var(--tg-theme-bottom-bar-bg-color)" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
