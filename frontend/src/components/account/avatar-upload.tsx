"use client";

import { AvatarTile } from "@/components/ui/avatar-tile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { uploadUserAvatar } from "@/http/auth";
import { ImageUp } from "lucide-react";
import { useRef, useState } from "react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const AvatarUpload = () => {
  const { user, getToken, setUser } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return null;

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
      toast({ title: "Avatar updated", variant: "success" });
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
    <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <ImageUp className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Profile picture</h2>
          <p className="text-sm text-muted-foreground">PNG, JPG, WebP or GIF, up to 5 MB.</p>
        </div>
      </div>
      <div className="flex items-center gap-5 px-6 py-5">
        <AvatarTile
          name={user.username}
          src={user.avatarUrl}
          className="h-16 w-16 rounded-2xl text-xl"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? "Uploading…" : "Change picture"}
        </Button>
      </div>
    </section>
  );
};

export default AvatarUpload;
