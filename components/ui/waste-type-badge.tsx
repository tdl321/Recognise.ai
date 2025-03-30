import { Badge } from "@/components/ui/badge"

interface WasteTypeBadgeProps {
  wasteType: string
  size?: "default" | "sm"
}

const wasteTypeColors: Record<string, { bg: string, text: string }> = {
  plastic: { bg: "bg-blue-100", text: "text-blue-700" },
  paper: { bg: "bg-yellow-100", text: "text-yellow-800" },
  glass: { bg: "bg-green-100", text: "text-green-700" },
  metal: { bg: "bg-gray-100", text: "text-gray-700" },
  organic: { bg: "bg-emerald-100", text: "text-emerald-700" },
  ewaste: { bg: "bg-purple-100", text: "text-purple-700" },
  mixed: { bg: "bg-orange-100", text: "text-orange-700" },
  // Fallback for unknown types
  default: { bg: "bg-slate-100", text: "text-slate-700" }
}

export function WasteTypeBadge({ wasteType, size = "default" }: WasteTypeBadgeProps) {
  const type = wasteType.toLowerCase();
  const { bg, text } = wasteTypeColors[type] || wasteTypeColors.default;
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);
  
  return (
    <Badge 
      variant="outline" 
      className={`${bg} ${text} border-transparent font-medium ${size === "sm" ? "text-xs py-0 px-1.5" : ""}`}
    >
      {displayName}
    </Badge>
  );
} 