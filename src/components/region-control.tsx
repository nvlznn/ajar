"use client";

import { useOptimistic, useTransition } from "react";
import { setRegionMode } from "@/app/actions";
import { Segmented } from "@/components/filter-bar";

export function RegionControl({
  value,
  labels,
}: {
  value: "focus" | "all";
  labels: { region: string; focus: string; world: string };
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <Segmented
      label={labels.region}
      value={optimistic}
      onChange={(v) =>
        start(async () => {
          setOptimistic(v);
          await setRegionMode(v);
        })
      }
      options={[
        { value: "focus", label: labels.focus },
        { value: "all", label: labels.world },
      ]}
    />
  );
}
