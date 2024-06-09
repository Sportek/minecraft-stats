import { cn, darkenColor } from "@/lib/utils";

interface RouteProps {
  children: React.ReactNode;
  path: string;
  description: string;
  method: RouteMethod;
}

export enum RouteMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

const getRouteColor = (method: RouteMethod) => {
  switch (method) {
    case RouteMethod.GET:
      return "#41c720";
    case RouteMethod.POST:
      return "#4dbbfa";
    case RouteMethod.PUT:
      return "#fcba03";
    case RouteMethod.DELETE:
      return "#fa4d4d";
  }
};

const Route = ({ children, path, method, description }: RouteProps) => {
  return (
    <div className="flex flex-col bg-zinc-300 rounded-md p-2">
      <div className="flex flex-row gap-2 bg-zinc-200 p-2 rounded-md">
        <div className={cn("w-fit h-fit px-1 text-white rounded-md border-2 text-sm font-semibold")} style={{ backgroundColor: getRouteColor(method), borderColor: darkenColor(getRouteColor(method), 10) }}>{method}</div>
        <div className="flex">
          <div className="text-gray-500">{process.env.NEXT_PUBLIC_API_URL}</div>
          <div className="text-gray-700">{path}</div>
        </div>
      </div>
        <div className="text-gray-500">{description}</div>
      <div>{children}</div>
    </div>
  );
};

export default Route;

