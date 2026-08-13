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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { deleteServer } from "@/http/server";
import { Link, useRouter } from "@/i18n/navigation";
import { Pencil, ShieldAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ServerAdminActionsProps {
  serverId: number;
  serverName: string;
}

/**
 * Raccourcis « modifier / supprimer » posés sur la fiche publique du serveur.
 * Réservés aux admins Minecraft Stats : le propriétaire, lui, gère son serveur
 * depuis /account/my-servers. La suppression est définitive et vaut pour tout
 * le site — d'où la confirmation.
 */
const ServerAdminActions = ({ serverId, serverName }: ServerAdminActionsProps) => {
  const t = useTranslations("Servers.admin");
  const { user, getToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (user?.role !== "admin") return null;

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteServer(serverId, getToken() ?? "");
      toast({
        title: t("removedTitle"),
        description: t("removedDescription", { name: serverName }),
        variant: "success",
      });
      setIsConfirmOpen(false);
      // La fiche n'existe plus : rester dessus n'afficherait qu'un 404.
      router.push("/");
    } catch (error) {
      toast({
        title: t("removeErrorTitle"),
        description: error instanceof Error ? error.message : t("removeErrorDescription"),
        variant: "error",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5" />
        {t("label")}
      </span>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href={`/servers/${serverId}/edit`}>
          <Pencil className="h-4 w-4" />
          {t("edit")}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsConfirmOpen(true)}
        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        {t("delete")}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !isDeleting && setIsConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t.rich("dialogDescription", {
                name: serverName,
                b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isDeleting}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t("deleting") : t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServerAdminActions;
