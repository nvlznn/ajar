import { eq } from "drizzle-orm";
import { saveProfile } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { getDict } from "@/lib/locale";
import { PROFILE_FIELDS } from "@/lib/profile-fields";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const { t } = await getDict();
  const L = t.profile;
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  const fields = p?.fields ?? {};

  return (
    <form action={saveProfile} className="max-w-[720px]">
      <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">{L.title}</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {L.intro}
        {p && L.version(p.version, formatDate(p.updatedAt, true))}
      </p>

      <section className="mt-10">
        <h2 className="text-[21px] font-semibold leading-7">{L.basics}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{L.basicsNote}</p>
        <div className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">
          {PROFILE_FIELDS.map((key) => (
            <label
              key={key}
              className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 px-4 py-2 text-[15px] sm:grid-cols-[168px_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground">{L.fields[key] ?? key}</span>
              <input
                name={`f_${key}`}
                defaultValue={fields[key] ?? ""}
                className="-mx-2 h-8 w-full rounded-md bg-transparent px-2 placeholder:text-muted-foreground/60"
                placeholder={L.empty}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[21px] font-semibold leading-7">{L.full}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{L.fullNote}</p>
        <textarea
          name="markdown"
          aria-label={L.full}
          defaultValue={p?.markdown ?? ""}
          spellCheck={false}
          className="mt-3 min-h-[560px] w-full rounded-xl bg-grouped p-4 font-mono text-[13px] leading-5"
        />
      </section>

      <div className="sticky bottom-0 mt-6 flex justify-end border-t border-hairline/70 bg-background/80 py-3 backdrop-blur-xl">
        <SubmitButton label={L.save} pendingLabel={L.saving} />
      </div>
    </form>
  );
}
