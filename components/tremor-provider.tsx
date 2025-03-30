"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function TremorProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  
  // Add a class to the html element for Tremor dark mode
  React.useEffect(() => {
    const root = window.document.documentElement
    const isDark = theme === 'dark' || resolvedTheme === 'dark'
    
    console.log("[TremorProvider] Current theme state:", { 
      theme, 
      resolvedTheme, 
      systemTheme, 
      isDark 
    })
    
    // Force add/remove dark class based on the resolved theme
    if (isDark) {
      console.log("[TremorProvider] Enabling dark mode for Tremor")
      root.classList.add('dark')
      // Add data attribute for backup
      root.setAttribute('data-theme', 'dark')
    } else {
      console.log("[TremorProvider] Disabling dark mode for Tremor")
      root.classList.remove('dark')
      // Add data attribute for backup
      root.setAttribute('data-theme', 'light')
    }
    
    // Force update any tremor elements
    const tremorElements = document.querySelectorAll('[class*="tremor-"]')
    console.log(`[TremorProvider] Found ${tremorElements.length} Tremor elements to update`)
    
    // Apply a small class toggle trick to force a repaint of Tremor elements
    tremorElements.forEach(el => {
      el.classList.add('tremor-force-update')
      setTimeout(() => {
        el.classList.remove('tremor-force-update')
      }, 10)
    })
  }, [theme, resolvedTheme, systemTheme])
  
  return <>{children}</>
} 