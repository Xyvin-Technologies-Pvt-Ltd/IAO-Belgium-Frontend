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
import { Eye, Download } from "lucide-react";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetApplications } from "@/store/useApplication";
import ViewApplication from "@/components/admin/application-review/ViewApplication";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";
import {
  getApplicationPreviousEducationOptions,
  resolvePreviousEducationLabel,
} from "@/utils/previousEducation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllLanguages } from "@/store/useDropdownStore";
import axiosInstance from "@/api/axiosintercepter";

const ApplicationReview = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [exportPending, setExportPending] = useState(false);

  // Filters State with Session Persistence
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("application_review_filters");
    return saved ? JSON.parse(saved) : {
      program_type: "All",
      program_name: "all",
      previous_education: "all",
      country: "all",
      city: "all",
      language: "all",
      payment_status: "all",
      status: "all",
      email: "",
      name: "",
      time_period: "all",
      start_date: "",
      end_date: "",
    };
  });

  // Sorting State with Session Persistence
  const [sorting, setSorting] = useState(() => {
    const saved = sessionStorage.getItem("application_review_sorting");
    return saved ? JSON.parse(saved) : {
      sortBy: "submitted_at",
      sortOrder: "asc"
    };
  });

  // Fetch languages dropdown list
  const { data: languagesData } = useGetAllLanguages({ limit: 1000 });
  const languagesList = languagesData?.data || [];

  // Save filters and sorting in session storage
  useEffect(() => {
    sessionStorage.setItem("application_review_filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem("application_review_sorting", JSON.stringify(sorting));
  }, [sorting]);

  const debouncedFilters = useDebounce(filters, 500);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, sorting]);

  const { data, isLoading, error, refetch, isFetching } = useGetApplications({
    page: page,
    limit: rowsPerPage,
    program_type: debouncedFilters.program_type,
    program_name: debouncedFilters.program_name,
    previous_education: debouncedFilters.previous_education,
    country: debouncedFilters.country,
    city: debouncedFilters.city,
    language: debouncedFilters.language,
    payment_status: debouncedFilters.payment_status,
    status: debouncedFilters.status,
    email: debouncedFilters.email,
    name: debouncedFilters.name,
    time_period: debouncedFilters.time_period,
    start_date: debouncedFilters.start_date,
    end_date: debouncedFilters.end_date,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder,
  });

  const admins = data?.data || [];
  const totalRows = data?.total_count || 0;
  const liveCounts = data?.counts || {
    "All": 0,
    "Master of Science": 0,
    "Lateral Entry Master of Science": 0,
    "Diploma": 0,
    "Manual Therapie": 0,
    "Post Academic Module": 0
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedApplication(null);
  };

  const handleSort = (field) => {
    setSorting((prev) => {
      const isSameField = prev.sortBy === field;
      return {
        sortBy: field,
        sortOrder: isSameField && prev.sortOrder === "asc" ? "desc" : "asc",
      };
    });
  };

  const handleExportExcel = async () => {
    try {
      setExportPending(true);
      const response = await axiosInstance.get("/application/export", {
        params: {
          program_type: filters.program_type,
          program_name: filters.program_name,
          previous_education: filters.previous_education,
          country: filters.country,
          city: filters.city,
          language: filters.language,
          payment_status: filters.payment_status,
          status: filters.status,
          email: filters.email,
          name: filters.name,
          time_period: filters.time_period,
          start_date: filters.start_date,
          end_date: filters.end_date,
          sortBy: sorting.sortBy,
          sortOrder: sorting.sortOrder,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `applications_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Exporting report failed:", err);
    } finally {
      setExportPending(false);
    }
  };

  const calculateDaysWaiting = (dateString) => {
    if (!dateString) return 0;
    const changedDate = new Date(dateString);
    const today = new Date();
    changedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - changedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const programTypes = [
    "All",
    "Master of Science",
    "Lateral Entry Master of Science",
    "Diploma",
    "Manual Therapie",
    "Post Academic Module"
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("applicationReview.title")}
        </h2>
        <Button
          disabled={exportPending}
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-10 px-4 shrink-0 shadow-sm transition-colors duration-150"
        >
          <Download className="w-4 h-4" />
          {exportPending ? t("applicationReview.exporting", "Exporting...") : t("applicationReview.exportExcel", "Export Excel")}
        </Button>
      </div>

      {/* Persistent glassmorphic program type tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b dark:border-white/10">
        {programTypes.map((type) => {
          const isActive = filters.program_type === type;
          const count = liveCounts[type] || 0;
          return (
            <button
              key={type}
              onClick={() => setFilters(prev => ({ ...prev, program_type: type }))}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#ff8904] text-white shadow-md shadow-[#ff8904]/30"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white/80"
              }`}
            >
              <span>{type === "All" ? t("applicationReview.tabs.all", "All") : type}</span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                isActive ? "bg-white text-[#ff8904]" : "bg-gray-200 dark:bg-white/15 text-gray-700 dark:text-white/90"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Combinable Filters Panel */}
      <div className="bg-white dark:bg-black/10 border dark:border-white/10 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.name", "Name")}</label>
            <Input
              placeholder={t("applicationReview.searchPlaceholder.name", "Search by name")}
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.email", "Email")}</label>
            <Input
              placeholder={t("applicationReview.searchPlaceholder.email", "Search by email")}
              value={filters.email}
              onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.programName", "Program Name")}</label>
            <Input
              placeholder={t("applicationReview.searchPlaceholder.programName", "Search program name")}
              value={filters.program_name === "all" ? "" : filters.program_name}
              onChange={(e) => setFilters(prev => ({ ...prev, program_name: e.target.value || "all" }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.country", "Country")}</label>
            <Input
              placeholder={t("applicationReview.searchPlaceholder.country", "Search country")}
              value={filters.country === "all" ? "" : filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value || "all" }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.city", "City")}</label>
            <Input
              placeholder={t("applicationReview.searchPlaceholder.city", "Search city")}
              value={filters.city === "all" ? "" : filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value || "all" }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.language", "Language")}</label>
            <Select
              value={filters.language}
              onValueChange={(val) => setFilters(prev => ({ ...prev, language: val }))}
            >
              <SelectTrigger className="w-full bg-background dark:border-white/20 dark:bg-black/10 text-dashboard-text dark:text-white h-10">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languagesList.map((lang) => (
                  <SelectItem key={lang._id} value={lang._id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.previousEducation", "Previous Education")}</label>
            <Select
              value={filters.previous_education}
              onValueChange={(val) => setFilters(prev => ({ ...prev, previous_education: val }))}
            >
              <SelectTrigger className="w-full bg-background dark:border-white/20 dark:bg-black/10 text-dashboard-text dark:text-white h-10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="physiotherapy">Physiotherapy</SelectItem>
                <SelectItem value="manual_therapy">Manual Therapy</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="osteopathy">Osteopathy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.paymentStatus", "Payment Status")}</label>
            <Select
              value={filters.payment_status}
              onValueChange={(val) => setFilters(prev => ({ ...prev, payment_status: val }))}
            >
              <SelectTrigger className="w-full bg-background dark:border-white/20 dark:bg-black/10 text-dashboard-text dark:text-white h-10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.status", "Application Status")}</label>
            <Select
              value={filters.status}
              onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            >
              <SelectTrigger className="w-full bg-background dark:border-white/20 dark:bg-black/10 text-dashboard-text dark:text-white h-10">
                <SelectValue placeholder="All Unreviewed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Unreviewed</SelectItem>
                <SelectItem value="drafted">Drafted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resubmitted">Resubmitted</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.timePeriod", "Time Period")}</label>
            <Select
              value={filters.time_period}
              onValueChange={(val) => setFilters(prev => ({ 
                ...prev, 
                time_period: val,
                // reset dates if not custom
                ...(val !== "custom" && { start_date: "", end_date: "" })
              }))}
            >
              <SelectTrigger className="w-full bg-background dark:border-white/20 dark:bg-black/10 text-dashboard-text dark:text-white h-10">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end col-span-1">
            <Button
              variant="outline"
              onClick={() => setFilters({
                program_type: filters.program_type,
                program_name: "all",
                previous_education: "all",
                country: "all",
                city: "all",
                language: "all",
                payment_status: "all",
                status: "all",
                email: "",
                name: "",
                time_period: "all",
                start_date: "",
                end_date: "",
              })}
              className="w-full h-10 border-gray-200 dark:border-white/10 text-dashboard-text dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
            >
              {t("applicationReview.filters.clear", "Clear Filters")}
            </Button>
          </div>
        </div>

        {filters.time_period === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t dark:border-white/5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.startDate", "Start Date")}</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full h-10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-white/70">{t("applicationReview.filters.endDate", "End Date")}</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full h-10"
              />
            </div>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("applicationReview.table.uid")}</TableHead>
            <TableHead>{t("applicationReview.table.name")}</TableHead>
            <TableHead>{t("applicationReview.table.email")}</TableHead>
            <TableHead>{t("applicationReview.table.programType", "Prog. Type")}</TableHead>
            <TableHead>{t("applicationReview.table.program", "Program Name")}</TableHead>
            <TableHead 
              onClick={() => handleSort("submitted_at")}
              className="cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-white/5 text-dashboard-text dark:text-white font-semibold"
            >
              <div className="flex items-center gap-1 justify-between">
                <span>{t("applicationReview.table.dateSubmitted", "Date Submitted")}</span>
                {sorting.sortBy === "submitted_at" && (
                  <span>{sorting.sortOrder === "asc" ? " ↑" : " ↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort("status_changed_at")}
              className="cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-white/5 text-dashboard-text dark:text-white font-semibold"
            >
              <div className="flex items-center gap-1 justify-between">
                <span>{t("applicationReview.table.daysWaiting", "Days Waiting")}</span>
                {sorting.sortBy === "status_changed_at" && (
                  <span>{sorting.sortOrder === "asc" ? " ↑" : " ↓"}</span>
                )}
              </div>
            </TableHead>
            <TableHead>{t("applicationReview.table.country")}</TableHead>
            <TableHead>{t("applicationReview.table.paymentStatus")}</TableHead>
            <TableHead>{t("applicationReview.table.status")}</TableHead>
            <TableHead>{t("applicationReview.table.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={11} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("applicationReview.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : admins?.length > 0 ? (
            admins?.map((i) => (
              <TableRow 
                key={i._id} 
                className={`cursor-pointer transition-colors duration-150 ${
                  i?.status === "resubmitted" 
                    ? "bg-orange-50/70 hover:bg-orange-100/80 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 border-l-4 border-l-[#ff8904]" 
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
                onClick={() => handleViewApplication(i)}
              >
                <TableCell>
                  {i?.uid}
                </TableCell>
                <TableCell className={"capitalize"}>{i?.user?.last_name}{" "}{i?.user?.first_name}</TableCell>
                <TableCell>{i?.user?.email}</TableCell>
                <TableCell>{i?.program_type || t("common.notAvailable")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{i?.program_name || t("common.notAvailable")}</TableCell>
                <TableCell>{formatDate(i?.submitted_at)}</TableCell>
                <TableCell className="text-center font-bold">
                  {calculateDaysWaiting(i?.status_changed_at)}
                </TableCell>
                <TableCell>{i?.user?.country || "-"}</TableCell>
                <TableCell><StatusBadge status={i?.payment_status} /></TableCell>
                <TableCell><StatusBadge status={i?.status} /></TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewApplication(i);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                {t("applicationReview.table.noApplications")}
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
        open={isViewModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
      />

    </div>
  );
};

export default ApplicationReview;
