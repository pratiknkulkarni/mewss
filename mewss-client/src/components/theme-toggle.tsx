"use client"

import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-8 w-full animate-pulse bg-muted rounded-md" />
  }

  return (
    <div className="flex items-center justify-between w-full select-none">
      <div className="flex items-center gap-2">
        <span className="text-sm">Theme</span>
      </div>

      {/* The toggle group */}
      <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted border border-border shrink-0">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setTheme("light")
          }}
          className={cn(
            "p-1.5 rounded-sm transition-all text-muted-foreground hover:text-foreground cursor-pointer",
            theme === "light" && "bg-background text-foreground shadow-sm"
          )}
          title="Light Mode"
        >
          <Sun className="size-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setTheme("system")
          }}
          className={cn(
            "p-1.5 rounded-sm transition-all text-muted-foreground hover:text-foreground cursor-pointer",
            theme === "system" && "bg-background text-foreground shadow-sm"
          )}
          title="System Default"
        >
          <Laptop className="size-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setTheme("dark")
          }}
          className={cn(
            "p-1.5 rounded-sm transition-all text-muted-foreground hover:text-foreground cursor-pointer",
            theme === "dark" && "bg-background text-foreground shadow-sm"
          )}
          title="Dark Mode"
        >
          <Moon className="size-3.5" />
        </button>
      </div>
    </div>
  )
}