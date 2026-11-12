import { eq } from "drizzle-orm";
import { saveProfile } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { PROFILE_FIELDS } from "@/lib/profile-fields";
import { requireUser } from "@/lib/session";

export const metadata = { title: "個人檔案" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  const fields = p?.fields ?? {};

  return (
    <form action={saveProfile} className="max-w-[720px]">
      <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">個人檔案</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        用來判斷每個機會的適合度，之後也會用來自動填申請表。
        {p && (
          <>
            {" "}
            第 {p.version} 版，{formatDate(p.updatedAt, true)} 更新。
          </>
        )}
      </p>

      <section className="mt-10">
        <h2 className="text-[21px] font-semibold leading-7">基本資料</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">填表時會直接帶入。留白的欄位會在需要時再問你。</p>
        <div className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">
          {PROFILE_FIELDS.map(([key, label]) => (
            <label
              key={key}
              className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4 px-4 py-2 text-[15px] sm:grid-cols-[140px_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground">{label}</span>
              <input
                name={`f_${key}`}
                defaultValue={fields[key] ?? ""}
                className="h-8 w-full rounded-md bg-transparent px-2 -mx-2 placeholder:text-muted-foreground/60"
                placeholder="未填"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[21px] font-semibold leading-7">完整介紹</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          經歷、作品、獎項、技能。用 Markdown 寫，評分時會整份讀取。
        </p>
        <textarea
          name="markdown"
          defaultValue={p?.markdown ?? ""}
          spellCheck={false}
          className="mt-3 min-h-[560px] w-full rounded-xl bg-grouped p-4 font-mono text-[13px] leading-5"
        />
      </section>

      <div className="sticky bottom-0 mt-6 flex justify-end border-t border-hairline/70 bg-background/80 py-3 backdrop-blur-xl">
        <SubmitButton>儲存個人檔案</SubmitButton>
      </div>
    </form>
  );
}
