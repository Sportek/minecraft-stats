export type AggregationType = "30 Minutes" | "1 Hour" | "2 Hours" | "6 Hours" | "1 Day" | "1 Week";

interface AggregationSelectProps {
  value: AggregationType;
  onChange: (value: AggregationType) => void;
  disabled: boolean;
}

export const AggregationSelect = ({ value, onChange, disabled }: AggregationSelectProps) => {
  return (
    <select
      className="bg-zinc-100 dark:bg-zinc-800 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value as AggregationType)}
      disabled={disabled}
    >
      <option value="30 Minutes">30 minutes</option>
      <option value="1 Hour">1 hour</option>
      <option value="6 Hours">6 hours</option>
      <option value="1 Day">1 day</option>
    </select>
  );
}; 