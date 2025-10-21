import { useCallback, useMemo, useState, type ChangeEvent, type FC } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/messages";
import useSetMutation from "../hooks/useSetMutation";
import useSets from "../hooks/useSets";

import DeleteSetDialog from "./DeleteSetDialog";
import Pagination from "./Pagination";
import SetFormModal from "./SetFormModal";
import SetPreviewModal from "./SetPreviewModal";
import SetsDataTable from "./SetsDataTable";

import type { ListSetsQueryDto, SetDto, SetFormValues } from "@/types";

const DEFAULT_QUERY: ListSetsQueryDto = {
  page: 1,
  limit: 10,
  sort: "updated_at",
  order: "desc",
};

interface FormState {
  isOpen: boolean;
  mode: "create" | "edit";
  target: SetDto | null;
}

interface DeleteState {
  isOpen: boolean;
  target: SetDto | null;
}

interface PreviewState {
  isOpen: boolean;
  target: SetDto | null;
}

const SetsManager: FC = () => {
  const { data, error: listError, loading: listLoading, query, refetch, setQuery } = useSets(DEFAULT_QUERY);
  const {
    createSet,
    updateSet,
    deleteSet,
    error: mutationError,
    loading: mutationLoading,
    resetError,
  } = useSetMutation();

  const [formState, setFormState] = useState<FormState>({ isOpen: false, mode: "create", target: null });
  const [deleteState, setDeleteState] = useState<DeleteState>({ isOpen: false, target: null });
  const [previewState, setPreviewState] = useState<PreviewState>({ isOpen: false, target: null });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sets = data?.data ?? [];
  const meta = data?.meta;
  const currentPage = meta?.page ?? query.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const totalSets = meta?.total ?? 0;
  const currentSortField = query.sort ?? "updated_at";
  const currentSortOrder = query.order ?? "desc";

  const formInitialValues: SetFormValues = useMemo(() => {
    if (formState.mode === "edit" && formState.target) {
      return {
        name: formState.target.name,
        content: formState.target.content ?? "",
      } satisfies SetFormValues;
    }

    return { name: "", content: "" } satisfies SetFormValues;
  }, [formState.mode, formState.target]);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setStatusMessage(null);
      resetError();

      setQuery((previous) => ({
        ...previous,
        search: value ? value : undefined,
        page: 1,
      }));
    },
    [resetError, setQuery]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setStatusMessage(null);
      resetError();

      setQuery((previous) => ({
        ...previous,
        page: nextPage,
      }));
    },
    [resetError, setQuery]
  );

  const handleSortChange = useCallback(
    (field: NonNullable<ListSetsQueryDto["sort"]>) => {
      setStatusMessage(null);
      resetError();

      setQuery((previous) => {
        const isSameField = previous.sort === field;
        const nextOrder: NonNullable<ListSetsQueryDto["order"]> =
          isSameField && previous.order === "asc" ? "desc" : "asc";

        return {
          ...previous,
          sort: field,
          order: nextOrder,
          page: 1,
        } satisfies ListSetsQueryDto;
      });
    },
    [resetError, setQuery]
  );

  const openCreateModal = useCallback(() => {
    resetError();
    setStatusMessage(null);
    setFormState({ isOpen: true, mode: "create", target: null });
  }, [resetError]);

  const openEditModal = useCallback(
    (target: SetDto) => {
      resetError();
      setStatusMessage(null);
      setFormState({ isOpen: true, mode: "edit", target });
    },
    [resetError]
  );

  const closeFormModal = useCallback(() => {
    setFormState({ isOpen: false, mode: "create", target: null });
    resetError();
  }, [resetError]);

  const openPreviewModal = useCallback((target: SetDto) => {
    setPreviewState({ isOpen: true, target });
  }, []);

  const closePreviewModal = useCallback(() => {
    setPreviewState({ isOpen: false, target: null });
  }, []);

  const handleFormSubmit = useCallback(
    async (values: SetFormValues) => {
      if (formState.mode === "edit" && formState.target) {
        const result = await updateSet(formState.target.id, values);
        if (result) {
          closeFormModal();
          setStatusMessage(messages.sets.manager.statusUpdated);
          await refetch();
          return true;
        }
        return false;
      }

      const created = await createSet(values);
      if (created) {
        closeFormModal();
        setStatusMessage(messages.sets.manager.statusCreated);
        setQuery((previous) => ({
          ...previous,
          page: 1,
        }));
        return true;
      }

      return false;
    },
    [closeFormModal, createSet, formState.mode, formState.target, refetch, setQuery, updateSet]
  );

  const openDeleteDialog = useCallback(
    (target: SetDto) => {
      resetError();
      setStatusMessage(null);
      setDeleteState({ isOpen: true, target });
    },
    [resetError]
  );

  const closeDeleteDialog = useCallback(() => {
    setDeleteState({ isOpen: false, target: null });
    resetError();
  }, [resetError]);

  const handleDeleteConfirm = useCallback(async () => {
    const target = deleteState.target;
    if (!target) {
      return false;
    }

    const shouldGoBack = meta && meta.hasPrevious && sets.length === 1;
    const isSuccess = await deleteSet(target.id);

    if (!isSuccess) {
      return false;
    }

    closeDeleteDialog();
    setStatusMessage(messages.sets.manager.statusDeleted);

    if (shouldGoBack) {
      setQuery((previous) => ({
        ...previous,
        page: Math.max(1, (previous.page ?? 1) - 1),
      }));
      return true;
    }

    await refetch();
    return true;
  }, [closeDeleteDialog, deleteSet, deleteState.target, meta, refetch, setQuery, sets.length]);

  const showPagination = totalPages > 1 && sets.length > 0;

  return (
    <section className="flex flex-col gap-6" data-test-id="sets-manager">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[1.375rem] font-semibold leading-tight">{messages.sets.manager.title}</h2>
          <p className="text-[0.9375rem] text-muted-foreground">{messages.sets.manager.description}</p>
        </div>
        <Button type="button" onClick={openCreateModal} data-test-id="sets-create-button">
          {messages.sets.manager.createButton}
        </Button>
      </header>

      <div className="surface-raised flex flex-col gap-3 rounded-[var(--md-sys-shape-corner-extra-large)] border border-border p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-1 md:max-w-sm">
            <Label htmlFor="sets-search" className="text-foreground">
              {messages.sets.manager.searchLabel}
            </Label>
            <Input
              id="sets-search"
              type="search"
              placeholder={messages.sets.manager.searchPlaceholder}
              value={query.search ?? ""}
              onChange={handleSearchChange}
            />
          </div>
          <div className="text-[0.9375rem] text-muted-foreground">{messages.sets.manager.totalCount(totalSets)}</div>
        </div>

        {statusMessage ? (
          <p className="text-sm text-primary" data-test-id="sets-status-message">
            {statusMessage}
          </p>
        ) : null}
        {listError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{listError}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
              {messages.common.buttons.retry}
            </Button>
          </div>
        ) : null}
      </div>

      {!listError ? (
        <SetsDataTable
          sets={sets}
          loading={listLoading}
          onEdit={openEditModal}
          onDelete={openDeleteDialog}
          onPreview={openPreviewModal}
          onSortChange={handleSortChange}
          sortField={currentSortField}
          sortOrder={currentSortOrder}
        />
      ) : null}

      {showPagination && meta ? (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isDisabled={listLoading}
        />
      ) : null}

      <SetFormModal
        error={formState.isOpen ? mutationError : null}
        initialValues={formInitialValues}
        isOpen={formState.isOpen}
        loading={mutationLoading}
        mode={formState.mode}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <SetPreviewModal isOpen={previewState.isOpen} onClose={closePreviewModal} set={previewState.target} />

      <DeleteSetDialog
        error={deleteState.isOpen ? mutationError : null}
        isOpen={deleteState.isOpen}
        loading={mutationLoading}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        targetSet={deleteState.target}
      />
    </section>
  );
};

export default SetsManager;
