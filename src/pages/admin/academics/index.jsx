import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetAcademic, useDuplicateAcademic } from "@/store/useAcademicStore";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import image from "../../../assets/images/no-academic.png";
import CreateAcademic from "@/components/admin/academic/CreateAcademic";
import AcademicCard from "@/components/admin/academic/AcademicCard";

const Academics = () => {
  const { t } = useTranslation();
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcademic, setEditingAcademic] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetAcademic({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const duplicateAcademicMutation = useDuplicateAcademic();

  const academics = data?.data || [];
  const totalRows = data?.total || 0;

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: "Admission administration",
        path: "/admin/admission-administration",
        navigable: false,
      },
      {
        label: "Academic Years",
        path: "/admin/admission-administration/academics",
        navigable: false,
      },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingAcademic(null);
    setIsModalOpen(true);
  };

  const handleEdit = (academic) => {
    setEditingAcademic(academic);
    setIsModalOpen(true);
  };

  const handleDuplicate = (academic) => {
    duplicateAcademicMutation.mutate({
      id: academic._id,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAcademic(null);
  };

  if (isLoading) {
    return <LoadingState text={t("academicManagement.messages.loadFailed")} fullHeight />;
  }

  if (error) {
    return (
      <div className="space-y-6 mt-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("academicManagement.title")}
        </h2>
        <ErrorMessage 
          message={t("academicManagement.messages.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("academicManagement.title")}
      </h2>

      {academics.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <Input
            placeholder={t("academicManagement.search")}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button onClick={handleOpenCreate}>
            {t("academicManagement.createAcademic")}
          </Button>
        </div>
      )}

      {!isLoading && academics.length === 0 && !debouncedSearch && (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center bg-sidebar rounded-xl p-5 border border-sidebar-border">
          <img
            src={image}
            alt="No academics"
            className="w-64 mb-4 opacity-80"
          />
          <h3 className="text-lg font-semibold text-sidebar-foreground">
            {t("academicManagement.emptyState.title")}
          </h3>
          <p className="text-sm text-sidebar-foreground/70 max-w-md mt-1">
            {t("academicManagement.emptyState.subtitle")}
          </p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            {t("academicManagement.createAcademic")}
          </Button>
        </div>
      )}

      {academics.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {academics.map((academic) => (
              <AcademicCard
                key={academic._id || academic.id}
                academic={academic}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {totalRows > rowsPerPage && (
            <Pagination
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalRows={totalRows}
              selected={0}
            />
          )}
        </>
      )}

      <CreateAcademic
        open={isModalOpen}
        onClose={handleCloseModal}
        academicData={editingAcademic}
      />
    </div>
  );
};

export default Academics;
