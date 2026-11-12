import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/category-dot";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/landing-nav";
import { RulerDemo } from "@/components/landing/ruler-demo";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { getDict } from "@/lib/locale";
import { getPublicStats } from "@/lib/queries";

export const metadata = {
  title: { absolute: "Ajar — every opportunity you can apply for, sorted by deadline" },
  description:
    "Hackathons, internships, exchanges, competitions, scholarships and research programs, scored against your background and sorted by deadline.",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_COLOR) as Category[];

async function Landing() {
  const [{ t, locale }, stats] = await Promise.all([getDict(), getPublicStats()]);
  const L = t.landing;

  return (
    <>
      <LandingNav t={L.nav} locale={locale} />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[980px] px-4 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="mx-auto max-w-[780px] text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[64px]">
            {L.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-7 text-muted-foreground sm:text-[19px] sm:leading-8">
            {L.hero.sub}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full bg-tint px-6 text-[17px] font-medium text-white hover:opacity-90"
            >
              {L.hero.cta}
            </Link>
            <a href="#how" className="inline-flex items-center gap-1 text-[17px] text-tint hover:underline">
              {L.hero.secondary}
              <ArrowRight aria-hidden className="size-4" />
            </a>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">{L.hero.access}</p>

          <div className="mt-16">
            <RulerDemo t={L.demo} categories={t.categories} />
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-[980px] px-4 pt-28 sm:px-6">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{L.categories.title}</h2>
          <p className="mt-3 text-[17px] text-muted-foreground">{L.categories.sub}</p>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORY_ORDER.map((c) => (
              <li key={c} className="flex items-center gap-3 text-[17px]">
                <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-grouped">
                  <CategoryIcon category={c} className="size-[18px]" />
                </span>
                {t.categories[c]}
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[980px] scroll-mt-16 px-4 pt-28 sm:px-6">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{L.how.title}</h2>
          <div className="mt-10">
            <HowItWorks t={L.how} />
          </div>
        </section>

        {/* Numbers */}
        <section className="mx-auto max-w-[980px] px-4 pt-28 sm:px-6">
          <dl className="grid grid-cols-1 gap-10 border-y border-hairline py-12 sm:grid-cols-3">
            <div>
              <dt className="text-[15px] text-muted-foreground">{L.stats.opportunities}</dt>
              <dd className="order-first text-[56px] font-semibold leading-none tracking-tight tnum">{stats.open}</dd>
            </div>
            <div>
              <dt className="text-[15px] text-muted-foreground">{L.stats.categories}</dt>
              <dd className="order-first text-[56px] font-semibold leading-none tracking-tight tnum">{CATEGORY_ORDER.length}</dd>
            </div>
            <div>
              <dt className="text-[15px] text-muted-foreground">{L.stats.weekly}</dt>
              <dd className="order-first text-[56px] font-semibold leading-none tracking-tight tnum">7d</dd>
            </div>
          </dl>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[760px] scroll-mt-16 px-4 pt-28 sm:px-6">
          <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">{L.faq.title}</h2>
          <div className="mt-8 divide-y divide-hairline border-y border-hairline">
            {L.faq.items.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[19px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-[17px] leading-7 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-[980px] px-4 py-32 text-center sm:px-6">
          <h2 className="mx-auto max-w-[640px] text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[48px]">
            {L.cta.title}
          </h2>
          <Link
            href="/login"
            className="mt-9 inline-flex h-11 items-center rounded-full bg-tint px-6 text-[17px] font-medium text-white hover:opacity-90"
          >
            {L.cta.button}
          </Link>
        </section>
      </main>

      <footer className="border-t border-hairline/70">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-4 py-8 text-[13px] text-muted-foreground sm:px-6">
          <span>© 2026 Ajar</span>
          <a href="https://noky.dev" className="hover:text-foreground">
            {L.footer.by}
          </a>
        </div>
      </footer>
    </>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy />}>
      <Landing />
    </Suspense>
  );
}
