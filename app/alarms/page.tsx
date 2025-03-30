"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BellRing, Volume2, Play, Pause, Upload, Trash2, Save, Music, AlertTriangle } from "lucide-react"

export default function AlarmsPage() {
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmType, setAlarmType] = useState("bell")
  const [volume, setVolume] = useState(70)
  const [duration, setDuration] = useState(5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [incorrectThreshold, setIncorrectThreshold] = useState(3)
  const [customAlarms, setCustomAlarms] = useState([
    { id: "alarm1", name: "Fire Alarm", file: null },
    { id: "alarm2", name: "School Bell", file: null },
  ])

  const handlePlaySound = () => {
    setIsPlaying(true)
    setTimeout(() => setIsPlaying(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alarm Settings</h1>
          <p className="text-muted-foreground">Configure alerts for incorrect waste disposal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]">
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Alarm Configuration</CardTitle>
              <CardDescription>Set up alerts for incorrect disposals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="alarm-enabled">Enable Alarms</Label>
                  <p className="text-sm text-muted-foreground">Trigger alerts when incorrect disposals are detected</p>
                </div>
                <Switch id="alarm-enabled" checked={alarmEnabled} onCheckedChange={setAlarmEnabled} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alarm-type">Alarm Sound</Label>
                <Select value={alarmType} onValueChange={setAlarmType}>
                  <SelectTrigger id="alarm-type">
                    <SelectValue placeholder="Select alarm sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="siren">Siren</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom Sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volume">Volume</Label>
                  <span className="text-sm">{volume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    id="volume"
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <span className="text-sm">{duration}s</span>
                </div>
                <Slider
                  id="duration"
                  value={[duration]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setDuration(value[0])}
                />
              </div>

              <Button
                onClick={handlePlaySound}
                className="w-full bg-[#8cb9a3] hover:bg-[#7aa08a]"
                disabled={!alarmEnabled}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    <span>Playing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    <span>Test Alarm</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Custom Alarm Sounds</CardTitle>
              <CardDescription>Upload and manage custom MP3 files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Upload MP3 File</Label>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Browse</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customAlarms.map((alarm) => (
                  <div key={alarm.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span className="font-medium">{alarm.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Trigger Settings</CardTitle>
              <CardDescription>Configure when alarms should be triggered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Incorrect Disposal Threshold</Label>
                <p className="text-sm text-muted-foreground">Number of incorrect disposals before triggering alarm</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIncorrectThreshold(Math.max(1, incorrectThreshold - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={incorrectThreshold}
                    onChange={(e) => setIncorrectThreshold(Number.parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIncorrectThreshold(Math.min(10, incorrectThreshold + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Trigger Conditions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Any incorrect disposal</span>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Multiple incorrect disposals</span>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <span>Low confidence detections</span>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notification Methods</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4" />
                      <span>Sound Alarm</span>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Visual Alert</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Recent Alarm Events</CardTitle>
              <CardDescription>History of triggered alarms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {[
                  { time: "10:42 AM", type: "Plastic in Paper", zone: "Zone 1" },
                  { time: "09:15 AM", type: "Metal in Plastic", zone: "Zone 2" },
                  { time: "Yesterday, 4:30 PM", type: "Paper in Glass", zone: "Zone 1" },
                  { time: "Yesterday, 2:15 PM", type: "Plastic in Metal", zone: "Zone 3" },
                  { time: "Mar 29, 11:20 AM", type: "Glass in Paper", zone: "Zone 2" },
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium">{event.type}</span>
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.zone}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}