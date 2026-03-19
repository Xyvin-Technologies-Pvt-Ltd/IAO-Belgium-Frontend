import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import CreateComponent from "./CreateComponent";
import ViewComponent from "./ViewComponent";
import { useGetComponents } from "@/store/useComponentStore";
import StatusBadge from "@/components/StatusBadge";

const ResourceModule = ({ programId, onComponentCreated ,languageId}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetComponents({
    type: "resource",
    program: programId,
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const modules = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenEdit = (i) => {
    setSelectedModule(i);
    setIsModalOpen(true);
  };

  const handleViewModule = (module) => {
    setSelectedModule(module);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("resourceModule.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          onClick={() => {
            setSelectedModule(null);
            setIsModalOpen(true);
          }}
        >
          {t("programDetail.emptyState.createButton")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("resourceModule.table.resourceUID")}</TableHead>
            <TableHead>{t("resourceModule.table.resourceName")}</TableHead>
            <TableHead>{t("resourceModule.table.year")}</TableHead>
            <TableHead>{t("resourceModule.table.files")}</TableHead>
            <TableHead>{t("resourceModule.table.status")}</TableHead>
            <TableHead>{t("resourceModule.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("resourceModule.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : modules?.length > 0 ? (
            modules?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewModule(i)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.year}</TableCell>
                <TableCell>{i?.files?.length}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("resourceModule.table.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(i),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("resourceModule.table.noResources")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />

      <CreateComponent
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        componentData={selectedModule}
        programId={programId}
        preselectedType="resource"
        onComponentCreated={(componentType) => {
          setSelectedModule(null);
          setIsModalOpen(false);
          refetch();
          // Call parent callback if provided
          if (onComponentCreated) {
            onComponentCreated(componentType);
          }
        }}
        programLanguageId={languageId}
      />

      <ViewComponent
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        componentData={selectedModule}
      />
    </div>
  );
};

export default ResourceModule;
