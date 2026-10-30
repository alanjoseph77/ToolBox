import { Wrench } from "lucide-react";
import { categoryStyle, toolIcons } from "@/lib/icons";
import type { ToolMeta } from "@/lib/tools";

export default function ToolIcon({ tool, size = "md" }: { tool: ToolMeta; size?: "md" | "lg" }) {
  const Icon = toolIcons[tool.slug] ?? Wrench;
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-xl";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${categoryStyle[tool.category].tile}`}>
      <Icon className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} strokeWidth={2} aria-hidden />
    </span>
  );
}
