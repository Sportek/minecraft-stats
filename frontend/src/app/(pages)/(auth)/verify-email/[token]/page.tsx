"use client";
import { verifyEmail } from "@/http/auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
  const { token } = useParams();

  const decodedToken = decodeURIComponent(token as string);

  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const requestVerifyEmail = async () => {
      try {
        await verifyEmail({ token: decodedToken });
        setIsVerified(true);
      } catch (error: any) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    requestVerifyEmail();
  }, [decodedToken]);

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-md shadow-md">
        <div className="text-2xl font-bold">Verify Email</div>
        <div className="text-lg">
          {isLoading && <div>Loading...</div>}
          {isVerified && <div>Verified</div>}
          {errorMessage && <div className="text-red-800">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
