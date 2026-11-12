"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-urgent hover:opacity-80"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
      }}
    >
      {label}
    </button>
  );
}
