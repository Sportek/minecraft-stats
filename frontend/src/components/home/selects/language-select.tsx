import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language } from "@/types/server";
import useSWRImmutable from "swr/immutable";

interface LanguageSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
}

const ALL_VALUE = "__all__";

export const LanguageSelect = ({ value, onChange, disabled }: LanguageSelectProps) => {
  const { data: languages } = useSWRImmutable<Language[]>(`${getBaseUrl()}/languages`, fetcher);

  return (
    <Select
      value={value === null ? ALL_VALUE : String(value)}
      onValueChange={(v) => onChange(v === ALL_VALUE ? null : Number(v))}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Filter by language" className="h-9 w-auto min-w-[10rem] bg-secondary text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All languages</SelectItem>
        {languages?.map((language) => (
          <SelectItem key={language.id} value={String(language.id)}>
            {language.flag} {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
