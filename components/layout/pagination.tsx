import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  makeHref: (page: number) => string;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  makeHref,
}: Props) {
  if (totalPages <= 1) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground md:px-6">
        {totalItems} result{totalItems === 1 ? "" : "s"}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 md:px-6">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems} total
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={makeHref(currentPage - 1)}
          aria-disabled={currentPage <= 1}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            currentPage <= 1
              ? "pointer-events-none opacity-50"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Prev
        </Link>
        <Link
          href={makeHref(currentPage + 1)}
          aria-disabled={currentPage >= totalPages}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            currentPage >= totalPages
              ? "pointer-events-none opacity-50"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
