"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </li>

        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <li key={`ellipsis-${i}`} aria-hidden="true">
              <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </li>
          ) : (
            <li key={page}>
              <Button
                variant={page === currentPage ? "accent" : "outline"}
                size="icon"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Page ${page}`}
                className="h-9 w-9 font-medium"
              >
                {page}
              </Button>
            </li>
          )
        )}

        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  );
};
