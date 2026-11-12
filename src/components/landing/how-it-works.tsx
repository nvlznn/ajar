"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Source names shown in the "collect" mockup — real platforms Ajar checks (see docs/SOURCES.md). */
const SOURCES = ["Devpost", "MLH", "104", "Cake", "NTU OIA", "青年發展署", "Kaggle", "GSoC", "COSCUP", "AppWorks"];

function fmt(offsetDays: number) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric" })
    .format(new Date(Date.now() + offsetDays * 86_400_000))
    .replace(/(\d+)\/(\d+)/, "$1/$2");
}

function Collect({ t }: { t: Dict["landing"]["how"] }) {
  return (
    <div>
      <div className="text-[13px] text-muted-foreground">{t.sourcesTitle}</div>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
        {SOURCES.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-2 text-[15px] motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-cat-green">
              <Check aria-hidden className="size-3 text-white" strokeWidth={3} />
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Score({ t }: { t: Dict["landing"]["how"] }) {
  const [i, setI] = useState(0);
  const ex = t.fitExamples[i];
  return (
    <div>
      <div className="inline-flex h-8 rounded-lg bg-grouped p-0.5" role="radiogroup" aria-label={t.steps[1].name}>
        {t.fitExamples.map((e, k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={i === k}
            onClick={() => setI(k)}
            className={cn(
              "rounded-md border px-3 text-[13px] transition-colors",
              i === k ? "border-hairline bg-background text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-5" aria-live="polite">
        <div
          className={cn(
            "text-[56px] font-semibold leading-none tracking-tight tnum",
            Number(ex.score) < 40 && "text-muted-foreground",
          )}
        >
          {ex.score}
        </div>
        <div className="pt-1">
          <div className="text-[15px] font-medium">{ex.label}</div>
          <p className="mt-1 max-w-sm text-[15px] leading-[22px] text-muted-foreground">{ex.reason}</p>
        </div>
      </div>
    </div>
  );
}

function Prepare({ t }: { t: Dict["landing"]["how"] }) {
  const deadline = 21;
  const [prep, setPrep] = useState(7);
  const start = deadline - prep;
  return (
    <div>
      <label className="flex items-center justify-between text-[15px]">
        <span>{t.prepLabel}</span>
        <span className="font-semibold tnum">{t.daysTpl.replace("{n}", String(prep))}</span>
      </label>
      <input
        type="range"
        min={1}
        max={20}
        value={prep}
        onChange={(e) => setPrep(Number(e.target.value))}
        aria-label={t.prepLabel}
        className="mt-3 w-full accent-[var(--tint)]"
      />
      <div className="relative mt-8 h-1 rounded-full bg-hairline">
        <div
          className="absolute inset-y-0 rounded-full bg-tint/70 transition-[left] duration-150"
          style={{ left: `${(start / deadline) * 100}%`, right: 0 }}
        />
        <span className="absolute -top-1 left-0 size-3 rounded-full bg-muted-foreground" />
        <span
          className="absolute -top-1 size-3 -translate-x-1/2 rounded-full bg-tint transition-[left] duration-150"
          style={{ left: `${(start / deadline) * 100}%` }}
        />
        <span className="absolute -top-1 right-0 size-3 rounded-full bg-urgent" />
      </div>
      <div className="mt-4 grid grid-cols-2 text-[13px]">
        <div>
          <div className="text-muted-foreground">{t.startBy}</div>
          <div className="text-[21px] font-semibold text-tint tnum">{fmt(start)}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">{t.deadline}</div>
          <div className="text-[21px] font-semibold tnum">{fmt(deadline)}</div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks({ t }: { t: Dict["landing"]["how"] }) {
  const [step, setStep] = useState(0);
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
      <ol className="space-y-2" role="tablist" aria-orientation="vertical">
        {t.steps.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              role="tab"
              id={`how-tab-${i}`}
              aria-selected={step === i}
              aria-controls="how-panel"
              onClick={() => setStep(i)}
              className={cn(
                "w-full rounded-xl px-4 py-4 text-left transition-colors",
                step === i ? "bg-grouped" : "hover:bg-grouped/60",
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className={cn("text-[13px] tnum", step === i ? "text-tint" : "text-muted-foreground")}>{i + 1}</span>
                <span className="text-[19px] font-semibold">{s.name}</span>
              </div>
              <p
                className={cn(
                  "mt-1 pl-[22px] text-[15px] leading-[22px] text-muted-foreground",
                  step !== i && "max-md:hidden",
                )}
              >
                {s.body}
              </p>
            </button>
          </li>
        ))}
      </ol>
      <div
        id="how-panel"
        role="tabpanel"
        aria-labelledby={`how-tab-${step}`}
        className="min-h-[260px] rounded-2xl border border-hairline/70 p-6 sm:p-8"
      >
        {step === 0 && <Collect key="c" t={t} />}
        {step === 1 && <Score key="s" t={t} />}
        {step === 2 && <Prepare key="p" t={t} />}
      </div>
    </div>
  );
}
