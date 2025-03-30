"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { AppSettings } from "@/types"

const defaultSettings: AppSettings = {
  alarmEnabled: true,
  alarmVolume: 0.7,
  notificationsEnabled: true,
  captureInterval: 1000, // 1 second
  autoStart: false,
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // Load settings from localStorage on initial render
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        // Fall back to default settings
        setSettings(defaultSettings)
      } finally {
        setIsInitialized(true)
      }
    }

    if (typeof window !== 'undefined') {
      loadSettings()
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('appSettings', JSON.stringify(settings))
    }
  }, [settings, isInitialized])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
} 