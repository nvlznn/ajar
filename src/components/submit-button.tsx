"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-full bg-tint px-5 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "儲存中" : children}
    </button>
  );
}
