import { useToast } from "@/components/ui/use-toast";
import { NOTE_MAX_LENGTH } from "@/lib/admin-note";
import { useAuth } from "@/contexts/auth";
import { reviewServerModeration } from "@/http/server";
import type { ModerationVerdict } from "@/types/server";
import { useTranslations } from "next-intl";
import { useState } from "react";

export interface ModerationVerdictTarget {
  id: number;
  name: string;
}

export const useModerationVerdict = () => {
  const { getToken } = useAuth();
  const t = useTranslations("Admin.serversPending");
  const { toast } = useToast();
  const [actingId, setActingId] = useState<number | null>(null);

  const submitVerdict = async (target: ModerationVerdictTarget, verdict: ModerationVerdict) => {
    const token = getToken();
    if (!token) return false;
    if (verdict === "blocked" && !confirm(t("confirmBlock", { server: target.name }))) {
      return false;
    }
    const note = prompt(t("notePrompt")) ?? undefined;
    if (note && note.trim().length > NOTE_MAX_LENGTH) {
      toast({ variant: "error", description: t("noteTooLong", { max: NOTE_MAX_LENGTH }) });
      return false;
    }

    setActingId(target.id);
    try {
      await reviewServerModeration(target.id, verdict, token, note);
      toast({ variant: "success", description: t("saved") });
      return true;
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("error"),
      });
      return false;
    } finally {
      setActingId(null);
    }
  };

  return { submitVerdict, actingId };
};
