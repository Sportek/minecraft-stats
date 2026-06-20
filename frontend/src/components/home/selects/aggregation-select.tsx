import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AggregationType = "30 Minutes" | "1 Hour" | "2 Hours" | "6 Hours" | "1 Day" | "1 Week";

interface AggregationSelectProps {
  value: AggregationType;
  onChange: (value: AggregationType) => void;
  disabled: boolean;
}

const options: { value: AggregationType; label: string }[] = [
  { value: "30 Minutes", label: "30 minutes" },
  { value: "1 Hour", label: "1 hour" },
  { value: "6 Hours", label: "6 hours" },
  { value: "1 Day", label: "1 day" },
];

export const AggregationSelect = ({ value, onChange, disabled }: AggregationSelectProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AggregationType)} disabled={disabled}>
      <SelectTrigger aria-label="Data aggregation interval" className="h-9 w-auto min-w-28 bg-secondary text-sm">
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
