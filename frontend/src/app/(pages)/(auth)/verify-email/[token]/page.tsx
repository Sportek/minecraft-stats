"use client";
import { Spinner } from "@/components/ui/spinner";
import { verifyEmail } from "@/http/auth";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
  const { token } = useParams();
  const decodedToken = decodeURIComponent(token as string);

  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await verifyEmail({ token: decodedToken });
        setStatus("verified");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
        setStatus("error");
      }
    };

    run();
  }, [decodedToken]);

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:mark-email-read-outline" className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Verify your email</h1>
        </div>
        <p className="text-sm text-muted-foreground">Confirming your email address — hang on a moment.</p>
      </div>

      <div className="space-y-5 p-6 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Spinner size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">Checking your link...</p>
          </>
        )}

        {status === "verified" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <Icon icon="material-symbols:check-circle" className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">Email verified</p>
              <p className="text-sm text-muted-foreground">Your account is ready. You can now sign in.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
            >
              Continue to sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Icon icon="material-symbols:error-outline" className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">Verification failed</p>
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? "We couldn't verify this email. The link may have expired."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/sign-up"
                className="inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
              >
                Create a new account
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
