"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function TremorProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  
  // Simplified theme monitoring for Tremor charts
  React.useEffect(() => {
    // Basic logging for debugging
    console.log("[TremorProvider] Current theme:", resolvedTheme)
    
    // We don't need to manually add/remove classes as next-themes handles this
    // Just ensure any Tremor components that need forced updates get them
    const refreshTremorComponents = () => {
      const tremorElements = document.querySelectorAll('[class*="tremor-"]')
      if (tremorElements.length > 0) {
        console.log(`[TremorProvider] Refreshing ${tremorElements.length} Tremor components`)
        // Force a style recalculation by accessing offsetHeight
        tremorElements.forEach(el => {
          // This triggers a reflow without adding/removing classes
          void (el as HTMLElement).offsetHeight
        })
      }
    }
    
    // Initial refresh
    setTimeout(refreshTremorComponents, 100)
    
    // Listen for theme changes
    window.addEventListener('themechange', refreshTremorComponents)
    
    // Cleanup
    return () => {
      window.removeEventListener('themechange', refreshTremorComponents)
    }
  }, [resolvedTheme])
  
  return <>{children}</>
} 