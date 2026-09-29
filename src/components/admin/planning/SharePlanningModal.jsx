import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import SearchableMultiSelect from "@/components/ui/forms/SearchableMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2, Users, Info } from "lucide-react";
import { useUpdatePlanning, useGetPlanningById } from "@/store/usePlanningStore";
import {
  useGetBatches,
  useGetComponents,
  useGetAllPrograms,
  useGetUsers,
} from "@/store/useDropdownStore";
import { formatTZ } from "@/utils/dateUtils";

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id || value);
  return String(value);
};

const isPracticalComponent = (examComp) =>
  examComp?.linked_exam_type === "practical" ||
  examComp?.linked_exam?.type === "practical" ||
  examComp?.exam?.type === "practical";

/** Stable empty array so `|| []` fallbacks do not invalidate memo/effect deps every render. */
const EMPTY_ARRAY = [];

const SharePlanningModal = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");

  const [programSearch, setProgramSearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [sharedWithList, setSharedWithList] = useState([]);
  const [siblingOnlineExams, setSiblingOnlineExams] = useState([]);
  const [siblingPracticalExams, setSiblingPracticalExams] = useState([]);

  const updatePlanning = useUpdatePlanning();

  const planningId = planningData?._id;
  const { data: planningDetailData, isLoading: planningDetailLoading } =
    useGetPlanningById(planningId, { enabled: open && !!planningId });

  const fullPlanning = planningDetailData?.data || planningData;
  const primarySystemId = fullPlanning?.component?.system_id;
  const primaryComponentId = toId(fullPlanning?.component);
  const primaryProgramId = toId(fullPlanning?.component?.program);
  const targetComponentType = fullPlanning?.component?.type || "module";
  const selectedLanguageId =
    fullPlanning?.component?.program?.language?._id ||
    fullPlanning?.component?.program?.language ||
    "";

  useEffect(() => {
    if (fullPlanning && open) {
      const existingShared = (fullPlanning.shared_with || []).map((sw) => ({
        batch: toId(sw.batch),
        batch_name: sw.batch?.name || t("common.notAvailable", "N/A"),
        component: toId(sw.component),
        component_name: sw.component?.name || t("common.notAvailable", "N/A"),
        program_name: sw.component?.program?.name || "",
      }));
      setSharedWithList(existingShared);
    } else if (!open) {
      setSharedWithList([]);
      setSelectedProgram("");
      setSelectedBatch("");
      setSelectedComponent("");
      setSiblingOnlineExams((prev) => (prev.length === 0 ? prev : []));
      setSiblingPracticalExams((prev) => (prev.length === 0 ? prev : []));
      setTeacherSearch("");
    }
  }, [fullPlanning, open, t]);

  const { data: programsData, isLoading: programsLoading } = useGetAllPrograms(
    {
      is_online: false,
      ...(programSearch && { search: programSearch }),
      ...(primarySystemId && { system_id: primarySystemId }),
    },
    { enabled: open },
  );

  const programsRaw = open ? programsData?.data || [] : [];
  // Exclude the planning's own program — sharing targets other programmes only.
  const programs = programsRaw
    .filter((p) => !primaryProgramId || toId(p._id) !== primaryProgramId)
    .map((p) => ({
      _id: p._id,
      name: `${p.name} - ${p.city?.name || "N/A"} (${p.language?.name || "N/A"})`,
    }));

  const { data: batchesData, isLoading: batchesLoading } = useGetBatches(
    selectedProgram,
    {
      ...(batchSearch && { search: batchSearch }),
      include_closed: true,
    },
    { enabled: open && !!selectedProgram },
  );

  const { data: componentsData, isFetching: componentsFetching } =
    useGetComponents(
      {
        ...(componentSearch && { search: componentSearch }),
        program: selectedProgram,
        type: targetComponentType,
        status: true,
        ...(primarySystemId && { system_id: primarySystemId }),
      },
      { enabled: open && !!selectedProgram },
    );

  const sharedComponentKey = sharedWithList
    .map((sw) => toId(sw.component))
    .filter(Boolean)
    .sort()
    .join(",");

  const sharedComponentIds = useMemo(
    () => new Set(sharedComponentKey ? sharedComponentKey.split(",") : []),
    [sharedComponentKey],
  );

  // Always load the system_id family so save can keep primary exams and
  // drop sibling exams for removed shares.
  const { data: siblingExamsData, isLoading: siblingExamsLoading } =
    useGetComponents(
      {
        type: "exam",
        linked_module: primaryComponentId,
        include_siblings: true,
      },
      {
        enabled: open && !!primaryComponentId,
      },
    );

  const familyExamsList = useMemo(() => {
    if (!open || !primaryComponentId) return EMPTY_ARRAY;
    return siblingExamsData?.data || EMPTY_ARRAY;
  }, [open, primaryComponentId, siblingExamsData?.data]);

  const primaryExamComponentIds = useMemo(() => {
    const ids = new Set();
    familyExamsList.forEach((examComp) => {
      if (toId(examComp.linked_module) === primaryComponentId) {
        ids.add(toId(examComp._id));
      }
    });
    return ids;
  }, [familyExamsList, primaryComponentId]);

  const siblingExamsList = useMemo(
    () =>
      familyExamsList.filter((examComp) =>
        sharedComponentIds.has(toId(examComp.linked_module)),
      ),
    [familyExamsList, sharedComponentIds],
  );

  const siblingOnlineList = useMemo(
    () => siblingExamsList.filter((c) => !isPracticalComponent(c)),
    [siblingExamsList],
  );
  const siblingPracticalList = useMemo(
    () => siblingExamsList.filter((c) => isPracticalComponent(c)),
    [siblingExamsList],
  );

  const siblingOnlineKey = useMemo(
    () =>
      siblingOnlineList
        .map((c) => toId(c._id))
        .filter(Boolean)
        .sort()
        .join(","),
    [siblingOnlineList],
  );
  const siblingPracticalKey = useMemo(
    () =>
      siblingPracticalList
        .map((c) => toId(c._id))
        .filter(Boolean)
        .sort()
        .join(","),
    [siblingPracticalList],
  );

  const planningExamsKey = useMemo(() => {
    const online = (fullPlanning?.exams || [])
      .map(
        (ex) =>
          `${toId(ex.exam_component)}:${toId(ex.exam)}:${toId(ex.teacher)}:${ex.teacher_status || ""}`,
      )
      .join("|");
    const practical = (fullPlanning?.practical_exams || [])
      .map((ex) => {
        const teachers = (ex.teachers || [])
          .map((teacher) => toId(teacher?.teacher || teacher))
          .filter(Boolean)
          .sort()
          .join(",");
        return `${toId(ex.exam_component)}:${toId(ex.exam)}:${teachers}:${ex.exam_date || ""}`;
      })
      .join("|");
    return `${online}#${practical}`;
  }, [fullPlanning?.exams, fullPlanning?.practical_exams]);

  // Sync form state when sibling exam list or existing planned exams change
  useEffect(() => {
    if (!open || sharedComponentIds.size === 0) {
      setSiblingOnlineExams((prev) => (prev.length === 0 ? prev : []));
      setSiblingPracticalExams((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    if (siblingExamsLoading) return;

    const existingOnline = fullPlanning?.exams || EMPTY_ARRAY;
    const existingPractical = fullPlanning?.practical_exams || EMPTY_ARRAY;

    setSiblingOnlineExams((prev) => {
      const next = siblingOnlineList.map((examComp) => {
        const fromPrev = prev.find(
          (e) => toId(e.component) === toId(examComp._id),
        );
        const existing = existingOnline.find(
          (ex) => toId(ex.exam_component) === toId(examComp._id),
        );
        const name =
          examComp.linked_exam_name ||
          examComp.name ||
          existing?.exam?.name ||
          t("planningManagement.modal.examLabel", "Exam");

        if (fromPrev) {
          const exam = fromPrev.exam || examComp.linked_exam || "";
          if (fromPrev.name === name && fromPrev.exam === exam) return fromPrev;
          return { ...fromPrev, name, exam };
        }

        return {
          component: examComp._id,
          exam: examComp.linked_exam || existing?.exam?._id || existing?.exam || "",
          teacher: toId(existing?.teacher) || "",
          teacher_status: existing?.teacher_status || "pending",
          name,
        };
      });

      if (
        prev.length === next.length &&
        next.every((item, i) => item === prev[i])
      ) {
        return prev;
      }
      return next;
    });

    setSiblingPracticalExams((prev) => {
      const next = siblingPracticalList.map((examComp) => {
        const fromPrev = prev.find(
          (e) => toId(e.component) === toId(examComp._id),
        );
        const existing = existingPractical.find(
          (ex) => toId(ex.exam_component) === toId(examComp._id),
        );
        const name =
          examComp.linked_exam_name ||
          examComp.name ||
          existing?.exam?.name ||
          t("exam.form.practical", "Practical");

        if (fromPrev) {
          const exam = fromPrev.exam || examComp.linked_exam || "";
          if (fromPrev.name === name && fromPrev.exam === exam) return fromPrev;
          return {
            ...fromPrev,
            name,
            exam,
          };
        }

        return {
          component: examComp._id,
          exam: examComp.linked_exam || existing?.exam?._id || existing?.exam || "",
          teachers: (existing?.teachers || [])
            .map((teacher) => toId(teacher?.teacher || teacher))
            .filter(Boolean),
          exam_date: existing?.exam_date
            ? formatTZ(existing.exam_date, "YYYY-MM-DD")
            : "",
          name,
        };
      });

      if (
        prev.length === next.length &&
        next.every((item, i) => item === prev[i])
      ) {
        return prev;
      }
      return next;
    });
  }, [
    open,
    sharedComponentKey,
    sharedComponentIds.size,
    siblingExamsLoading,
    siblingOnlineKey,
    siblingPracticalKey,
    siblingOnlineList,
    siblingPracticalList,
    planningExamsKey,
    t,
  ]);

  const showStaffQuery =
    open && !!selectedLanguageId && sharedComponentIds.size > 0;

  const { data: teachersData, isLoading: teachersLoading } = useGetUsers(
    {
      ...(teacherSearch && { search: teacherSearch }),
      role: "teacher",
      teacher_role_key: "teacher",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: showStaffQuery },
  );

  const { data: assistantsData, isLoading: assistantsLoading } = useGetUsers(
    {
      ...(teacherSearch && { search: teacherSearch }),
      role: "teacher",
      teacher_role_key: "assistant",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: showStaffQuery },
  );

  const { data: traineesData, isLoading: traineesLoading } = useGetUsers(
    {
      ...(teacherSearch && { search: teacherSearch }),
      role: "teacher",
      teacher_role_key: "trainee",
      ...(selectedLanguageId && { language: selectedLanguageId }),
    },
    { enabled: showStaffQuery },
  );

  const batches = open && selectedProgram ? batchesData?.data || [] : [];
  const rawComponents = open && selectedProgram ? componentsData?.data || [] : [];

  const components = rawComponents
    .filter((c) => {
      // Only modules that share the planning component's system_id.
      if (!primarySystemId) return false;
      return String(c.system_id || "") === String(primarySystemId);
    })
    .map((comp) => {
      const linkedExams = (comp.linked_exams || []).filter((e) => e.name);
      if (linkedExams.length > 0) {
        const examNames = linkedExams.map((e) => e.name).join(", ");
        return {
          ...comp,
          name: `${comp.name} (Exam: ${examNames})`,
        };
      }
      return comp;
    });

  const allStaff = useMemo(() => {
    const teachers = teachersData?.data || [];
    const assistants = assistantsData?.data || [];
    const trainees = traineesData?.data || [];
    return [
      ...teachers.map((u) => ({ ...u, _role: "Teacher" })),
      ...assistants.map((u) => ({ ...u, _role: "Assistant" })),
      ...trainees.map((u) => ({ ...u, _role: "Trainee" })),
    ].filter((u, idx, arr) => arr.findIndex((x) => x._id === u._id) === idx);
  }, [teachersData, assistantsData, traineesData]);

  const staffItems = useMemo(
    () =>
      allStaff.map((staff) => ({
        _id: staff._id,
        name: staff.name
          ? `${staff.name} [${staff._role}]`
          : `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim() ||
            "Unknown",
      })),
    [allStaff],
  );

  const staffLoading =
    teachersLoading || assistantsLoading || traineesLoading;

  const handleAddLink = () => {
    if (!selectedBatch || !selectedComponent) return;

    const foundBatch = batches.find((b) => b._id === selectedBatch);
    const foundComp = components.find((c) => c._id === selectedComponent);
    const foundProg = programsRaw.find((p) => p._id === selectedProgram);

    if (sharedWithList.some((sw) => sw.batch === selectedBatch)) {
      return;
    }

    setSharedWithList((prev) => [
      ...prev,
      {
        batch: selectedBatch,
        batch_name:
          foundBatch?.name ||
          t("planningManagement.shareModal.groupFallback", "Group"),
        component: selectedComponent,
        component_name: foundComp?.name || "Module",
        program_name: foundProg?.name || "",
      },
    ]);

    setSelectedProgram("");
    setSelectedBatch("");
    setSelectedComponent("");
  };

  const handleRemoveLink = (index) => {
    setSharedWithList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSiblingOnline = (index, patch) => {
    setSiblingOnlineExams((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    );
  };

  const updateSiblingPractical = (index, patch) => {
    setSiblingPracticalExams((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    );
  };

  const handleSave = () => {
    if (!fullPlanning?._id) return;

    const payloadSharedWith = sharedWithList.map((sw) => ({
      batch: sw.batch,
      component: sw.component,
    }));

    const data = { shared_with: payloadSharedWith };

    const familyOnlineIds = new Set(
      familyExamsList
        .filter((c) => !isPracticalComponent(c))
        .map((c) => toId(c._id)),
    );
    const familyPracticalIds = new Set(
      familyExamsList
        .filter((c) => isPracticalComponent(c))
        .map((c) => toId(c._id)),
    );
    const primaryPracticalIds = new Set(
      familyExamsList
        .filter(
          (c) =>
            isPracticalComponent(c) &&
            toId(c.linked_module) === primaryComponentId,
        )
        .map((c) => toId(c._id)),
    );

    // Merge whenever we know the family (or have any planned exams) so removed
    // shares drop their sibling exams while primary exams stay intact.
    const shouldMergeExams =
      familyExamsList.length > 0 ||
      (fullPlanning.exams || []).length > 0 ||
      (fullPlanning.practical_exams || []).length > 0;

    if (shouldMergeExams) {
      const primaryOnline = (fullPlanning.exams || [])
        .filter((ex) => {
          const compId = toId(ex.exam_component);
          if (!compId) return false;
          if (primaryExamComponentIds.size > 0) {
            return primaryExamComponentIds.has(compId);
          }
          // Family loaded without primary online exams: drop sibling family rows
          if (familyOnlineIds.size > 0) {
            return !familyOnlineIds.has(compId);
          }
          return !siblingOnlineExams.some((s) => toId(s.component) === compId);
        })
        .map((ex) => ({
          component: toId(ex.exam_component),
          exam: toId(ex.exam),
          teacher: toId(ex.teacher) || null,
          teacher_status: ex.teacher_status || "pending",
        }));

      const siblingOnlinePayload = siblingOnlineExams.map((ex) => ({
        component: ex.component,
        exam: ex.exam,
        teacher: ex.teacher || null,
        teacher_status: ex.teacher_status || "pending",
      }));

      data.exams = [...primaryOnline, ...siblingOnlinePayload];

      const primaryPractical = (fullPlanning.practical_exams || [])
        .filter((ex) => {
          const compId = toId(ex.exam_component);
          if (!compId) return false;
          if (primaryPracticalIds.size > 0) {
            return primaryPracticalIds.has(compId);
          }
          if (familyPracticalIds.size > 0) {
            return !familyPracticalIds.has(compId);
          }
          return !siblingPracticalExams.some(
            (s) => toId(s.component) === compId,
          );
        })
        .map((ex) => ({
          component: toId(ex.exam_component),
          exam: toId(ex.exam),
          teachers: (ex.teachers || []).map((t) => ({
            teacher: toId(t?.teacher || t),
            status: t?.status || "pending",
          })),
          exam_date: ex.exam_date
            ? formatTZ(ex.exam_date, "YYYY-MM-DD")
            : "",
        }));

      // Only send complete sibling practicals — backend requires teachers + date
      const siblingPracticalPayload = siblingPracticalExams
        .filter(
          (ex) =>
            ex.exam_date &&
            Array.isArray(ex.teachers) &&
            ex.teachers.length > 0,
        )
        .map((ex) => ({
          component: ex.component,
          exam: ex.exam,
          teachers: (ex.teachers || []).map((teacherId) => ({
            teacher: teacherId,
            status: "pending",
          })),
          exam_date: ex.exam_date,
        }));

      data.practical_exams = [
        ...primaryPractical,
        ...siblingPracticalPayload,
      ];
    }

    updatePlanning.mutate(
      {
        id: fullPlanning._id,
        data,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  const showSiblingExamsSection =
    sharedWithList.length > 0 &&
    (siblingOnlineExams.length > 0 ||
      siblingPracticalExams.length > 0 ||
      siblingExamsLoading);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-lg flex flex-col">
        <div className="p-5 border-b dark:border-white/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t(
                "planningManagement.shareModal.title",
                "Share Planning with Cohort",
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {planningDetailLoading && (
            <p className="text-xs text-gray-500">
              {t("common.loading", "Loading...")}
            </p>
          )}

          {primarySystemId && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800/60 text-xs flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                {t("planningManagement.shareModal.matchingSystemIdNotice", {
                  defaultValue:
                    "Showing programmes that have a component with System ID: {{systemId}}",
                  systemId: primarySystemId,
                })}
              </span>
            </div>
          )}

          <div className="border p-4 rounded-lg dark:border-white/10 space-y-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {t(
                "planningManagement.shareModal.addCohortLink",
                "Add Additional Group / Component",
              )}
            </h3>

            <SearchableSelect
              label={t("planningManagement.modal.programLabel", "Target Program")}
              placeholder={t(
                "planningManagement.modal.searchPrograms",
                "Select Program...",
              )}
              items={programs}
              value={selectedProgram}
              onChange={(val) => {
                setSelectedProgram(val || "");
                setSelectedBatch("");
                setSelectedComponent("");
              }}
              onSearch={setProgramSearch}
              isLoading={programsLoading}
            />

            <SearchableSelect
              label={t("planningManagement.modal.batchLabel", "Target Group")}
              placeholder={t(
                "planningManagement.modal.batchPlaceholder",
                "Select group",
              )}
              items={batches}
              value={selectedBatch}
              onChange={(val) => setSelectedBatch(val || "")}
              onSearch={setBatchSearch}
              isLoading={batchesLoading}
              disabled={!selectedProgram}
            />

            <SearchableSelect
              label={t(
                "planningManagement.modal.moduleLabel",
                "Target Component",
              )}
              placeholder={t(
                "planningManagement.modal.modulePlaceholder",
                "Select Component...",
              )}
              items={components}
              value={selectedComponent}
              onChange={(val) => setSelectedComponent(val || "")}
              onSearch={setComponentSearch}
              isLoading={componentsFetching}
              disabled={!selectedProgram}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLink}
              disabled={!selectedBatch || !selectedComponent}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              {t(
                "planningManagement.shareModal.addLinkBtn",
                "Attach Cohort to Planning",
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t(
                "planningManagement.shareModal.currentlySharedWith",
                "Currently Shared Groups:",
              )}{" "}
              ({sharedWithList.length})
            </h3>

            {sharedWithList.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                {t(
                  "planningManagement.shareModal.noSharedBatches",
                  "No additional groups linked yet.",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {sharedWithList.map((sw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border dark:border-white/10 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {sw.batch_name}
                      </div>
                      <div className="text-gray-500 dark:text-white/60">
                        {sw.component_name}{" "}
                        {sw.program_name ? `(${sw.program_name})` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showSiblingExamsSection && (
            <div className="space-y-4 border-t dark:border-white/10 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(
                    "planningManagement.shareModal.siblingExamsTitle",
                    "Sibling Module Exams",
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
                  {t(
                    "planningManagement.shareModal.siblingExamsHint",
                    "Assign teachers for exams linked to the shared module(s).",
                  )}
                </p>
              </div>

              {siblingExamsLoading ? (
                <p className="text-xs text-gray-500">
                  {t("common.loading", "Loading...")}
                </p>
              ) : (
                <>
                  {siblingOnlineExams.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t("planningManagement.modal.examsLabel", "Exams")}
                      </Label>
                      {siblingOnlineExams.map((exam, index) => (
                        <div
                          key={exam.component}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50"
                        >
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {exam.name}
                          </h4>
                          <SearchableSelect
                            label={t(
                              "planningManagement.modal.examTeacherLabel",
                              "Exam Teacher",
                            )}
                            placeholder={t(
                              "planningManagement.modal.selectExamTeacher",
                              "Select exam teacher",
                            )}
                            searchPlaceholder={t(
                              "planningManagement.modal.searchTeachers",
                            )}
                            items={staffItems}
                            value={exam.teacher}
                            onChange={(value) =>
                              updateSiblingOnline(index, {
                                teacher: value || "",
                                teacher_status: "pending",
                              })
                            }
                            onSearch={setTeacherSearch}
                            isLoading={staffLoading}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {siblingPracticalExams.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t(
                          "planningManagement.modal.practicalExamsLabel",
                          "Practical Exams",
                        )}
                      </Label>
                      {siblingPracticalExams.map((exam, index) => {
                        const selectedTeachers = staffItems.filter((item) =>
                          (exam.teachers || [])
                            .map(String)
                            .includes(String(item._id)),
                        );
                        return (
                          <div
                            key={exam.component}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50"
                          >
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {exam.name}
                            </h4>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                {t(
                                  "planningManagement.modal.practicalExamDate",
                                  "Practical exam date",
                                )}{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="date"
                                value={exam.exam_date || ""}
                                onChange={(e) =>
                                  updateSiblingPractical(index, {
                                    exam_date: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <SearchableMultiSelect
                              label={t("exam.form.teachersLabel", "Teachers")}
                              placeholder={t(
                                "exam.form.teachersPlaceholder",
                                "Select Teachers",
                              )}
                              searchPlaceholder={t(
                                "exam.form.searchTeachers",
                                "Search Teachers",
                              )}
                              items={staffItems}
                              selected={selectedTeachers}
                              onChange={(selectedItems) =>
                                updateSiblingPractical(index, {
                                  teachers: selectedItems.map(
                                    (item) => item._id,
                                  ),
                                })
                              }
                              onSearch={setTeacherSearch}
                              isLoading={staffLoading}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!siblingExamsLoading &&
                    siblingOnlineExams.length === 0 &&
                    siblingPracticalExams.length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        {t(
                          "planningManagement.shareModal.noSiblingExams",
                          "No exams found for the shared module(s).",
                        )}
                      </p>
                    )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-white/20 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updatePlanning.isPending || planningDetailLoading}
            className="bg-primary text-white"
          >
            {updatePlanning.isPending
              ? t("common.saving", "Saving...")
              : t("common.saveChanges", "Save Shared Planning")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharePlanningModal;
