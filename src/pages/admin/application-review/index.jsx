import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import StatusBadge from "@/components/StatusBadge";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetLocations } from "@/store/useLocation";
import ViewApplication from "@/components/admin/application-review/ViewApplication";

const ApplicationReview = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetLocations({
    page_no: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const reviews = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenView = (id) => {
    setReviewId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text">Application review</h2>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Search..."
            className="max-w-xs"
            value={search}
            whiteBg
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load applications"}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : reviews?.length > 0 ? (
            reviews?.map((i) => (
              <TableRow key={i._id}>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.description}</TableCell>
                <TableCell>{i?.duration}</TableCell>
                <TableCell>{i?.level}</TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: "View",
                        icon: Eye,
                        onClick: () => handleOpenView(i._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No application found
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

      <ViewApplication
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicationId={reviewId}
      />
    </div>
  );
};

export default ApplicationReview;
