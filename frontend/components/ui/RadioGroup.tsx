import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({ name, options, value, onChange, className }: RadioGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center gap-2 cursor-pointer select-none",
            option.disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-4.5 w-4.5 border-border bg-zinc-950/40 text-primary focus:ring-ring focus:ring-offset-background"
          />
          <span className="text-sm font-medium text-foreground">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
export default RadioGroup;
