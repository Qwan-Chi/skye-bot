"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { useMemo, useState, useEffect, useCallback } from "react"
import { createTelegramSystem } from "../../theme"

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

  const system = useMemo(() => createTelegramSystem(themeParams), [themeParams])

  return <ChakraProvider value={system}>{children}</ChakraProvider>
}
