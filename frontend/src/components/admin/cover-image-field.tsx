"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { uploadImage } from "@/http/post";
import { resolveAssetUrl } from "@/lib/domain";
import { ImageIcon, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

interface CoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Cover image control for the blog post form: uploads directly instead of pasting a URL. */
export const CoverImageField = ({ value, onChange }: CoverImageFieldProps) => {
  const t = useTranslations("Admin");
  const { getToken } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_COVER_BYTES) {
      toast({
        title: t("coverImage.tooLargeTitle"),
        description: t("coverImage.tooLargeDescription"),
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file, getToken() ?? "");
      onChange(url);
    } catch (error) {
      toast({
        title: t("coverImage.uploadFailedTitle"),
        description: error instanceof Error ? error.message : t("coverImage.uploadFailedDescription"),
        variant: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t("coverImage.label")}</Label>
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
            <span className="text-xs">{t("coverImage.noCover")}</span>
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
              {isUploading
                ? t("coverImage.uploading")
                : value
                  ? t("coverImage.replace")
                  : t("coverImage.upload")}
            </Button>
            {value && (
              <Button type="button" variant="ghost" onClick={() => onChange("")} disabled={isUploading}>
                <X className="mr-2 h-4 w-4" />
                {t("coverImage.remove")}
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{t("coverImage.help")}</span>
        </div>
      </div>
    </div>
  );
};

export default CoverImageField;
