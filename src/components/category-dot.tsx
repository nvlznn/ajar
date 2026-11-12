import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: CATEGORY_COLOR[category] }}
    />
  );
}

export function CategoryLabel({ category, label, className }: { category: Category; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryDot category={category} />
      {label}
    </span>
  );
}
