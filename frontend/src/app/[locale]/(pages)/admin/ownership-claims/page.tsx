"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import {
  approveOwnershipClaim,
  getPendingOwnershipClaims,
  rejectOwnershipClaim,
} from "@/http/server";
import { Link } from "@/i18n/navigation";
import type { AdminOwnershipClaim } from "@/types/server";
import { Check, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const AdminOwnershipClaimsPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin.ownershipClaims");
  const format = useFormatter();
  const { toast } = useToast();
  const token = getToken();

  const [claims, setClaims] = useState<AdminOwnershipClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    getPendingOwnershipClaims(token)
      .then(setClaims)
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return <AdminLoadingState label={t("loading")} />;
  if (user.role !== "admin") {
    return <AdminMessageState tone="destructive" title={t("accessDenied")} description={t("adminOnly")} />;
  }

  const handleApprove = async (claim: AdminOwnershipClaim) => {
    if (!token) return;
    if (!confirm(t("confirmApprove", { server: claim.server.name, user: claim.user.username }))) return;
    setActingId(claim.id);
    try {
      await approveOwnershipClaim(claim.id, token);
      setClaims((current) => current.filter((c) => c.id !== claim.id));
      toast({ variant: "success", description: t("approved") });
    } catch (error) {
      toast({ variant: "error", description: error instanceof Error ? error.message : t("error") });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (claim: AdminOwnershipClaim) => {
    if (!token) return;
    const note = prompt(t("rejectPrompt")) ?? undefined;
    setActingId(claim.id);
    try {
      await rejectOwnershipClaim(claim.id, token, note);
      setClaims((current) => current.filter((c) => c.id !== claim.id));
      toast({ variant: "success", description: t("rejected") });
    } catch (error) {
      toast({ variant: "error", description: error instanceof Error ? error.message : t("error") });
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("title")}
        subtitle={t("subtitle")}
        badge={t("pendingBadge", { count: claims.length })}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">{t("loadingList")}</div>
        ) : claims.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {claims.map((claim) => (
              <li key={claim.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/servers/${claim.server.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {claim.server.name}
                  </Link>
                  <Badge variant="secondary">{claim.server.address}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AvatarTile
                    name={claim.user.username}
                    src={claim.user.avatarUrl}
                    className="h-7 w-7 rounded-md text-xs"
                  />
                  <span className="text-foreground">{claim.user.username}</span>
                  <span>·</span>
                  <span>{claim.user.email}</span>
                  <span>·</span>
                  <span>{format.dateTime(new Date(claim.createdAt), { dateStyle: "medium" })}</span>
                </div>

                {claim.evidence && (
                  <p className="whitespace-pre-wrap rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                    {claim.evidence}
                  </p>
                )}
                {claim.evidenceUrl && (
                  <a
                    href={claim.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("viewProof")}
                  </a>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleApprove(claim)}
                    disabled={actingId === claim.id}
                    className="gap-1.5"
                  >
                    {actingId === claim.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {t("approve")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReject(claim)}
                    disabled={actingId === claim.id}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    {t("reject")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOwnershipClaimsPage;
