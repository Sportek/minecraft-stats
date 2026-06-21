"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { uploadImage } from "@/http/post";
import { resolveAssetUrl } from "@/lib/domain";
import { ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

interface CoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Cover image control for the blog post form: uploads directly instead of pasting a URL. */
export const CoverImageField = ({ value, onChange }: CoverImageFieldProps) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_COVER_BYTES) {
      toast({ title: "Image too large", description: "Maximum size is 5 MB.", variant: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file, getToken() ?? "");
      onChange(url);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Cover image (optional)</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveAssetUrl(value)}
            alt=""
            className="h-24 w-full rounded-lg border border-border object-cover sm:w-40"
          />
        ) : (
          <div className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground sm:w-40">
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs">No cover yet</span>
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" onClick={() => onChange("")} disabled={isUploading}>
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            PNG, JPG, WebP or GIF, up to 5 MB. Used as the hero image on the blog card and article page.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoverImageField;
