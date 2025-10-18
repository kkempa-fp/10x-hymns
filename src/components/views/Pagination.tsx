import type { FC } from "react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  isDisabled?: boolean;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}

const Pagination: FC<PaginationProps> = ({ isDisabled = false, onPageChange, page, totalPages }) => {
  const safeTotal = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
  const clampedPage = Math.min(Math.max(page, 1), safeTotal);
  const canGoBack = !isDisabled && clampedPage > 1;
  const canGoForward = !isDisabled && clampedPage < safeTotal;

  const handlePrevious = () => {
    if (canGoBack) {
      onPageChange(clampedPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      onPageChange(clampedPage + 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
      <p className="text-sm text-neutral-600">
        Strona {clampedPage} z {safeTotal}
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePrevious} disabled={!canGoBack}>
          Poprzednia
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleNext} disabled={!canGoForward}>
          Następna
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
