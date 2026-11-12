import { Globe, Languages, LogOut, Mail, SunMoon, UserRound, type LucideIcon } from "lucide-react";
import { LanguageControl } from "@/components/language-control";
import { RegionControl } from "@/components/region-control";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeControl } from "@/components/theme-control";
import { getDict } from "@/lib/locale";
import { getSettings } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Settings" };

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[21px] font-semibold leading-7">{title}</h2>
      <div className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">{children}</div>
      {note && <p className="mt-2 px-4 text-[13px] leading-[18px] text-muted-foreground">{note}</p>}
    </section>
  );
}

/** Settings-app style glyph: white symbol on a small colored rounded square. */
function Tile({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-[7px]"
      style={{ backgroundColor: color }}
    >
      <Icon className="size-4 text-white" strokeWidth={2.1} />
    </span>
  );
}

function Row({
  label,
  icon,
  color,
  children,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-[15px]">
      <span className="inline-flex items-center gap-3">
        <Tile icon={icon} color={color} />
        {label}
      </span>
      {children}
    </div>
  );
}

export default async function SettingsPage() {
  const [user, { t, locale }] = await Promise.all([requireUser(), getDict()]);
  const L = t.settings;
  const { regionMode } = await getSettings(user.id);

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">{L.title}</h1>

      <Group title={L.appearance} note={L.appearanceNote}>
        <Row label={L.theme} icon={SunMoon} color="var(--cat-indigo)">
          <ThemeControl labels={{ theme: L.theme, light: L.light, dark: L.dark, system: L.system }} />
        </Row>
      </Group>

      <Group title={L.language} note={L.languageNote}>
        <Row label={L.languageRow} icon={Languages} color="var(--cat-blue)">
          <LanguageControl value={locale} label={L.languageRow} />
        </Row>
      </Group>

      <Group title={L.scope} note={L.scopeNote}>
        <Row label={L.region} icon={Globe} color="var(--cat-green)">
          <RegionControl
            value={regionMode}
            labels={{ region: L.region, focus: t.filters.focus, world: t.filters.world }}
          />
        </Row>
      </Group>

      <Group title={L.account}>
        <Row label={L.name} icon={UserRound} color="var(--cat-gray)">
          <span className="text-muted-foreground">{user.name}</span>
        </Row>
        <Row label={L.google} icon={Mail} color="var(--cat-gray)">
          <span className="truncate text-muted-foreground">{user.email}</span>
        </Row>
        <div className="flex min-h-12 items-center gap-3 px-4 py-2 text-[15px]">
          <Tile icon={LogOut} color="var(--cat-red)" />
          <SignOutButton label={L.signOut} />
        </div>
      </Group>
    </div>
  );
}
