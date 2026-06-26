import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

export type TimeRangeType = "1 Day" | "1 Week" | "1 Month" | "6 Months" | "1 Year";

interface TimeRangeSelectProps {
  value: TimeRangeType;
  onChange: (value: TimeRangeType) => void;
  disabled: boolean;
}

const options: { value: TimeRangeType; key: string }[] = [
  { value: "1 Day", key: "1day" },
  { value: "1 Week", key: "1week" },
  { value: "1 Month", key: "1month" },
  { value: "6 Months", key: "6months" },
  { value: "1 Year", key: "1year" },
];

export const TimeRangeSelect = ({ value, onChange, disabled }: TimeRangeSelectProps) => {
  const t = useTranslations("Home");
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimeRangeType)} disabled={disabled}>
      <SelectTrigger aria-label={t("timeRangeSelect.ariaLabel")} className="h-9 w-auto min-w-28 bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {t(`timeRangeSelect.options.${opt.key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
