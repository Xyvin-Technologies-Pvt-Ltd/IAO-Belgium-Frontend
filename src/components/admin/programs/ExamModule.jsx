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
import { Edit } from "lucide-react";
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
import moment from "moment";

const ExamModule = ({ programId, onComponentCreated,languageId }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetComponents({
    type: "exam",
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
          placeholder={t("appModule.search") || "Search exam components..."}
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
          {t("programDetail.emptyState.createButton") || "Add Exam Component"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exam Module ID</TableHead>
            <TableHead>Linked Exam</TableHead>
            <TableHead>Linked Module</TableHead>
             <TableHead>{t("appModule.table.status") || "Status"}</TableHead>
            <TableHead>{t("appModule.table.actions") || "Actions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("appModule.messages.loadFailed") || "Failed to load"}
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
                <TableCell>{i?.linked_exam?.name || "N/A"}</TableCell>
                <TableCell>{i?.linked_module?.name || "N/A"}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("appModule.table.edit") || "Edit",
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
              <TableCell colSpan={5} className="text-center">
                {"No Exam Components Found"}
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
        preselectedType="exam"
        onComponentCreated={(componentType) => {
          setSelectedModule(null);
          setIsModalOpen(false);
          refetch();
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

export default ExamModule;
