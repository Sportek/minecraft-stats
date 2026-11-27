"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropImageToFile } from "@/lib/crop-image";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

const MIN_ZOOM = 0.3;
const INITIAL_ZOOM = 1;
const MAX_ZOOM = 4;

interface ImageCropDialogProps {
  file: File | null;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: (cropped: File) => Promise<void>;
}

export const ImageCropDialog = ({ file, ...props }: ImageCropDialogProps) =>
  file && <ImageCropContent key={`${file.name}-${file.lastModified}-${file.size}`} file={file} {...props} />;

const ImageCropContent = ({
  file,
  title,
  description,
  onCancel,
  onConfirm,
}: Omit<ImageCropDialogProps, "file"> & { file: File }) => {
  const t = useTranslations("Common.imageCrop");
  const [src] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [area, setArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const cancel = () => {
    URL.revokeObjectURL(src);
    onCancel();
  };

  const confirm = async () => {
    if (!area) return;
    setIsSaving(true);
    try {
      await onConfirm(await cropImageToFile(src, area, file.name));
      URL.revokeObjectURL(src);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && cancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            restrictPosition={false}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>

        <label className="flex items-center gap-3 text-muted-foreground">
          <span className="sr-only">{t("zoom")}</span>
          <ZoomOut className="h-4 w-4 shrink-0" aria-hidden />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <ZoomIn className="h-4 w-4 shrink-0" aria-hidden />
        </label>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>

        <DialogFooter>
          <Button variant="outline" onClick={cancel} disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button onClick={confirm} disabled={!area || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
