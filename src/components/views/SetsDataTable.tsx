import type { FC } from "react";

import { Button } from "@/components/ui/button";
import type { ListSetsQueryDto, SetDto } from "@/types";

interface SetsDataTableProps {
  loading: boolean;
  onDelete: (set: SetDto) => void;
  onEdit: (set: SetDto) => void;
  onSortChange: (field: NonNullable<ListSetsQueryDto["sort"]>) => void;
  sortField: NonNullable<ListSetsQueryDto["sort"]>;
  sortOrder: NonNullable<ListSetsQueryDto["order"]>;
  sets: SetDto[];
}

const formatDate = (isoDate: string) => {
  if (!isoDate) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

const renderContentPreview = (content: string | null) => {
  if (!content) {
    return "—";
  }

  return content.length > 120 ? `${content.slice(0, 117)}...` : content;
};

const sortIndicator = (isActive: boolean, order: "asc" | "desc") => {
  if (!isActive) {
    return "↕";
  }

  return order === "asc" ? "↑" : "↓";
};

const SetsDataTable: FC<SetsDataTableProps> = ({
  loading,
  onDelete,
  onEdit,
  onSortChange,
  sortField,
  sortOrder,
  sets,
}) => {
  if (!loading && sets.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-[var(--md-sys-shape-corner-extra-large)] border border-dashed border-border bg-muted/40 p-6 text-muted-foreground">
        <h3 className="text-base font-semibold text-foreground">Brak zestawów</h3>
        <p className="text-sm text-muted-foreground">
          Dodaj pierwszy zestaw, aby przechowywać i organizować propozycje pieśni.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] border border-border bg-background shadow-[var(--md-sys-elevation-level-1)]">
      <table className="min-w-full divide-y divide-border/60">
        <thead className="bg-muted/40">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              aria-sort={sortField === "name" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-left text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                onClick={() => onSortChange("name")}
              >
                Nazwa zestawu <span aria-hidden>{sortIndicator(sortField === "name", sortOrder)}</span>
              </button>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              aria-sort={sortField === "content" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-left text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                onClick={() => onSortChange("content")}
              >
                Opis / zawartość <span aria-hidden>{sortIndicator(sortField === "content", sortOrder)}</span>
              </button>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              aria-sort={sortField === "updated_at" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-left text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                onClick={() => onSortChange("updated_at")}
              >
                Ostatnia aktualizacja <span aria-hidden>{sortIndicator(sortField === "updated_at", sortOrder)}</span>
              </button>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            ></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {loading ? (
            <tr>
              <td className="px-4 py-4" colSpan={4}>
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted/50" />
              </td>
            </tr>
          ) : null}
          {sets.map((set) => (
            <tr key={set.id} className="hover:bg-primary/5">
              <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-sm font-medium text-foreground">{set.name}</span>
                  <span className="text-xs text-muted-foreground">ID: {set.id}</span>
                </div>
              </td>
              <td className="px-4 py-4 align-top text-sm text-foreground/80">
                <span className="whitespace-pre-wrap font-mono">{renderContentPreview(set.content ?? "")}</span>
              </td>
              <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                {formatDate(set.updated_at ?? set.created_at)}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(set)}>
                    Edytuj
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(set)}>
                    Usuń
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SetsDataTable;
