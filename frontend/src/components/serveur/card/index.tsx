import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Server, ServerStat } from "@/types/server";
import Link from "next/link";
import NotFound from "../not-found";

interface ServerCardProps {
  server: Server;
  stat: ServerStat | null;
}
const ServerCard = ({ server, stat }: ServerCardProps) => {
  return (
    <Link
      href={`/servers/${server.id}/${server.name}`}
      className="flex flex-row items-center gap-4 bg-zinc-200 hover:bg-zinc-300 p-4 rounded-md shadow-sm h-fit justify-between transition-all duration-50 ease-in-out"
    >
      <div className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${server.imageUrl}`} alt={server.name} />
          <AvatarFallback>
            <NotFound className="text-stats-blue-950" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col w-[140px] sm:w-full">
          <div className="text-xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{server.name}</div>
          <div className="text-sm text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap">
            {server?.address?.toUpperCase()}
          </div>
        </div>
      </div>
      {stat ? (
        <div className="flex flex-row items-center gap-4">
          <div className="w-3 h-3 bg-green-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
          <div>
            {stat.playerCount}/{stat.maxCount}
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-4">
          <div className="w-3 h-3 bg-red-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
          <div className="text-red-500">Offline</div>
        </div>
      )}
    </Link>
  );
};

export default ServerCard;
