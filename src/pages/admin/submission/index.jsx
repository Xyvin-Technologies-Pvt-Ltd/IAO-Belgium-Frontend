import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetSubmissions, useBulkAssignTeacher } from "@/store/useSubmission";
import { useGetUsers } from "@/store/useDropdownStore";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";
import moment from "moment";
import SubmissionsFilterDrawer from "./SubmissionsFilterDrawer";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Submissions = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState({
    status: "all",
    submission_type: "all",
    program: "all",
    batch: "all",
    city: "all",
    language: "all",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: "all",
    submission_type: "all",
    program: "all",
    batch: "all",
    city: "all",
    language: "all",
  });

  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetSubmissions({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.status !== "all"
      ? { status: appliedFilters.status }
      : {}),
    ...(appliedFilters.submission_type !== "all"
      ? { submission_type: appliedFilters.submission_type }
      : {}),
    ...(appliedFilters.program !== "all"
      ? { program: appliedFilters.program }
      : {}),
    ...(appliedFilters.batch !== "all" ? { batch: appliedFilters.batch } : {}),
    ...(appliedFilters.city !== "all" ? { city: appliedFilters.city } : {}),
    ...(appliedFilters.language !== "all"
      ? { language: appliedFilters.language }
      : {}),
  });

  const { data: teachersData } = useGetUsers({ role: "teacher" });
  const teachers = teachersData?.data || [];

  const { mutate: bulkAssign, isPending: isBulkAssigning } = useBulkAssignTeacher();

  const submissionsData = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSubmissions(submissionsData.map((item) => item._id));
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedSubmissions((prev) => [...prev, id]);
    } else {
      setSelectedSubmissions((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkAssign = () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher first");
      return;
    }
    if (selectedSubmissions.length === 0) {
      toast.error("Please select at least one submission");
      return;
    }

    bulkAssign(
      {
        teacher_id: selectedTeacher,
        submission_ids: selectedSubmissions,
      },
      {
        onSuccess: (res) => {
          toast.success(`Successfully assigned teacher to ${res.data.modifiedCount} submissions`);
          setSelectedSubmissions([]);
          setSelectedTeacher("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to assign teacher");
        },
      }
    );
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        Submissions
      </h2>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("applicationReview.search", {
              defaultValue: "Search name, email, UID...",
            })}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SubmissionsFilterDrawer
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            setPage={setPage}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[200px] bg-white dark:bg-sidebar">
              <SelectValue placeholder="Select Teacher to Assign" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleBulkAssign}
            disabled={
              isBulkAssigning || selectedSubmissions.length === 0 || !selectedTeacher
            }
          >
            {isBulkAssigning ? "Assigning..." : "Assign Checked"}
          </Button>
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    submissionsData.length > 0 &&
                    selectedSubmissions.length === submissionsData.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Intake</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned Teacher</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={9} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-8">
                  <ErrorMessage
                    message={error?.message || "Failed to load submissions"}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : submissionsData?.length > 0 ? (
              submissionsData?.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSubmissions.includes(item._id)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(item._id, checked)
                      }
                      aria-label={`Select row ${item._id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {item?.student?.first_name} {item?.student?.last_name}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.component?.name}
                  >
                    {item?.component?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.program?.name}
                  >
                    {item?.program?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.intake?.name}
                  >
                    {item?.intake?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.batch?.name}
                  >
                    {item?.batch?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.city?.name}
                  >
                    {item?.city?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.language?.name}
                  >
                    {item?.language?.name || "-"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {item?.submission_type}
                  </TableCell>
                  <TableCell>
                    {item?.assigned_teacher && Object.keys(item.assigned_teacher).length > 0
                      ? `${item.assigned_teacher.first_name} ${item.assigned_teacher.last_name}`
                      : <span className="text-red-500">not assigned</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item?.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-4">
                  No submissions found.
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
      </div>
    </div>
  );
};

export default Submissions;
