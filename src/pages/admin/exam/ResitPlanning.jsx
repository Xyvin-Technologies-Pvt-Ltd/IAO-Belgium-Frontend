import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGetExams } from "@/store/useExamStore";
import { useGetUsers } from "@/store/useDropdownStore";
import { useGetCities } from "@/store/useCityStore";
import { useGetResitPlannings, useCreateResitPlanning, useUpdateResitPlanning } from "@/store/useResitStore";
import { formatTZ } from "@/utils/dateUtils";
import { useCanModify } from "@/hooks/useCanModify";
import { Pencil } from "lucide-react";

const emptyForm = {
  exam: "",
  exam_date: "",
  location: "",
  location_address: "",
  teacher: "",
  teachers: [],
};

const ResitPlanningPage = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [examSearch, setExamSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [preferredVenues, setPreferredVenues] = useState([]);

  const { data, isLoading, error, refetch, isFetching } = useGetResitPlannings({
    page,
    limit: rowsPerPage,
  });
  const createPlanning = useCreateResitPlanning();
  const updatePlanning = useUpdateResitPlanning();
  const { data: examsData, isLoading: examsLoading } = useGetExams(
    { page: 1, limit: 50, status: "published", is_resit: true, ...(examSearch ? { search: examSearch } : {}) },
    { enabled: open },
  );
  const { data: citiesData, isLoading: citiesLoading } = useGetCities(
    {
      status: true,
      page: 1,
      limit: 200,
      ...(citySearch ? { search: citySearch } : {}),
    },
    { enabled: open },
  );

  const cities = (citiesData?.data || []).map((city) => ({
    _id: city._id,
    name: city.name,
    venue: city.venue || [],
  }));

  const handleCityChange = (value) => {
    const nextId = value || "";
    setSelectedCityId(nextId);
    if (!nextId) {
      setPreferredVenues([]);
      return;
    }
    const city = cities.find((item) => String(item._id) === String(nextId));
    setPreferredVenues(city?.venue || []);
  };

  const resitExams = (examsData?.data || []).map((exam) => ({
      _id: exam._id,
      type: exam.type,
      duration: exam.duration,
      name: exam.parent_exam?.name
        ? `${exam.name} — ${t("exam.resitOf", "Resit of")} ${exam.parent_exam.name}`
        : exam.name,
    }));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyForm });

  const selectedExamId = watch("exam");
  const selectedExam = resitExams.find((exam) => exam._id === selectedExamId);
  const isPractical =
    selectedExam?.type === "practical" || editing?.exam?.type === "practical";
  const selectedTeachers = watch("teachers") || [];
  const isSubmitting = createPlanning.isPending || updatePlanning.isPending;

  const { data: teachersData, isLoading: teachersQueryLoading } = useGetUsers(
    {
      role: "teacher",
      teacher_role_key: "teacher",
      ...(teacherSearch && { search: teacherSearch }),
    },
    { enabled: open },
  );

  const { data: assistantsData, isLoading: assistantsLoading } = useGetUsers(
    {
      role: "teacher",
      teacher_role_key: "assistant",
      ...(teacherSearch && { search: teacherSearch }),
    },
    { enabled: open },
  );

  const { data: traineesData, isLoading: traineesLoading } = useGetUsers(
    {
      role: "teacher",
      teacher_role_key: "trainee",
      ...(teacherSearch && { search: teacherSearch }),
    },
    { enabled: open },
  );

  const teachersLoading = teachersQueryLoading || assistantsLoading || traineesLoading;

  const teachersList = (open ? (teachersData?.data || []) : []).map((u) => ({ ...u, _role: "Teacher" }));
  const assistantsList = (open ? (assistantsData?.data || []) : []).map((u) => ({ ...u, _role: "Assistant" }));
  const traineesList = (open ? (traineesData?.data || []) : []).map((u) => ({ ...u, _role: "Trainee" }));

  const allStaff = [
    ...teachersList,
    ...assistantsList,
    ...traineesList,
  ].filter(
    (u, idx, arr) => arr.findIndex((x) => String(x._id) === String(u._id)) === idx
  );

  const teacherLabel = (user) => {
    const rawName = user?.name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      user?.email ||
      "";
    if (user?._role) {
      return `${rawName} [${user._role}]`;
    }
    return rawName;
  };

  const currentTeacher =
    editing?.teacher && typeof editing.teacher === "object"
      ? {
          _id: String(editing.teacher._id),
          name: teacherLabel(editing.teacher),
        }
      : null;

  const teacherItems = [
    ...(currentTeacher ? [currentTeacher] : []),
    ...selectedTeachers
      .filter((item) => item?._id)
      .map((item) => ({
        _id: String(item._id),
        name: teacherLabel(item),
      })),
    ...allStaff.map((user) => ({
      _id: String(user._id),
      name: teacherLabel(user),
    })),
  ].filter(
    (item, index, list) =>
      item.name &&
      list.findIndex((entry) => String(entry._id) === String(item._id)) === index,
  );

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setSelectedCityId("");
    setPreferredVenues([]);
    setCitySearch("");
    reset(emptyForm);
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedCityId("");
    setPreferredVenues([]);
    setCitySearch("");
    reset(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    const teacher = row.teacher?._id || row.teacher || "";
    setEditing(row);
    setSelectedCityId("");
    setPreferredVenues([]);
    setCitySearch("");
    reset({
      exam: row.exam?._id || row.exam || "",
      exam_date: row.exam_date ? formatTZ(row.exam_date, "YYYY-MM-DD") : "",
      location: row.location || "",
      location_address: row.location_address || "",
      teacher,
      teachers: (row.teachers || []).map((entry) => {
        const person = entry.teacher || {};
        return {
          _id: String(person._id || entry.teacher),
          name: teacherLabel(person),
        };
      }),
    });
    setOpen(true);
  };

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const rows = data?.data || [];
  const totalRows = data?.total_count || 0;

  const onSubmit = (values) => {
    const payload = {
      exam: values.exam,
      exam_date: values.exam_date,
      location: values.location,
      location_address: values.location_address,
    };
    if (isPractical) {
      payload.teachers = (values.teachers || []).map((item) => item._id || item);
    } else {
      payload.teacher = values.teacher;
    }
    const mutation = editing ? updatePlanning : createPlanning;
    const options = {
      onSuccess: () => {
        closeDialog();
        refetch();
      },
    };
    if (editing) {
      mutation.mutate({ id: editing._id, data: payload }, options);
    } else {
      mutation.mutate(payload, options);
    }
  };

  const teacherChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    }
  };

  const teacherName = (person) =>
    `${person?.last_name || ""} ${person?.first_name || ""}`.trim() || person?.name || "Unknown";

  const teacherCell = (row) => {
    const chips = [];
    if (row.teacher) {
      chips.push({
        _id: row.teacher._id || row.teacher,
        name: teacherName(row.teacher),
        status: row.teacher_status || "pending",
      });
    }
    (row.teachers || []).forEach((entry) => {
      const person = entry.teacher || {};
      const id = person._id || entry.teacher;
      if (!id || chips.some((c) => String(c._id) === String(id))) return;
      chips.push({
        _id: id,
        name: teacherName(person),
        status: entry.status || "pending",
      });
    });

    if (!chips.length) {
      return <span className="text-gray-500 text-sm">N/A</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {chips.map((p) => (
          <Badge
            key={p._id}
            variant="outline"
            className={`text-xs whitespace-nowrap ${teacherChipColor(p.status)}`}
            title={`${p.name} (${p.status})`}
          >
            {p.name}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("resitPlanning.title", "Resit planning")}
        </h2>
        {canModify && (
          <Button onClick={openCreate}>
            {t("resitPlanning.create", "Plan resit")}
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("resitPlanning.table.exam", "Resit exam")}</TableHead>
            <TableHead>{t("resitPlanning.table.parent", "Original exam")}</TableHead>
            <TableHead>{t("resitPlanning.table.date", "Date")}</TableHead>
            <TableHead>{t("resitPlanning.table.location", "Location")}</TableHead>
            <TableHead>{t("resitPlanning.table.teacher", "Teacher")}</TableHead>
            {canModify && (
              <TableHead className="w-[80px]">{t("resitPlanning.table.actions", "Actions")}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={canModify ? 6 : 5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={canModify ? 6 : 5} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("resitPlanning.loadFailed", "Failed to load resit plannings")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell className="font-medium">{row.exam?.name || "N/A"}</TableCell>
                <TableCell>{row.exam?.parent_exam?.name || "N/A"}</TableCell>
                <TableCell>
                  {row.exam_date ? formatTZ(row.exam_date, "DD-MM-YYYY") : "N/A"}
                </TableCell>
                <TableCell>{row.location || "N/A"}</TableCell>
                <TableCell>{teacherCell(row)}</TableCell>
                {canModify && (
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="cursor-pointer p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      title={t("common.edit", "Edit")}
                    >
                      <Pencil size={15} />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={canModify ? 6 : 5} className="text-center py-8 text-gray-400">
                {t("resitPlanning.empty", "No resit plannings yet")}
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("resitPlanning.edit", "Edit resit planning")
                : t("resitPlanning.create", "Plan resit")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {editing ? (
              <div className="space-y-2">
                <Label>{t("resitPlanning.form.exam", "Resit exam")}</Label>
                <Input
                  value={
                    editing.exam?.parent_exam?.name
                      ? `${editing.exam.name} — ${t("exam.resitOf", "Resit of")} ${editing.exam.parent_exam.name}`
                      : editing.exam?.name || ""
                  }
                  disabled
                />
                <input type="hidden" {...register("exam")} />
                {editing.exam?.duration && (
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span className="font-semibold">{t("exam.duration", "Duration")}:</span>
                    <span>{editing.exam.duration} {t("common.durationUnits.minute", "minutes")}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <SearchableSelect
                  label={t("resitPlanning.form.exam", "Resit exam")}
                  placeholder={t("resitPlanning.form.examPlaceholder", "Select a resit exam")}
                  searchPlaceholder={t("exam.search")}
                  items={resitExams}
                  value={watch("exam")}
                  onChange={(value) => {
                    setValue("exam", value || "", { shouldValidate: true });
                    setValue("teacher", "");
                    setValue("teachers", []);
                  }}
                  onSearch={setExamSearch}
                  isLoading={examsLoading}
                  required
                  error={errors.exam?.message}
                />
                <input type="hidden" {...register("exam", { required: t("resitPlanning.form.examRequired", "Resit exam is required") })} />
                {selectedExam?.duration && (
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span className="font-semibold">{t("exam.duration", "Duration")}:</span>
                    <span>{selectedExam.duration} {t("common.durationUnits.minute", "minutes")}</span>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>
                {t("resitPlanning.form.date", "Date")} <span className="text-red-500">*</span>
              </Label>
              <Input type="date" {...register("exam_date", { required: true })} />
            </div>
            <SearchableSelect
              label={t("resitPlanning.form.city", "City")}
              placeholder={t("resitPlanning.form.cityPlaceholder", "Select a city (optional)")}
              searchPlaceholder={t("resitPlanning.form.searchCities", "Search cities...")}
              items={cities}
              value={selectedCityId}
              onChange={handleCityChange}
              onSearch={setCitySearch}
              isLoading={citiesLoading}
            />
            <div className="space-y-2">
              <Label>
                {t("resitPlanning.form.location", "Location")} <span className="text-red-500">*</span>
              </Label>
              <Input {...register("location", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t("resitPlanning.form.address", "Address")}</Label>
              <Input {...register("location_address")} />
            </div>
            {preferredVenues.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  {t("planningManagement.modal.preferredVenues", "Preferred venues")}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {preferredVenues.map((venueObj, index) => {
                    const venueName = typeof venueObj === "string" ? venueObj : venueObj.name;
                    const venueAddress =
                      typeof venueObj === "string" ? "" : venueObj.address || "";
                    if (!venueName) return null;
                    return (
                      <button
                        key={`${venueName}-${index}`}
                        type="button"
                        onClick={() => {
                          setValue("location", venueName, { shouldValidate: true });
                          setValue("location_address", venueAddress, { shouldValidate: true });
                        }}
                        className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs mr-2 mb-1"
                        title={venueAddress || venueName}
                      >
                        {venueName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {isPractical ? (
              <SearchableMultiSelect
                label={t("resitPlanning.form.teachers", "Teachers")}
                placeholder={t("resitPlanning.form.teachersPlaceholder", "Select teachers")}
                searchPlaceholder={t("resitPlanning.form.searchTeachers", "Search teachers...")}
                items={teacherItems}
                selected={selectedTeachers}
                onChange={(items) => setValue("teachers", items, { shouldValidate: true })}
                onSearch={setTeacherSearch}
                isLoading={teachersLoading}
                required
                error={errors.teachers?.message}
              />
            ) : (
              <SearchableSelect
                label={t("resitPlanning.form.teacher", "Teacher")}
                placeholder={t("resitPlanning.form.teacherPlaceholder", "Select a teacher")}
                searchPlaceholder={t("resitPlanning.form.searchTeachers", "Search teachers...")}
                items={teacherItems}
                value={watch("teacher") ? String(watch("teacher")) : ""}
                onChange={(value) => setValue("teacher", value || "", { shouldValidate: true })}
                onSearch={setTeacherSearch}
                isLoading={teachersLoading}
                required
                disabled={!selectedExamId}
                error={errors.teacher?.message}
              />
            )}
            <input
              type="hidden"
              {...register(isPractical ? "teachers" : "teacher", {
                validate: (value) => {
                  if (isPractical) return (value && value.length > 0) || t("resitPlanning.form.teacherRequired", "Teacher is required");
                  return !!value || t("resitPlanning.form.teacherRequired", "Teacher is required");
                },
              })}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.saving", "Saving...")
                  : editing
                    ? t("resitPlanning.update", "Update planning")
                    : t("resitPlanning.save", "Save planning")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResitPlanningPage;
