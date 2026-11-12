import { Suspense } from "react";
import { getDict } from "@/lib/locale";
import { GoogleButton, LoginError } from "./google-button";

export const metadata = { title: "Sign in" };

async function LoginContent() {
  const { t } = await getDict();
  return (
    <>
      <p className="mt-2 text-[17px] text-muted-foreground">{t.login.tagline}</p>
      <div className="mt-10">
        <GoogleButton labels={t.login} />
      </div>
      <LoginError labels={t.login} />
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[400px] flex-col justify-center px-4">
      <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.02em]">Ajar</h1>
      <Suspense fallback={<div className="h-[140px]" aria-busy />}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
