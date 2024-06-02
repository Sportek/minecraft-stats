import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Server, ServerStat } from "@/types/server";
import Link from "next/link";
import { useState } from "react";
import NotFound from "../not-found";

interface ServerCardProps {
  server: Server;
  stat: ServerStat | null;
}
const ServerCard = ({ server, stat }: ServerCardProps) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <Link
      href={`/servers/${server.id}/${server.name}`}
      className="flex flex-row items-center gap-4 bg-zinc-200 hover:bg-zinc-300 p-4 rounded-md shadow-sm h-fit justify-between transition-all duration-50 ease-in-out"
      // onMouseEnter={() => setIsHover(true)}
      // onMouseLeave={() => setIsHover(false)}
    >
      {isHover ? (
        <div className="flex flex-row items-center gap-4">
          <Avatar>
            <AvatarImage src={server.user.avatarUrl ?? ""} alt={server.user.username ?? "User Avatar"} />
            <AvatarFallback className="bg-stats-blue-900 text-stats-blue-0 text-sm font-semibold">
              {server.user.username?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col w-full">
            <div className="text-xl font-semibold">Added By</div>
            <div className="flex flex-row items-center gap-4">
              <div className="text-sm text-zinc-500 ">{server.user.username}</div>
              <div className="text-sm text-zinc-500">{new Date(server.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-4 w-full h-full flex-grow justify-between min-w-0">
          <Avatar>
            <AvatarImage src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${server.imageUrl}`} alt={server.name} />
            <AvatarFallback>
              <NotFound className="text-stats-blue-950" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-grow truncate">
            <div className="text-xl font-semibold truncate">{server.name}</div>
            <div className="text-sm text-zinc-500 truncate">{server?.address?.toUpperCase()}</div>
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
        </div>
      )}
    </Link>
  );
};

export default ServerCard;
