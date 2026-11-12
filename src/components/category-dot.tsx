import { CATEGORY_META, type Category } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: CATEGORY_META[category].color }}
    />
  );
}

export function CategoryLabel({ category, className }: { category: Category; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryDot category={category} />
      {CATEGORY_META[category].label}
    </span>
  );
}
