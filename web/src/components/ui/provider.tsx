"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { useMemo, useState, useEffect, useCallback } from "react"
import { createTelegramSystem, isDarkMode } from "../../theme"

export function Provider({ children }: { children: React.ReactNode }) {
  const getParams = useCallback(() => {
    try {
      return window.Telegram.WebApp.themeParams
    } catch {
      return {}
    }
  }, [])

  const [themeParams, setThemeParams] = useState<Record<string, string>>(getParams)

  useEffect(() => {
    const handler = () => setThemeParams({ ...window.Telegram.WebApp.themeParams })
    window.Telegram.WebApp.onEvent("themeChanged", handler)
    return () => window.Telegram.WebApp.offEvent("themeChanged", handler)
  }, [])

  const dark = isDarkMode(themeParams.bg_color)
  const colorMode = dark ? "dark" as const : "light" as const

  const system = useMemo(() => createTelegramSystem(themeParams), [themeParams])

  return <ChakraProvider value={system} colorMode={colorMode}>{children}</ChakraProvider>
}
