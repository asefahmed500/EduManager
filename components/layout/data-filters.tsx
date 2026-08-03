"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { label: string; value: string };

export type FilterDef = {
  key: string;
  placeholder: string;
  options: FilterOption[];
};

type Props = {
  basePath: string;
  searchPlaceholder?: string;
  filters: FilterDef[];
  current: Record<string, string>;
};

export function DataFilters({
  basePath,
  searchPlaceholder,
  filters,
  current,
}: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(current.q ?? "");

  function apply(next: Record<string, string>) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && key !== "page") p.set(key, value);
    }
    const s = p.toString();
    router.push(s ? `${basePath}?${s}` : basePath);
  }

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    apply({ ...current, q: q.trim() });
  }

  function onFilter(key: string, value: string | null) {
    apply({ ...current, [key]: value ?? "" });
  }

  const hasActive = Object.entries(current).some(
    ([key, value]) => key !== "page" && value,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {searchPlaceholder ? (
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-56 rounded-md border border-input bg-transparent pr-3 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" variant="outline" className="h-9">
            Search
          </Button>
        </form>
      ) : null}

      {filters.map((f) => {
        const labelMap = Object.fromEntries(
          f.options.map((o) => [o.value, o.label]),
        );
        return (
          <Select
            key={f.key}
            value={current[f.key] ?? ""}
            onValueChange={(v) => onFilter(f.key, v)}
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue>
                {(v) => (v ? labelMap[v] ?? v : f.placeholder)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{f.placeholder}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {hasActive ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => {
            setQ("");
            router.push(basePath);
          }}
        >
          <XIcon className="size-4" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
