import type { Area } from "react-easy-crop";

const OUTPUT_SIZE = 512;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read this image"));
    image.src = src;
  });

export async function cropImageToFile(src: string, area: Area, fileName: string): Promise<File> {
  const image = await loadImage(src);
  const size = Math.min(OUTPUT_SIZE, Math.round(area.width));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported by this browser");

  // Image entière décalée plutôt qu'un rectangle source : gère une zone qui déborde après un dézoom.
  const scale = size / area.width;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    -area.x * scale,
    -area.y * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Unable to export the cropped image");

  const baseName = fileName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.png`, { type: "image/png" });
}
