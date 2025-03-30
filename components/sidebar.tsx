"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Camera,
  BarChart3,
  Layers,
  Bell,
  Settings,
  MoreHorizontal,
} from "lucide-react"

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  },
  {
    name: "Detection",
    href: "/detection",
    icon: Camera
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3
  },
  {
    name: "Zones",
    href: "/zones",
    icon: Layers
  },
  {
    name: "Alarms",
    href: "/alarms",
    icon: Bell
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen w-16 md:w-64 border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="hidden md:flex flex-col">
          <h1 className="text-xl font-bold">Disposify</h1>
          <p className="text-xs text-muted-foreground">Waste Detection System</p>
        </div>
        <div className="md:hidden flex justify-center">
          <div className="h-8 w-8 bg-[#8cb9a3] rounded-md"></div>
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="hidden md:inline-flex">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto border-t">
        <div className="flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-xs font-medium">System Status</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <button className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 