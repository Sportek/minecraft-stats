"use client";
import { verifyEmail } from "@/http/auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
  const { token } = useParams();

  const decodedToken = decodeURIComponent(token as string);

  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyEmail({ token: decodedToken }).then((response) => {
      setIsVerified(response.verified);
      setIsLoading(false);
    });
  }, [decodedToken]);

  return <div>{isLoading ? "Loading..." : isVerified ? "Verified" : "Not Verified"}</div>;
};

export default VerifyEmail;
