import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { Language } from "@/types/server";
import useSWRImmutable from "swr/immutable";

interface LanguageSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

export const LanguageSelect = ({ value, onChange, disabled }: LanguageSelectProps) => {
  const { data: languages } = useSWRImmutable<Language[]>(`${getBaseUrl()}/languages`, fetcher);

  return (
    <select
      aria-label="Filter by language"
      className="bg-zinc-100 dark:bg-zinc-800 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
    >
      <option value="">All languages</option>
      {languages?.map((language) => (
        <option key={language.id} value={language.id}>
          {language.flag} {language.name}
        </option>
      ))}
    </select>
  );
};
