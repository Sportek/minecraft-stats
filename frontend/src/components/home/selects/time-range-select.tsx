export type TimeRangeType = "1 Day" | "1 Week" | "1 Month" | "6 Months" | "1 Year";

interface TimeRangeSelectProps {
  value: TimeRangeType;
  onChange: (value: TimeRangeType) => void;
  disabled: boolean;
}

export const TimeRangeSelect = ({ value, onChange, disabled }: TimeRangeSelectProps) => {
  return (
    <select
      className="bg-zinc-100 dark:bg-zinc-800 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRangeType)}
      disabled={disabled}
    >
      <option value="1 Day">24h</option>
      <option value="1 Week">7 days</option>
      <option value="1 Month">30 days</option>
      <option value="6 Months">6 months</option>
      <option value="1 Year">1 year</option>
    </select>
  );
}; 