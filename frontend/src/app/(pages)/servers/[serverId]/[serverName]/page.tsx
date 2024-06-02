"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { Server } from "@/types/server";
import { useParams } from "next/navigation";
import useSWR from "swr";

const ServerPage = () => {
  const { serverId } = useParams();
  const { data, isLoading } = useSWR<Server, Error>(`${getBaseUrl()}/servers/${serverId}`, fetcher);

  return isLoading ? (
    <Loader message="Querying server..." />
  ) : (
    <div>
      <h1>{data?.name}</h1>
    </div>
  );
};

export default ServerPage;
