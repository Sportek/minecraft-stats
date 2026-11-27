"use client";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { reportServer } from "@/http/server";
import type { ReportReason } from "@/types/server";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function useReportServer(serverId: number) {
  const t = useTranslations("Servers.report");
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("scam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetDialog = () => {
    setReason("scam");
    setDetails("");
    setSubmitted(false);
  };

  const submit = async () => {
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      await reportServer(serverId, reason, token, details.trim() || undefined);
      setSubmitted(true);
    } catch (error) {
      toast({
        variant: "error",
        description: error instanceof Error ? error.message : t("error"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open,
    setOpen,
    reason,
    setReason,
    details,
    setDetails,
    submitting,
    submitted,
    submit,
    resetDialog,
  };
}
