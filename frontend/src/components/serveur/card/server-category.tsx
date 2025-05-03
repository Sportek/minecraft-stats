import { Badge } from "@/components/ui/badge";
import { Category } from "@/types/server";
import { extractVersions, formatVersion } from "@/utils/server-version";

interface ServerCategoriesProps {
  categories: Category[];
  version?: string;
  isFull?: boolean;
}

const ServerCategories = ({ categories, version, isFull }: ServerCategoriesProps) => {
  return (
    <div className="flex flex-row items-center gap-1 truncate">
      <Badge
        variant="secondary"
        className="bg-stats-blue-900 dark:bg-stats-blue-950 text-white hover:bg-stats-blue-800 dark:hover:bg-stats-blue-800/80"
      >
        {formatVersion(extractVersions(version ?? ""))}
      </Badge>
      {categories
        .map((category) => (
          <Badge key={category.id} className="text-xs text-nowrap" variant="secondary">
            {category.name}
          </Badge>
        ))
        .slice(0, isFull ? categories.length : 2)}
      {!isFull && categories.length > 2 ? (
        <Badge className="text-xs text-nowrap" variant="secondary">
          +{categories.length - 2}
        </Badge>
      ) : null}
    </div>
  );
};

export default ServerCategories; 