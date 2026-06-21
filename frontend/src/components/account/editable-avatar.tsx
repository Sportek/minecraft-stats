"use client";

import { AvatarTile } from "@/components/ui/avatar-tile";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { uploadUserAvatar } from "@/http/auth";
import { resolveAssetUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

interface EditableAvatarProps {
  name: string;
  className?: string;
}

/**
 * Profile avatar that doubles as its own upload control: clicking the tile opens
 * a file picker, uploads the image, and refreshes the auth user so every avatar
 * (top bar included) updates immediately.
 */
export const EditableAvatar = ({ name, className }: EditableAvatarProps) => {
  const { user, getToken, setUser } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: "Image too large", description: "Maximum size is 5 MB.", variant: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const updatedUser = await uploadUserAvatar(file, getToken() ?? "");
      setUser(updatedUser);
      toast({ title: "Profile picture updated", variant: "success" });
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
    <div className={cn("group relative overflow-hidden", className)}>
      <AvatarTile
        name={name}
        src={resolveAssetUrl(user?.avatarUrl)}
        className="h-full w-full rounded-[inherit]"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile picture"
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
          isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

export default EditableAvatar;
