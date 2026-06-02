import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  globalCss: {
    "html, body": {
      backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
      color: "var(--tg-theme-text-color, #000000)",
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
        "bg.default": { value: "var(--tg-theme-bg-color, #ffffff)" },
        "bg.subtle": { value: "var(--tg-theme-secondary-bg-color, #f1f3f5)" },
        "bg.muted": { value: "var(--tg-theme-section-bg-color, #ffffff)" },
        "bg.emphasized": { value: "var(--tg-theme-header-bg-color, #ffffff)" },
        "fg.default": { value: "var(--tg-theme-text-color, #000000)" },
        "fg.muted": { value: "var(--tg-theme-hint-color, #999999)" },
        "fg.subtle": { value: "var(--tg-theme-subtitle-text-color, #707579)" },
        "accent.default": { value: "var(--tg-theme-button-color, #3390ec)" },
        "accent.fg": { value: "var(--tg-theme-button-text-color, #ffffff)" },
        "accent.text": { value: "var(--tg-theme-accent-text-color, #168acd)" },
        "accent.link": { value: "var(--tg-theme-link-color, #168acd)" },
        "border.default": { value: "var(--tg-theme-section-separator-color, #e7e7e7)" },
        "border.muted": { value: "var(--tg-theme-section-separator-color, #e7e7e7)" },
        "danger.default": { value: "var(--tg-theme-destructive-text-color, #d14e4e)" },
        "bottomBar.bg": { value: "var(--tg-theme-bottom-bar-bg-color, #ffffff)" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
