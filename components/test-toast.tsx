"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function TestToast() {
  const { toast } = useToast()
  const [counter, setCounter] = useState(0)

  const showDefaultToast = () => {
    setCounter(prev => prev + 1)
    toast({
      title: `Default Toast ${counter}`,
      description: "This is a default toast notification",
    })
  }

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "Operation completed successfully",
      variant: "default",
    })
  }

  const showErrorToast = () => {
    toast({
      title: "Error!",
      description: "Something went wrong",
      variant: "destructive",
    })
  }

  const showToastWithAction = () => {
    toast({
      title: "Action Required",
      description: "Please confirm your choice",
      action: (
        <Button variant="outline" size="sm" onClick={() => console.log("Action clicked")}>
          Confirm
        </Button>
      ),
    })
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h2 className="text-xl font-bold">Toast Notification Test</h2>
      <div className="flex flex-wrap gap-4">
        <Button onClick={showDefaultToast}>Show Default Toast</Button>
        <Button onClick={showSuccessToast} className="bg-green-600 hover:bg-green-700">
          Show Success Toast
        </Button>
        <Button onClick={showErrorToast} variant="destructive">
          Show Error Toast
        </Button>
        <Button onClick={showToastWithAction} variant="outline">
          Toast with Action
        </Button>
      </div>
    </div>
  )
} 