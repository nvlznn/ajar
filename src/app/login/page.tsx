import { Suspense } from "react";
import { GoogleButton, LoginError } from "./google-button";

export const metadata = { title: "登入" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[400px] flex-col justify-center px-4">
      <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.02em]">Ajar</h1>
      <p className="mt-2 text-[17px] text-muted-foreground">所有你能申請的機會，依截止日排好。</p>
      <div className="mt-10">
        <GoogleButton />
      </div>
      <Suspense>
        <LoginError />
      </Suspense>
    </main>
  );
}
