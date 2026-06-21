import { Badge } from "@/components/ui/badge";
import { Category, ServerType } from "@/types/server";
import { cn } from "@/lib/utils";
import { extractVersions, formatVersion } from "@/utils/server-version";

interface ServerCategoriesProps {
  categories: Category[];
  version?: string;
  type?: ServerType;
  isFull?: boolean;
}

const ServerCategories = ({ categories, version, type, isFull }: ServerCategoriesProps) => {
  const formattedVersion = formatVersion(extractVersions(version ?? ""));
  const hasVersion = formattedVersion !== "N/A";
  const visibleCategories = isFull ? categories : categories.slice(0, 2);
  const hiddenCount = categories.length - visibleCategories.length;

  return (
    <div className="flex flex-row items-center gap-1.5 truncate">
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-semibold",
          type === "bedrock" ? "border-success/60 text-success" : "border-accent/60 text-accent"
        )}
      >
        {type === "bedrock" ? "Bedrock" : "Java"}
      </Badge>
      <Badge variant={hasVersion ? "accent" : "secondary"} className="text-xs">
        {formattedVersion}
      </Badge>
      {visibleCategories.map((category) => (
        <Badge key={category.id} className="text-xs text-nowrap" variant="secondary">
          {category.name}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge className="text-xs text-nowrap" variant="secondary">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
};

export default ServerCategories;
