import type { ModerationVerdict, Server } from "@/types/server";
import { useFormatter, useTranslations } from "next-intl";
import ModerationActions from "./moderation-actions";
import ServerHeading from "./server-heading";

interface ServerRowProps {
  server: Server;
  acting: boolean;
  onVerdict: (verdict: ModerationVerdict) => void;
}

const ServerRow = ({ server, acting, onVerdict }: ServerRowProps) => {
  const t = useTranslations("Admin.serversPending");
  const format = useFormatter();
  const formatDate = (date: Date | string) => format.dateTime(new Date(date), { dateStyle: "medium" });

  const meta = server.moderationReviewedAt
    ? t("reviewedOn", { date: formatDate(server.moderationReviewedAt) })
    : t("submittedOn", { date: formatDate(server.createdAt) });

  return (
    <li className="flex flex-col gap-3 p-4">
      <ServerHeading server={server} meta={meta} />
      <ModerationActions status={server.moderationStatus} acting={acting} onVerdict={onVerdict} />
    </li>
  );
};

export default ServerRow;
