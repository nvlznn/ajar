"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { Dict } from "@/lib/i18n";

export function GoogleButton({ labels }: { labels: Dict["login"] }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/login" });
      }}
      className="inline-flex h-11 w-full items-center justify-center rounded-full border border-hairline text-[15px] font-medium hover:bg-grouped disabled:opacity-60"
    >
      {pending ? labels.redirecting : labels.google}
    </button>
  );
}

export function LoginError({ labels }: { labels: Dict["login"] }) {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const forbidden = error === "FORBIDDEN" || error.toLowerCase().includes("not allowed");
  return <p className="mt-4 text-[13px] text-urgent">{forbidden ? labels.forbidden : labels.failed}</p>;
}
