"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Volume2, Play, Pause } from "lucide-react"
import { useAudioContext, SoundType, SoundChoice } from "@/lib/audioContext"

interface SoundSettingsProps {
  className?: string;
  showCard?: boolean;
}

export function SoundSettings({ className = "", showCard = true }: SoundSettingsProps) {
  const { settings, updateSettings, playSound } = useAudioContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [testSound, setTestSound] = useState<SoundType>('incorrect');

  // Play a test sound
  const handlePlaySound = () => {
    setIsPlaying(true);
    playSound(testSound);
    
    // Reset after a short delay
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  // Render the settings either in a card or as plain content
  const settingsContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="sound-enabled">Enable Sound Alerts</Label>
          <p className="text-sm text-muted-foreground">
            Play sounds for correct and incorrect waste disposal
          </p>
        </div>
        <Switch 
          id="sound-enabled" 
          checked={settings.enabled} 
          onCheckedChange={(enabled) => updateSettings({ enabled })} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sound-type">Alert Sound Type</Label>
        <Select 
          value={settings.choice} 
          onValueChange={(choice) => updateSettings({ choice: choice as SoundChoice })}
          disabled={!settings.enabled}
        >
          <SelectTrigger id="sound-type">
            <SelectValue placeholder="Select sound type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bell">Bell</SelectItem>
            <SelectItem value="chime">Chime</SelectItem>
            <SelectItem value="alert">Alert</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="funny">Funny Sounds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="volume">Volume</Label>
          <span className="text-sm">{Math.round(settings.volume * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            id="volume"
            value={[settings.volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => updateSettings({ volume: value[0] / 100 })}
            className="flex-1"
            disabled={!settings.enabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-sound">Test Sound</Label>
        <Select 
          value={testSound} 
          onValueChange={(value) => setTestSound(value as SoundType)}
          disabled={!settings.enabled}
        >
          <SelectTrigger id="test-sound">
            <SelectValue placeholder="Select sound to test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="correct">Correct Disposal</SelectItem>
            <SelectItem value="incorrect">Incorrect Disposal</SelectItem>
            <SelectItem value="warning">Warning Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handlePlaySound}
        className="w-full bg-[#8cb9a3] hover:bg-[#7aa08a]"
        disabled={!settings.enabled || isPlaying}
      >
        {isPlaying ? (
          <>
            <Pause className="h-4 w-4 mr-2" />
            <span>Playing...</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            <span>Test Sound</span>
          </>
        )}
      </Button>
    </div>
  );

  // If showCard is true, wrap in a Card component, otherwise return just the content
  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Sound Alerts</CardTitle>
          <CardDescription>Configure audio notifications for waste detection</CardDescription>
        </CardHeader>
        <CardContent>
          {settingsContent}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{settingsContent}</div>;
} 