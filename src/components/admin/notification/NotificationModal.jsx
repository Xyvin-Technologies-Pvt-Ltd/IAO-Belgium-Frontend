import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Users, Check, ChevronRight, Bell, GraduationCap, Paperclip, Trash2, UploadCloud, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/api/uploadApi";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  useGetAllCities,
  useGetAllCountries,
  useGetAllLanguages,
  useGetProgramsByCitiesAndLanguages,
  useGetComponents,
  useGetAllAcademicYears,
  useGetBatches,
} from "@/store/useDropdownStore";
import {
  useCreateAdminNotification,
  useUpdateAdminNotification,
  usePreviewNotificationCount,
  useGetSavedAudiences,
  useCreateSavedAudience,
  useDeleteSavedAudience,
} from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";
import moment from "moment";



const SinglePillGroup = ({ label, options, selected, onChange, valueKey = "_id", labelKey = "name" }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex flex-wrap gap-1.5">
      {options?.map((opt, i) => {
        const isObj = typeof opt === "object" && opt !== null;
        const val = isObj ? opt[valueKey] : opt;
        const displayLabel = isObj ? opt[labelKey] : opt;
        if (val === undefined || val === null) return null;
        const isSelected = selected === val;
        return (
          <button
            key={val || i}
            type="button"
            onClick={() => onChange(isSelected ? "" : val)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  </div>
);

const AudienceFilters = ({
  year, onYearChange,
  language, onLanguageChange,
  city, onCityChange,
  country, onCountryChange,
  program, onProgramChange,
  batch, onBatchChange,
  component, onComponentChange,
  academicYear, onAcademicYearChange,
  languagesData,
  citiesData,
  countriesData,
  programsData,
  batchesData,
  componentsData,
  academicYearsData,
}) => (
  <div className="space-y-4">
    <SinglePillGroup label="Language Group" options={languagesData?.data || []} selected={language} onChange={onLanguageChange} />
    <SinglePillGroup label="Year/Level" options={[1,2,3,4,5].map(y => ({ id: String(y), label: String(y) }))} valueKey="id" labelKey="label" selected={year} onChange={onYearChange} />
    <SinglePillGroup label="Academic Year" options={academicYearsData?.data || []} selected={academicYear} onChange={onAcademicYearChange} />
    <SinglePillGroup label="Country" options={countriesData?.data || []} selected={country} onChange={onCountryChange} />
    {country && (
      <SinglePillGroup label="City" options={citiesData?.data || []} selected={city} onChange={onCityChange} />
    )}
    {(city || language) && (
      <SinglePillGroup
        label="Course"
        options={programsData?.data?.map(p => ({
          ...p,
          displayName: `${p.name} (${p.city?.name || "N/A"} - ${p.language?.name || "N/A"})`
        })) || []}
        selected={program}
        onChange={onProgramChange}
        labelKey="displayName"
      />
    )}
    {program && batchesData?.data?.length > 0 && (
      <SinglePillGroup
        label="Batch"
        options={batchesData.data}
        selected={batch}
        onChange={onBatchChange}
      />
    )}
    {program && (
      <SinglePillGroup
        label="Modules"
        options={componentsData?.data || []}
        selected={component}
        onChange={onComponentChange}
      />
    )}
  </div>
);

const NotificationModal = ({ open, onClose, notification = null }) => {
  const { t } = useTranslation();
  const isEdit = !!notification;

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(notification?.type === "student_corner" ? "student_corner" : "notification");
  const [isGlobal, setIsGlobal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [inlineImages, setInlineImages] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  const [scYear, setScYear] = useState("");
  const [scLanguage, setScLanguage] = useState("");
  const [scProgram, setScProgram] = useState("");
  const [scBatch, setScBatch] = useState("");
  const [scComponent, setScComponent] = useState("");
  const [scAcademicYear, setScAcademicYear] = useState("");
  const [scCity, setScCity] = useState("");
  const [scCountry, setScCountry] = useState("");

  const [previewCount, setPreviewCount] = useState(null);

  const { data: countriesData } = useGetAllCountries({ status: "active" }, { enabled: open && step === 2 });
  const { data: languagesData } = useGetAllLanguages({ status: "active" }, { enabled: open && step === 2 });
  const { data: academicYearsData } = useGetAllAcademicYears({ status: true }, { enabled: open && step === 2 });

  // Cascaded: cities filtered by selected country, programs by selected city or language
  const activeCountry = category === "notification" ? selectedCountry : scCountry;
  const activeLanguage = category === "notification" ? selectedLanguage : scLanguage;
  const activeCity = category === "notification" ? selectedCity : scCity;

  const { data: citiesData } = useGetAllCities({
    status: "active",
    ...(activeCountry ? { country: activeCountry } : {}),
  }, { enabled: open && step === 2 && !!activeCountry });
  const { data: programsData } = useGetProgramsByCitiesAndLanguages(activeCity, activeLanguage, { enabled: open && step === 2 && (!!activeCity || !!activeLanguage) });

  const activeProgram = category === "notification" ? selectedProgram : scProgram;
  const { data: batchesData } = useGetBatches(activeProgram, {}, { enabled: open && step === 2 && !!activeProgram });

  const { data: componentsData } = useGetComponents({
    program: activeProgram,
    type: "module",
    status: "active"
  }, { enabled: open && step === 2 && !!activeProgram });

  const { register, trigger, getValues, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { subject: "", expiry_date: "" },
  });

  const createMutation = useCreateAdminNotification();
  const updateMutation = useUpdateAdminNotification();
  const previewMutation = usePreviewNotificationCount();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const currentUser = useAuthStore(state => state.user);
  const { data: savedAudiencesData } = useGetSavedAudiences({ enabled: open && step === 2 });
  const savedAudiences = savedAudiencesData?.data || [];
  const createSavedAudienceMutation = useCreateSavedAudience();
  const deleteSavedAudienceMutation = useDeleteSavedAudience();

  const [saveAudienceName, setSaveAudienceName] = useState("");
  const [showSaveAudiencePopup, setShowSaveAudiencePopup] = useState(false);

  const hasCurrentFilters = () => {
    if (category === "notification") {
      return selectedBatch || selectedYear || selectedLanguage || selectedProgram || selectedComponent || selectedAcademicYear || selectedCity || selectedCountry;
    } else {
      return !isGlobal && (scBatch || scYear || scLanguage || scProgram || scComponent || scAcademicYear || scCity || scCountry);
    }
  };

  const getCurrentFiltersObject = () => {
    const filters = {};
    if (category === "notification") {
      if (selectedYear) filters.year = selectedYear;
      if (selectedProgram) filters.course = selectedProgram;
      if (selectedComponent) filters.component = selectedComponent;
      if (selectedAcademicYear) filters.academic_year = selectedAcademicYear;
      if (selectedCity) filters.city = selectedCity;
      if (selectedCountry) filters.country = selectedCountry;
      if (selectedLanguage) filters.language = selectedLanguage;
    } else {
      if (scYear) filters.year = scYear;
      if (scProgram) filters.course = scProgram;
      if (scComponent) filters.component = scComponent;
      if (scAcademicYear) filters.academic_year = scAcademicYear;
      if (scCity) filters.city = scCity;
      if (scCountry) filters.country = scCountry;
      if (scLanguage) filters.language = scLanguage;
    }
    return filters;
  };

  const handleSaveAudience = async () => {
    if (!saveAudienceName.trim()) return;
    const filters = getCurrentFiltersObject();
    
    createSavedAudienceMutation.mutate(
      { name: saveAudienceName, filters },
      {
        onSuccess: () => {
          setSaveAudienceName("");
          setShowSaveAudiencePopup(false);
        }
      }
    );
  };

  const applySavedAudience = (filters) => {
    if (category === "notification") {
      setSelectedYear(filters.year || "");
      setSelectedLanguage(filters.language || "");
      setSelectedCountry(filters.country || "");
      setSelectedCity(filters.city || "");
      setSelectedProgram(filters.course || "");
      setSelectedComponent(filters.component || "");
      setSelectedAcademicYear(filters.academic_year || "");
    } else {
      setScYear(filters.year || "");
      setScLanguage(filters.language || "");
      setScCountry(filters.country || "");
      setScCity(filters.city || "");
      setScProgram(filters.course || "");
      setScComponent(filters.component || "");
      setScAcademicYear(filters.academic_year || "");
      setIsGlobal(false);
    }
  };

  const resetAll = () => {
    setStep(1); setPreviewCount(null); setIsGlobal(false);
    setSelectedYear(""); setSelectedLanguage(""); setSelectedProgram(""); setSelectedBatch(""); setSelectedComponent(""); setSelectedAcademicYear(""); setSelectedCity(""); setSelectedCountry("");
    setScYear(""); setScLanguage(""); setScProgram(""); setScBatch(""); setScComponent(""); setScAcademicYear(""); setScCity(""); setScCountry("");
    setAttachments([]); setUploadStatus(""); setInlineImages([]);
  };

  // When country changes, clear city and program
  const handleCountryChange = (val) => {
    if (category === "notification") {
      setSelectedCountry(val); setSelectedCity(""); setSelectedProgram(""); setSelectedBatch(""); setSelectedComponent(""); setSelectedAcademicYear("");
    } else {
      setScCountry(val); setScCity(""); setScProgram(""); setScBatch(""); setScComponent(""); setScAcademicYear("");
    }
  };

  // When city changes, clear program
  const handleCityChange = (val) => {
    if (category === "notification") {
      setSelectedCity(val); setSelectedProgram("");
    } else {
      setScCity(val); setScProgram("");
    }
  };

  // When language changes, clear program and component
  const handleLanguageChange = (val) => {
    if (category === "notification") {
      setSelectedLanguage(val); setSelectedProgram(""); setSelectedBatch(""); setSelectedComponent("");
    } else {
      setScLanguage(val); setScProgram(""); setScBatch(""); setScComponent("");
    }
  };

  const handleProgramChange = (val) => {
    if (category === "notification") {
      setSelectedProgram(val); setSelectedBatch(""); setSelectedComponent("");
    } else {
      setScProgram(val); setScBatch(""); setScComponent("");
    }
  }

  // When year changes
  const handleYearChange = (val) => {
    if (category === "notification") {
      setSelectedYear(val); setSelectedComponent("");
    } else {
      setScYear(val); setScComponent("");
    }
  };

  useEffect(() => {
    if (open) {
      reset({ subject: notification?.subject || "", expiry_date: notification?.expiry_date ? notification.expiry_date.slice(0, 10) : "" });
      setMessageContent(notification?.message || "");
      setCategory(notification?.type === "student_corner" ? "student_corner" : "notification");
      setAttachments(notification?.attachments || []);
      setInlineImages([]);
      resetAll();

      if (notification) {
        if (notification.meta?.batch_id) {
          if (notification.type === "student_corner") {
            setScBatch(notification.meta.batch_id);
            setIsGlobal(false);
          } else {
            setSelectedBatch(notification.meta.batch_id);
          }
        }
        if (notification.filters) {
          applySavedAudience(notification.filters);
        }
      }
    } else {
      reset({ subject: "", expiry_date: "" });
      setMessageContent("");
      setCategory("notification");
      setAttachments([]);
      setInlineImages([]);
      resetAll();
    }
  }, [notification, open, reset]);

  // Preview count — notification type
  useEffect(() => {
    if (step !== 2) return;
    if (category !== "notification") return;
    if (selectedBatch) {
      previewMutation.mutate({ meta: { batch_id: selectedBatch } }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
      return;
    }
    const filters = {};
    if (selectedYear) filters.year = selectedYear;
    if (selectedProgram) filters.course = selectedProgram;
    if (selectedComponent) filters.component = selectedComponent;
    if (selectedAcademicYear) filters.academic_year = selectedAcademicYear;
    if (selectedCity) filters.city = selectedCity;
    if (selectedCountry) filters.country = selectedCountry;
    if (selectedLanguage) filters.language = selectedLanguage;
    if (Object.keys(filters).length > 0) {
      previewMutation.mutate({ filters }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
    } else {
      setPreviewCount(null);
    }
  }, [selectedYear, selectedProgram, selectedBatch, selectedComponent, selectedAcademicYear, selectedCity, selectedCountry, selectedLanguage, category, step]);

  // Preview count — student_corner type
  useEffect(() => {
    if (step !== 2) return;
    if (category !== "student_corner") return;
    if (isGlobal) {
      previewMutation.mutate({ filters: {} }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
      return;
    }
    if (scBatch) {
      previewMutation.mutate({ meta: { batch_id: scBatch } }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
      return;
    }
    const filters = {};
    if (scYear) filters.year = scYear;
    if (scProgram) filters.course = scProgram;
    if (scComponent) filters.component = scComponent;
    if (scAcademicYear) filters.academic_year = scAcademicYear;
    if (scCity) filters.city = scCity;
    if (scCountry) filters.country = scCountry;
    if (scLanguage) filters.language = scLanguage;
    if (Object.keys(filters).length > 0) {
      previewMutation.mutate({ filters }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
    } else {
      setPreviewCount(null);
    }
  }, [scYear, scProgram, scBatch, scComponent, scAcademicYear, scCity, scCountry, scLanguage, isGlobal, category, step]);

  const handleNext = async () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      const scHasAudience = isGlobal || scYear || scLanguage || scProgram || scCity || scCountry;
      if (category === "student_corner" && !scHasAudience) return;
      setStep(3); return;
    }
    if (step === 3) {
      const isValid = await trigger(["subject"]);
      if (isValid && messageContent.trim()) setStep(4);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const currentTotalSize = attachments.reduce((sum, a) => sum + (a.file ? a.file.size : (a.size || 0)), 0);
    const newFilesSize = files.reduce((sum, f) => sum + f.size, 0);

    if (currentTotalSize + newFilesSize > 500 * 1024 * 1024) {
      toast.error("Total file size exceeds 500MB limit. Please reduce file sizes or remove files.");
      event.target.value = "";
      return;
    }

    const newAttachments = files.map(f => ({ file: f, file_name: f.name, size: f.size }));
    setAttachments(prev => [...prev, ...newAttachments]);
    event.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    const newFilesCount = attachments.filter(a => a.file).length;
    let finalAttachments = [];
    let finalMessageContent = messageContent;

    if (newFilesCount > 0 || inlineImages.length > 0) {
      setIsUploadingFiles(true);
      let uploadedCount = 0;

      // 1. Upload Inline Images
      for (const img of inlineImages) {
        if (finalMessageContent.includes(img.base64Url)) {
          try {
            setUploadStatus("Uploading inline images...");
            const res = await uploadFile(img.file);
            if (res?.data?.file_url) {
              finalMessageContent = finalMessageContent.replace(img.base64Url, res.data.file_url);
            }
          } catch (err) {
            toast.error(`Failed to upload inline image: ${err.message || "Unknown error"}`);
            setIsUploadingFiles(false);
            setUploadStatus("");
            return; // Abort submission
          }
        }
      }

      // 2. Upload Document Attachments
      for (const attachment of attachments) {
        if (attachment.file) {
          uploadedCount++;
          setUploadStatus(`Uploading ${uploadedCount}/${newFilesCount}...`);
          try {
            const res = await uploadFile(attachment.file);
            if (res?.data?.file_url) {
              finalAttachments.push({
                file_name: res.data.file_name,
                file_url: res.data.file_url,
                size: res.data.file_size || attachment.file.size,
                mime_type: res.data.mime_type || attachment.file.type
              });
            }
          } catch (err) {
            toast.error(`Failed to upload ${attachment.file_name}: ${err.message || "Unknown error"}`);
            setIsUploadingFiles(false);
            setUploadStatus("");
            return; // Abort submission if an upload fails
          }
        } else {
          finalAttachments.push(attachment);
        }
      }

      setIsUploadingFiles(false);
      setUploadStatus("");
    } else {
      finalAttachments = [...attachments];
    }

    const data = getValues();
    let payload;
    if (category === "notification") {
      const filters = {};
      if (selectedYear) filters.year = selectedYear;
      if (selectedProgram) filters.course = selectedProgram;
      if (selectedComponent) filters.component = selectedComponent;
      if (selectedAcademicYear) filters.academic_year = selectedAcademicYear;
      if (selectedCity) filters.city = selectedCity;
      if (selectedCountry) filters.country = selectedCountry;
      if (selectedLanguage) filters.language = selectedLanguage;
      payload = { 
        subject: data.subject, 
        message: finalMessageContent, 
        attachments: finalAttachments, 
        type: "notification", 
        status: "drafted", 
        ...(selectedBatch ? { meta: { batch_id: selectedBatch } } : Object.keys(filters).length ? { filters } : {}) 
      };
    } else {
      const scFilters = {};
      if (scYear) scFilters.year = scYear;
      if (scProgram) scFilters.course = scProgram;
      if (scComponent) scFilters.component = scComponent;
      if (scAcademicYear) scFilters.academic_year = scAcademicYear;
      if (scCity) scFilters.city = scCity;
      if (scCountry) scFilters.country = scCountry;
      if (scLanguage) scFilters.language = scLanguage;
      const has_sc_filters = Object.keys(scFilters).length > 0;
      payload = {
        subject: data.subject,
        message: finalMessageContent,
        attachments: finalAttachments,
        type: "student_corner",
        status: "drafted",
        ...(scBatch ? { meta: { batch_id: scBatch } } : !isGlobal && has_sc_filters ? { filters: scFilters } : {}),
        ...(data.expiry_date ? { expiry_date: data.expiry_date } : {}),
      };
    }
    if (isEdit) {
      updateMutation.mutate({ id: notification._id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const STEPS = [
    { id: 1, name: "Type" },
    { id: 2, name: "Audience" },
    { id: 3, name: "Content" },
    { id: 4, name: "Review" },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? t("notification.modal.editTitle") : t("notification.modal.createTitle")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/60 mt-0.5">
                {category === "student_corner" ? "Post to Student Corner" : "Send an in-app notification"}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto">
            {STEPS.map((s, index) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 shrink-0">
                  <div
                    onClick={() => { if (isCompleted || s.id < step) setStep(s.id); }}
                    style={{ cursor: (isCompleted || s.id < step) ? "pointer" : "default" }}
                    className={`px-3 py-1.5 rounded-full flex items-center text-xs font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground"
                      : isCompleted ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check size={12} className="mr-1" /> : <span className="mr-1">{s.id}</span>}
                    {s.name}
                  </div>
                  {index < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1 — Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory("notification")}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                    category === "notification" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <Bell size={22} className={category === "notification" ? "text-primary" : "text-muted-foreground"} />
                  <span className={`font-semibold text-sm ${category === "notification" ? "text-primary" : "text-foreground"}`}>Notification</span>
                  <span className="text-xs text-muted-foreground">Distribute mass notifications using audience filters.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("student_corner")}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 text-center transition-all ${
                    category === "student_corner" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <GraduationCap size={22} className={category === "student_corner" ? "text-primary" : "text-muted-foreground"} />
                  <span className={`font-semibold text-sm ${category === "student_corner" ? "text-primary" : "text-foreground"}`}>Student Corner</span>
                  <span className="text-xs text-muted-foreground">Post announcements to all or filtered students.</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Audience */}
          {step === 2 && (
            <div className="space-y-5">
              {category === "student_corner" && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium">Global Post</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send to all active students, ignoring filters</p>
                  </div>
                  <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
                </div>
              )}

              {(!isGlobal || category === "notification") && (
                <div className="space-y-4">
                  {savedAudiences.length > 0 && (
                    <div className="space-y-2 bg-sidebar-accent/30 p-4 rounded-xl border border-sidebar-border">
                      <Label className="text-sm font-medium">Use a Saved Audience</Label>
                      <div className="grid grid-cols-1 gap-3 mt-2 max-h-60 overflow-y-auto pr-2">
                        {savedAudiences.map(audience => (
                          <div key={audience._id} className="p-3 border border-border rounded-lg bg-background hover:border-primary/50 cursor-pointer transition-colors" onClick={() => applySavedAudience(audience.filters)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-sm">{audience.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">By {audience.creator_name} • {moment(audience.createdAt).format("MMM D, YYYY")}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{audience.audience_count} users</span>
                                {currentUser?._id === audience.created_by?._id && (
                                  <button onClick={(e) => { e.stopPropagation(); deleteSavedAudienceMutation.mutate(audience._id); }} className="text-muted-foreground hover:text-destructive transition-colors ml-2" title="Delete Saved Audience">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {audience.description && <p className="text-xs text-muted-foreground mt-2">{audience.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-sidebar-accent/10 p-4 rounded-xl border border-sidebar-border">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-medium">Filters</Label>
                      {hasCurrentFilters() && (
                        <Button variant="outline" size="sm" onClick={() => setShowSaveAudiencePopup(!showSaveAudiencePopup)} className="h-8 text-xs">
                          Save this audience
                        </Button>
                      )}
                    </div>
                    
                    {showSaveAudiencePopup && (
                      <div className="mb-4 p-4 border rounded-lg bg-background flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full space-y-1">
                          <Label className="text-xs">Audience Name</Label>
                          <Input 
                            placeholder="e.g. 1st Year CS Students in Paris" 
                            value={saveAudienceName} 
                            onChange={e => setSaveAudienceName(e.target.value)} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setShowSaveAudiencePopup(false)} className="h-8">Cancel</Button>
                          <Button size="sm" onClick={handleSaveAudience} disabled={!saveAudienceName.trim() || createSavedAudienceMutation.isPending} className="h-8">
                            {createSavedAudienceMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <AudienceFilters
                      year={category === "notification" ? selectedYear : scYear}
                      onYearChange={handleYearChange}
                      language={category === "notification" ? selectedLanguage : scLanguage}
                      onLanguageChange={handleLanguageChange}
                      city={category === "notification" ? selectedCity : scCity}
                      onCityChange={handleCityChange}
                      country={category === "notification" ? selectedCountry : scCountry}
                      onCountryChange={handleCountryChange}
                      program={category === "notification" ? selectedProgram : scProgram}
                      onProgramChange={handleProgramChange}
                      batch={category === "notification" ? selectedBatch : scBatch}
                      onBatchChange={category === "notification" ? setSelectedBatch : setScBatch}
                      component={category === "notification" ? selectedComponent : scComponent}
                      onComponentChange={category === "notification" ? setSelectedComponent : setScComponent}
                      academicYear={category === "notification" ? selectedAcademicYear : scAcademicYear}
                      onAcademicYearChange={category === "notification" ? setSelectedAcademicYear : setScAcademicYear}
                      languagesData={languagesData}
                      citiesData={citiesData}
                      countriesData={countriesData}
                      programsData={programsData}
                      batchesData={batchesData}
                      componentsData={componentsData}
                      academicYearsData={academicYearsData}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                <Users size={15} className="text-primary shrink-0" />
                <span className="text-sm text-foreground">
                  {previewMutation.isPending
                    ? "Calculating audience..."
                    : previewCount !== null
                      ? `This message will reach ${previewCount} student${previewCount !== 1 ? "s" : ""}`
                      : "Select filters to see audience count"}
                </span>
              </div>
            </div>
          )}

          {/* Step 3 — Content */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("notification.modal.subjectLabel")} <span className="text-red-500">*</span></Label>
                <Input
                  placeholder={t("notification.modal.subjectPlaceholder")}
                  {...register("subject", { required: t("notification.modal.errors.subjectRequired") })}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t("notification.modal.messageLabel")} <span className="text-red-500">*</span></Label>
                <RichTextEditor
                  key={notification?._id || "new"}
                  value={messageContent}
                  onChange={setMessageContent}
                  placeholder={t("notification.modal.messagePlaceholder")}
                  onImageAdded={(file, base64Url) => {
                    setInlineImages(prev => [...prev, { file, base64Url }]);
                  }}
                />
                {!messageContent.trim() && step === 3 && (
                  <p className="text-xs text-destructive">{t("notification.modal.errors.messageRequired")}</p>
                )}
              </div>
              {category === "student_corner" && (
                <div className="space-y-2">
                  <Label>Expiry Date <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <Input type="date" {...register("expiry_date")} />
                </div>
              )}
              
              <div className="space-y-2 pt-2 border-t">
                <Label>Attachments <span className="text-xs text-muted-foreground font-normal">(Max 500MB total)</span></Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-900/20 relative">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isUploadingFiles}
                  />
                  <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click or drag files to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports PDF, Excel, Word, ZIP, Images</p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
                            <FileIcon size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate" title={file.file_name}>{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">{((file.size || 0) / 1024 / 1024).toFixed(2)} MB {file.file ? "(Pending)" : ""}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="text-destructive hover:bg-destructive/10 shrink-0">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</p>
                  <p className="text-sm font-semibold">{category === "notification" ? "Notification" : "Student Corner"}</p>
                </div>
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                  <p className="text-xs text-primary/70 uppercase tracking-wider font-medium">Audience</p>
                  <p className="text-sm font-semibold text-foreground">
                    {category === "notification"
                      ? previewCount !== null ? `${previewCount} Students` : "Querying..."
                      : isGlobal ? "All Students" : "Filtered Students"}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Subject</p>
                  <p className="text-sm font-medium">{getValues("subject")}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Message</p>
                  <div className="text-sm text-foreground/80 prose prose-sm max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5" dangerouslySetInnerHTML={{ __html: messageContent }} />
                </div>
                {attachments.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Attachments ({attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-xs">
                          <Paperclip size={12} />
                          <span className="truncate max-w-[150px]">{file.file_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-white/20 flex items-center justify-between">
          {step > 1
            ? <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            : <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose}>Cancel</Button>
          }
          {step < 4
            ? <Button type="button" onClick={handleNext} disabled={isUploadingFiles} className="gap-1">Next <ChevronRight size={15} /></Button>
            : <Button type="button" onClick={onSubmit} disabled={isPending || isUploadingFiles} className="min-w-[120px]">
                {isUploadingFiles ? uploadStatus : isPending ? "Processing..." : isEdit ? "Update" : "Save as Draft"}
              </Button>
          }
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
