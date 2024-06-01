import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Server } from "@/types/server";
import NotFound from "../not-found";

interface ServerCardProps {
  server: Server;
}
const ServerCard = ({ server }: ServerCardProps) => {
  return (
    <div className="flex flex-row items-center gap-4 bg-zinc-200 p-4 rounded-md shadow-sm h-fit justify-between">
      <div className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={server.imageUrl} alt={server.name} />
          <AvatarFallback>
            <NotFound />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="text-xl font-semibold">{server.name}</div>
          <div className="text-sm text-zinc-500">{server.address.toUpperCase()}</div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-4">
        <div className="w-3 h-3 bg-green-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div>150/200</div>
      </div>
    </div>
  );
};

export default ServerCard;
