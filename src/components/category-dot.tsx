import {
  BriefcaseBusiness,
  CodeXml,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Landmark,
  Mic,
  Plane,
  Rocket,
  Tent,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  hackathon: CodeXml,
  exchange: Plane,
  internship: BriefcaseBusiness,
  lab: FlaskConical,
  competition: Trophy,
  program: Landmark,
  scholarship: GraduationCap,
  startup: Rocket,
  open_source: GitBranch,
  camp: Tent,
  conference: Mic,
};

/** Dense views (14-day ruler, calendar cells) use a dot; everywhere else uses the icon. */
export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: CATEGORY_COLOR[category] }}
    />
  );
}

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <Icon
      aria-hidden
      className={cn("size-3.5 shrink-0", className)}
      strokeWidth={2}
      style={{ color: CATEGORY_COLOR[category] }}
    />
  );
}

export function CategoryLabel({ category, label, className }: { category: Category; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryIcon category={category} />
      {label}
    </span>
  );
}
