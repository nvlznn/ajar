"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function GoogleButton() {
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
      {pending ? "正在前往 Google" : "使用 Google 登入"}
    </button>
  );
}

export function LoginError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const forbidden = error === "FORBIDDEN" || error.toLowerCase().includes("not allowed");
  return (
    <p className="mt-4 text-[13px] text-urgent">
      {forbidden ? "這個 Google 帳號沒有使用權限。請改用已授權的帳號登入。" : "登入沒有完成。請再試一次。"}
    </p>
  );
}
