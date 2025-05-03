interface ServerInfoProps {
  name: string;
  address: string | null;
}

const ServerInfo = ({ name, address }: ServerInfoProps) => {
  return (
    <div className="min-w-0 flex-shrink flex flex-col">
      <div className="text-xl font-semibold truncate">
        {name}
      </div>
      <div className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
        {address?.toLowerCase()}
      </div>
    </div>
  );
};

export default ServerInfo; 