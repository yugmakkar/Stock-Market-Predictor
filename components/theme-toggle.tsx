"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "light" | "dark"
const STORAGE_KEY = "bsp-theme"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    let initial: Theme
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      initial = saved ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    } catch {
      initial = "dark"
    }
    // Resolve theme from localStorage/matchMedia only after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial)
  }, [])

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="grid h-10 w-10 place-items-center rounded-full hairline"
      style={{ background: "var(--glass-bg)", color: "var(--ink)" }}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
