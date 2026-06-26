import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function BlogPostNotFound() {
  return (
    <div className="flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-card-foreground shadow-xs sm:p-12">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">Article Not Found</h1>
          <p className="mb-8 text-muted-foreground">
            The article you are looking for does not exist or has been deleted.
          </p>
          <Button asChild variant="accent">
            <Link href="/blog">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
