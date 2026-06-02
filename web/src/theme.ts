import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

function isDarkMode(bgColor: string | undefined): boolean {
  if (!bgColor) return false
  const hex = bgColor.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness < 128
}

export function createTelegramSystem(themeParams: Record<string, string>) {
  const p = themeParams
  const dark = isDarkMode(p.bg_color)

  const config = defineConfig({
    globalCss: {
      "html, body": {
        backgroundColor: p.secondary_bg_color || (dark ? "#1c1c1e" : "#f4f4f5"),
        color: p.text_color || (dark ? "#ffffff" : "#000000"),
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
          "bg.default": {
            value: p.bg_color || (dark ? "#000000" : "#ffffff"),
          },
          "bg.subtle": {
            value: p.secondary_bg_color || (dark ? "#1c1c1e" : "#f4f4f5"),
          },
          "bg.muted": {
            value: p.section_bg_color || p.secondary_bg_color || (dark ? "#1c1c1e" : "#f4f4f5"),
          },
          "bg.emphasized": {
            value: p.header_bg_color || p.bg_color || (dark ? "#000000" : "#ffffff"),
          },
          "fg.default": {
            value: p.text_color || (dark ? "#ffffff" : "#000000"),
          },
          "fg.muted": {
            value: p.hint_color || (dark ? "#8e8e93" : "#707579"),
          },
          "fg.subtle": {
            value: p.subtitle_text_color || (dark ? "#8e8e93" : "#707579"),
          },
          "accent.default": { value: p.button_color || "#3390ec" },
          "accent.fg": { value: p.button_text_color || "#ffffff" },
          "accent.text": { value: p.accent_text_color || "#3390ec" },
          "accent.link": {
            value: p.link_color || (dark ? "#5ac8fa" : "#00488f"),
          },
          "border.default": {
            value: p.section_separator_color || (dark ? "#38383a" : "#e7e7e7"),
          },
          "border.muted": {
            value: p.section_separator_color || (dark ? "#38383a" : "#e7e7e7"),
          },
          "danger.default": { value: p.destructive_text_color || "#df3f40" },
          "bottomBar.bg": {
            value:
              p.bottom_bar_bg_color ||
              p.bg_color ||
              (dark ? "#000000" : "#ffffff"),
          },
        },
      },
    },
  })

  return createSystem(defaultConfig, config)
}
