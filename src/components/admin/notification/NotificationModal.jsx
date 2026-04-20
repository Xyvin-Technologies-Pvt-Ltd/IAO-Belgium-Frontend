import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Users, Check, ChevronRight, Bell, GraduationCap } from "lucide-react";
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
} from "@/store/useDropdownStore";
import {
  useCreateAdminNotification,
  useUpdateAdminNotification,
  usePreviewNotificationCount,
} from "@/store/useNotificationStore";



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
  languagesData,
  citiesData,
  countriesData,
  programsData,
}) => (
  <div className="space-y-4">
    <SinglePillGroup label="Language Group" options={languagesData?.data || []} selected={language} onChange={onLanguageChange} />
    <SinglePillGroup label="Year" options={[1,2,3,4,5].map(y => ({ id: String(y), label: String(y) }))} valueKey="id" labelKey="label" selected={year} onChange={onYearChange} />
    <SinglePillGroup label="Country" options={countriesData?.data || []} selected={country} onChange={onCountryChange} />
    {country && (
      <SinglePillGroup label="City" options={citiesData?.data || []} selected={city} onChange={onCityChange} />
    )}
    {(city || language) && (
      <SinglePillGroup label="Course" options={programsData?.data || []} selected={program} onChange={onProgramChange} />
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

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  const [scYear, setScYear] = useState("");
  const [scLanguage, setScLanguage] = useState("");
  const [scProgram, setScProgram] = useState("");
  const [scCity, setScCity] = useState("");
  const [scCountry, setScCountry] = useState("");

  const [previewCount, setPreviewCount] = useState(null);

  const { data: countriesData } = useGetAllCountries({ status: "active" });
  const { data: languagesData } = useGetAllLanguages({ status: "active" });

  // Cascaded: cities filtered by selected country, programs by selected city or language
  const activeCountry = category === "notification" ? selectedCountry : scCountry;
  const activeLanguage = category === "notification" ? selectedLanguage : scLanguage;
  const activeCity = category === "notification" ? selectedCity : scCity;

  const { data: citiesData } = useGetAllCities({
    status: "active",
    ...(activeCountry ? { country: activeCountry } : {}),
  });
  const { data: programsData } = useGetProgramsByCitiesAndLanguages(activeCity, activeLanguage);

  const { register, trigger, getValues, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { subject: "", expiry_date: "" },
  });

  const createMutation = useCreateAdminNotification();
  const updateMutation = useUpdateAdminNotification();
  const previewMutation = usePreviewNotificationCount();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetAll = () => {
    setStep(1); setPreviewCount(null); setIsGlobal(false);
    setSelectedYear(""); setSelectedLanguage(""); setSelectedProgram(""); setSelectedCity(""); setSelectedCountry("");
    setScYear(""); setScLanguage(""); setScProgram(""); setScCity(""); setScCountry("");
  };

  // When country changes, clear city and program
  const handleCountryChange = (val) => {
    if (category === "notification") {
      setSelectedCountry(val); setSelectedCity(""); setSelectedProgram("");
    } else {
      setScCountry(val); setScCity(""); setScProgram("");
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

  // When language changes, clear program
  const handleLanguageChange = (val) => {
    if (category === "notification") {
      setSelectedLanguage(val); setSelectedProgram("");
    } else {
      setScLanguage(val); setScProgram("");
    }
  };

  // When year changes
  const handleYearChange = (val) => {
    if (category === "notification") {
      setSelectedYear(val);
    } else {
      setScYear(val);
    }
  };

  useEffect(() => {
    if (open) {
      reset({ subject: notification?.subject || "", expiry_date: notification?.expiry_date ? notification.expiry_date.slice(0, 10) : "" });
      setMessageContent(notification?.message || "");
      setCategory(notification?.type === "student_corner" ? "student_corner" : "notification");
      resetAll();
    } else {
      reset({ subject: "", expiry_date: "" });
      setMessageContent("");
      setCategory("notification");
      resetAll();
    }
  }, [notification, open, reset]);

  // Preview count — notification type
  useEffect(() => {
    if (category !== "notification") return;
    const filters = {};
    if (selectedYear) filters.year = selectedYear;
    if (selectedProgram) filters.course = selectedProgram;
    if (selectedCity) filters.city = selectedCity;
    if (selectedCountry) filters.country = selectedCountry;
    if (selectedLanguage) filters.language = selectedLanguage;
    if (Object.keys(filters).length > 0) {
      previewMutation.mutate({ filters }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
    } else {
      setPreviewCount(null);
    }
  }, [selectedYear, selectedProgram, selectedCity, selectedCountry, selectedLanguage, category]);

  // Preview count — student_corner type
  useEffect(() => {
    if (category !== "student_corner") return;
    if (isGlobal) {
      previewMutation.mutate({ filters: {} }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
      return;
    }
    const filters = {};
    if (scYear) filters.year = scYear;
    if (scProgram) filters.course = scProgram;
    if (scCity) filters.city = scCity;
    if (scCountry) filters.country = scCountry;
    if (scLanguage) filters.language = scLanguage;
    if (Object.keys(filters).length > 0) {
      previewMutation.mutate({ filters }, { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) });
    } else {
      setPreviewCount(null);
    }
  }, [scYear, scProgram, scCity, scCountry, scLanguage, isGlobal, category]);

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

  const onSubmit = () => {
    const data = getValues();
    let payload;
    if (category === "notification") {
      const filters = {};
      if (selectedYear) filters.year = selectedYear;
      if (selectedProgram) filters.course = selectedProgram;
      if (selectedCity) filters.city = selectedCity;
      if (selectedCountry) filters.country = selectedCountry;
      if (selectedLanguage) filters.language = selectedLanguage;
      payload = { subject: data.subject, message: messageContent, type: "notification", status: "drafted", ...(Object.keys(filters).length ? { filters } : {}) };
    } else {
      const scFilters = {};
      if (scYear) scFilters.year = scYear;
      if (scProgram) scFilters.course = scProgram;
      if (scCity) scFilters.city = scCity;
      if (scCountry) scFilters.country = scCountry;
      if (scLanguage) scFilters.language = scLanguage;
      const has_sc_filters = Object.keys(scFilters).length > 0;
      payload = {
        subject: data.subject,
        message: messageContent,
        type: "student_corner",
        status: "drafted",
        ...(!isGlobal && has_sc_filters ? { filters: scFilters } : {}),
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
                  onProgramChange={category === "notification" ? setSelectedProgram : setScProgram}
                  languagesData={languagesData}
                  citiesData={citiesData}
                  countriesData={countriesData}
                  programsData={programsData}
                />
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
                  <div className="text-sm text-foreground/80 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: messageContent }} />
                </div>
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
            ? <Button type="button" onClick={handleNext} className="gap-1">Next <ChevronRight size={15} /></Button>
            : <Button type="button" onClick={onSubmit} disabled={isPending} className="min-w-[120px]">
                {isPending ? "Processing..." : isEdit ? "Update" : "Save as Draft"}
              </Button>
          }
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
