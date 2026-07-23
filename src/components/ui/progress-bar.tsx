import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({ value, max = 100, showLabel = true, size = "md", className }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{value} / {max}</span>
          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full", sizes[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-300",
            sizes[size],
            percentage >= 100 ? "bg-green-600" : percentage >= 75 ? "bg-blue-600" : "bg-blue-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
