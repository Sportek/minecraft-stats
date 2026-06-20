import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TimeRangeType = "1 Day" | "1 Week" | "1 Month" | "6 Months" | "1 Year";

interface TimeRangeSelectProps {
  value: TimeRangeType;
  onChange: (value: TimeRangeType) => void;
  disabled: boolean;
}

const options: { value: TimeRangeType; label: string }[] = [
  { value: "1 Day", label: "24h" },
  { value: "1 Week", label: "7 days" },
  { value: "1 Month", label: "30 days" },
  { value: "6 Months", label: "6 months" },
  { value: "1 Year", label: "1 year" },
];

export const TimeRangeSelect = ({ value, onChange, disabled }: TimeRangeSelectProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimeRangeType)} disabled={disabled}>
      <SelectTrigger aria-label="Time range" className="h-9 w-auto min-w-28 bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
