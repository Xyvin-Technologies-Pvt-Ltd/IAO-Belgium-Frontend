import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetSubmissions, useBulkAssignTeacher, useBulkEnableResubmission } from "@/store/useSubmission";
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
  const [activeStatus, setActiveStatus] = useState("submitted");
  const [draftFilters, setDraftFilters] = useState({
    submission_type: "all",
    program: "all",
    batch: "all",
    city: "all",
    language: "all",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    submission_type: "all",
    program: "all",
    batch: "all",
    city: "all",
    language: "all",
  });

  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error, refetch, isFetching } = useGetSubmissions({
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeStatus !== "all" && activeStatus !== "assigned" ? { status: activeStatus } : {}),
    ...(activeStatus === "assigned" ? { has_assigned_teacher: "true" } : {}),
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
  const { mutate: enableResubmission, isPending: isEnablingResubmission } = useBulkEnableResubmission();

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

  const handleEnableResubmission = () => {
    enableResubmission(
      { submission_ids: selectedSubmissions },
      {
        onSuccess: () => {
          toast.success("Resubmission enabled for selected submissions.");
          setSelectedSubmissions([]);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to enable resubmissions");
        },
      }
    );
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        Submissions
      </h2>

      {/* Status Tabs */}
      <div className="border-b border-gray-200 dark:border-white/20">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {["all", "submitted", "assigned", "passed", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => { setActiveStatus(status); setPage(1); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap capitalize ${
                activeStatus === status
                  ? "border-[#ff8904] text-[#ff8904]"
                  : "border-transparent text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
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
          {!selectedSubmissions.some(id => {
            const sub = submissionsData.find(s => s._id === id);
            return sub && sub.status === "failed";
          }) && (
            <>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-50 bg-white dark:bg-sidebar">
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
            </>
          )}
          {selectedSubmissions.length > 0 && selectedSubmissions.every(id => {
            const sub = submissionsData.find(s => s._id === id);
            return sub && sub.status === "failed";
          }) && (
            <Button
              onClick={handleEnableResubmission}
              disabled={isEnablingResubmission}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isEnablingResubmission ? "Enabling..." : "Enable Resubmission"}
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5">
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
              <TableHead>Resubmission</TableHead>
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
                  <TableCell className={"capitalize"}>
                    {item?.student?.last_name} {item?.student?.first_name}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.component?.name}
                  >
                    {item?.component?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.program?.name}
                  >
                    {item?.program?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.intake?.name}
                  >
                    {item?.intake?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.batch?.name}
                  >
                    {item?.batch?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.city?.name}
                  >
                    {item?.city?.name || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-37.5 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={item?.language?.name}
                  >
                    {item?.language?.name || "-"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {item?.submission_type}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item?.resubmission_enabled ? true : false} />
                  </TableCell>
                  <TableCell className={"capitalize"}>
                    {item?.assigned_teacher && Object.keys(item.assigned_teacher).length > 0
                      ? `${item.assigned_teacher.last_name} ${item.assigned_teacher.first_name}`
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
