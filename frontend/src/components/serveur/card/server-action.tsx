import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth";
import { Server } from "@/types/server";
import { useRouter } from "@/i18n/navigation";

interface ServerActionsProps {
  server: Server;
}

const ServerActions = ({ server }: ServerActionsProps) => {
  const t = useTranslations("Servers");
  const { user } = useAuth();
  const router = useRouter();

  const canEdit = user?.role === "admin" || server.user?.id === user?.id;

  if (!canEdit) return null;

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/servers/${server.id}/edit`);
  };

  return (
    <button
      className="group-hover:flex hidden absolute top-[-5px] right-[-5px] h-7 w-7 rounded-full bg-secondary text-secondary-foreground items-center justify-center hover:bg-accent hover:text-accent-foreground hover:cursor-pointer transition-colors"
      onClick={handleEdit}
      aria-label={t("card.edit")}
    >
      <Icon icon="material-symbols:edit-outline" className="w-4 h-4" />
    </button>
  );
};

export default ServerActions;
