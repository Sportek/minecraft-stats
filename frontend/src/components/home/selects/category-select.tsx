import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types/server";
import useSWRImmutable from "swr/immutable";

interface CategorySelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

const ALL_VALUE = "__all__";

export const CategorySelect = ({ value, onChange, disabled }: CategorySelectProps) => {
  const { data: categories } = useSWRImmutable<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  return (
    <Select
      value={value === null ? ALL_VALUE : String(value)}
      onValueChange={(v) => onChange(v === ALL_VALUE ? null : Number(v))}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Filter by category" className="h-9 w-auto min-w-[10rem] bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All categories</SelectItem>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={String(category.id)}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
