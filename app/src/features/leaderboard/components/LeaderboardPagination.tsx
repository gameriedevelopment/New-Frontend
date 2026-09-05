import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { getLeaderboardPageItems } from "../pagination";

interface LeaderboardPaginationProps {
  currentPage: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function LeaderboardPagination({
  currentPage,
  totalPages,
  disabled = false,
  onPageChange,
}: LeaderboardPaginationProps) {
  if (totalPages <= 1) return null;

  const items = getLeaderboardPageItems(currentPage, totalPages);
  const goTo = (page: number) => {
    if (!disabled && page !== currentPage && page >= 1 && page <= totalPages) onPageChange(page);
  };

  return (
    <nav className="leaderboard-pagination" aria-label="Leaderboard pages">
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div>
        <button
          type="button"
          className="leaderboard-pagination__edge"
          onClick={() => goTo(1)}
          disabled={disabled || currentPage === 1}
          aria-label="First page"
          title="First page"
        >
          <ChevronFirst size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {items.map((item) =>
          typeof item === "number" ? (
            <button
              type="button"
              key={item}
              onClick={() => goTo(item)}
              disabled={disabled}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </button>
          ) : (
            <span className="leaderboard-pagination__ellipsis" aria-hidden="true" key={item}>
              ...
            </span>
          ),
        )}
        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="leaderboard-pagination__edge"
          onClick={() => goTo(totalPages)}
          disabled={disabled || currentPage === totalPages}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronLast size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
