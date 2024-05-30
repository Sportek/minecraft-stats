"use client";

// Cheat code component is a component who execute code in client side on load
// (normaly loaded in first after the first layout)

import { useEffect } from "react";

let baseUrl = "";

export const fetcher = (...args: [RequestInfo, RequestInit?]) => fetch(...args).then((res) => res.json());

export const getBaseUrl = (): string => baseUrl;

const CheatCodeComponent = () => {
  useEffect(() => {
    let url = process.env.NEXT_PUBLIC_API_URL ?? "";

    if (!url) throw new Error("URL Missing : Impossible to read the URL from the environment variables");
    baseUrl = url;
  }, []);
  return <></>;
};

export default CheatCodeComponent;
