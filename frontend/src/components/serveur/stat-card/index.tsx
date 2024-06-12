interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {

  return (
    <div className="bg-zinc-200 p-4 rounded-md shadow-sm w-full flex flex-row gap-2 items-center justify-between">
      <div className="flex flex-row gap-2 items-center">
        {icon}
        <div className="text-sm">{title}</div>
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default StatCard;