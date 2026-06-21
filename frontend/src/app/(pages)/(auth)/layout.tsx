import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex w-full flex-1 items-center justify-center px-4 py-12 sm:py-16">
      {/* Subtle accent glows consistent with the hero. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-64 w-64 translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}
