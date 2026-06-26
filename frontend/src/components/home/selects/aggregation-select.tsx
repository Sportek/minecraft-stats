import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

export type AggregationType = "30 Minutes" | "1 Hour" | "2 Hours" | "6 Hours" | "1 Day" | "1 Week";

interface AggregationSelectProps {
  value: AggregationType;
  onChange: (value: AggregationType) => void;
  disabled: boolean;
}

const options: { value: AggregationType; key: string }[] = [
  { value: "30 Minutes", key: "30min" },
  { value: "1 Hour", key: "1hour" },
  { value: "6 Hours", key: "6hours" },
  { value: "1 Day", key: "1day" },
];

export const AggregationSelect = ({ value, onChange, disabled }: AggregationSelectProps) => {
  const t = useTranslations("Home");
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AggregationType)} disabled={disabled}>
      <SelectTrigger aria-label={t("aggregationSelect.ariaLabel")} className="h-9 w-auto min-w-28 bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {t(`aggregationSelect.options.${opt.key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
