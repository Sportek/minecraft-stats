import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { Category } from "@/types/server";
import useSWR from "swr";

interface CategorySelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

export const CategorySelect = ({ value, onChange, disabled }: CategorySelectProps) => {
  const { data: categories } = useSWR<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  return (
    <select
      className="bg-zinc-100 dark:bg-zinc-800 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
    >
      <option value="">All categories</option>
      {categories?.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};
