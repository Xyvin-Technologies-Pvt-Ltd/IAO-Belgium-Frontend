import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Users, Check, ChevronRight, Bell, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/RichTextEditor";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetComponents, useGetTeacherModules } from "@/store/useDropdownStore";
import {
  useCreateAdminNotification,
  useUpdateAdminNotification,
  usePreviewNotificationCount,
} from "@/store/useNotificationStore";
import { useDebounce } from "@/hooks/useDebounce";

const TeacherNotificationModal = ({ open, onClose, notification = null }) => {
  const { t } = useTranslation();
  const isEdit = !!notification;

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [previewCount, setPreviewCount] = useState(null);
  const [messageContent, setMessageContent] = useState("");

  const debouncedModuleSearch = useDebounce(moduleSearch, 400);

  // Specific endpoint for the current teacher's modules
  const { data: modulesData, isLoading: modulesLoading } = useGetTeacherModules(
    { ...(debouncedModuleSearch ? { search: debouncedModuleSearch } : {}) },
    { enabled: open }
  );

  const {
    register,
    trigger,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { subject: "", message: "" } });

  const createMutation = useCreateAdminNotification();
  const updateMutation = useUpdateAdminNotification();
  const previewMutation = usePreviewNotificationCount();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      const initialMessage = notification?.message || "";
      reset({
        subject: notification?.subject || "",
        message: initialMessage,
      });
      setMessageContent(initialMessage);
      setStep(1);
      if (notification?.meta?.batch_id) {
        setSelectedModuleId(notification.meta.batch_id);
        setSelectedModule({ _id: notification.meta.batch_id, name: notification.meta.batch_name || "Assigned Batch" });
      } else {
        setSelectedModuleId("");
        setSelectedModule(null);
      }
      setModuleSearch("");
      setPreviewCount(null);
    }
  }, [notification, open, reset]);

  // Sync selectedModule object when ID changes if we have data
  useEffect(() => {
    if (selectedModuleId && modulesData?.data) {
      const found = modulesData.data.find(m => m.batch_id === selectedModuleId);
      if (found) {
        setSelectedModule({ 
          ...found, 
          _id: found.batch_id,
          name: `${found.component_name} (${found.batch_name})` 
        });
      }
    }
  }, [selectedModuleId, modulesData]);

  useEffect(() => {
    if (selectedModuleId) {
      previewMutation.mutate(
        { meta: { batch_id: selectedModuleId } },
        { onSuccess: (res) => setPreviewCount(res?.data?.count ?? null) }
      );
    } else {
      setPreviewCount(null);
    }
  }, [selectedModuleId]);

  const handleNext = async () => {
    if (step === 1) {
      if (selectedModuleId) setStep(2);
    } else if (step === 2) {
      // Update form value with rich text content
      setValue("message", messageContent);
      const isValid = await trigger(["subject"]);
      // Validate message manually since it's not a registered field
      if (isValid && messageContent.trim() && messageContent !== "<p></p>") {
        setStep(3);
      } else if (!messageContent.trim() || messageContent === "<p></p>") {
        // Show error for empty message
        alert(t("notification.modal.errors.messageRequired"));
      }
    }
  };

  const onSubmit = () => {
    const data = getValues();
    const payload = {
      subject: data.subject,
      message: messageContent,
      type: "notification",
      category: "module_message",
      status: "drafted",
      meta: { 
        batch_id: selectedModuleId, 
        batch_name: selectedModule?.name 
      },
    };

    if (isEdit) {
      updateMutation.mutate({ id: notification._id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const STEPS = [
    { id: 1, name: "Module" },
    { id: 2, name: "Content" },
    { id: 3, name: "Review" },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-[#1C1C1C] border dark:border-white/10 rounded-2xl shadow-xl w-[600px] min-h-[500px] max-h-[92vh] flex flex-col p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4 text-left">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Alert" : "Send Alert to Students"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Notify students enrolled in your assigned modules
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-gray-700 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
          {STEPS.map((s, index) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            
            return (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div 
                  className={`px-3 py-1.5 rounded-full flex items-center text-sm font-medium ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isCompleted 
                        ? "bg-primary/15 text-primary" 
                        : "text-gray-400 dark:text-gray-600"
                  }`} 
                  onClick={() => { if(isCompleted || s.id < step) setStep(s.id); }}
                  style={{ cursor: (isCompleted || s.id < step) ? "pointer" : "default" }}
                >
                  {isCompleted ? <Check size={14} className="mr-1.5" /> : null}
                  {!isCompleted ? <span className="mr-1.5">{s.id}</span> : null}
                  {s.name}
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-700" />
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4 text-left">
          {step === 1 && (
            <div className="space-y-4">
               <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                 <h3 className="font-semibold text-primary flex items-center gap-2">
                   <Users size={18} /> Select Target Group
                 </h3>
                 <SearchableSelect
                    label="Assigned Batch"
                    placeholder="Search your batches..."
                    items={modulesData?.data?.map(m => ({ 
                      ...m, 
                      _id: m.batch_id,
                      name: `${m.component_name} (${m.batch_name})` 
                    })) || []}
                    value={selectedModuleId}
                    onChange={setSelectedModuleId} 
                    onSearch={setModuleSearch}
                    isLoading={modulesLoading}
                    error={!selectedModuleId ? "Please select a batch" : null}
                  />
                  {selectedModuleId && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-background border border-border">
                      <Users size={14} className="text-primary shrink-0" />
                      <span className="text-xs font-medium">
                        {previewMutation.isPending
                          ? "Counting enrolled students..."
                          : previewCount !== null
                            ? `${previewCount} student${previewCount !== 1 ? "s" : ""} currently enrolled`
                            : ""}
                      </span>
                    </div>
                  )}
               </div>
               <p className="text-xs text-muted-foreground ml-1 italic">
                 Note: Only students approved and enrolled in this batch (including location overrides) will receive the alert.
               </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-lg flex items-center border-b pb-3">
                Alert Content
              </h3>
              
              <div className="space-y-1.5">
                <Label>
                  {t("notification.modal.subjectLabel")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={t("notification.modal.subjectPlaceholder")}
                  {...register("subject", { required: t("notification.modal.errors.subjectRequired") })}
                />
                {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>
                  {t("notification.modal.messageLabel")} <span className="text-red-500">*</span>
                </Label>
                <RichTextEditor
                  value={messageContent}
                  onChange={setMessageContent}
                  placeholder={t("notification.modal.messagePlaceholder")}
                  className="min-h-[200px]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 text-left">
              <h3 className="font-semibold text-lg flex items-center border-b pb-3">
                Review & Confirm
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl space-y-1 border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Target Batch</p>
                  <p className="font-medium">{selectedModule?.name}</p>
                </div>
                
                <div className="p-4 bg-primary/10 rounded-xl space-y-1 border border-primary/20">
                  <p className="text-xs text-primary/80 uppercase tracking-wider font-semibold">Audience Size</p>
                  <p className="font-medium text-foreground">{previewCount ?? '...'} Students</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-xl space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Subject</p>
                  <p className="font-medium text-lg">{getValues("subject")}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Message Body</p>
                  <div 
                    className="text-sm text-foreground/90 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: messageContent }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center pt-4 border-t mt-auto">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
             <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onClose}>
               Cancel
             </Button>
          )}
          
          {step < 3 ? (
            <Button type="button" onClick={handleNext} disabled={step === 1 && !selectedModuleId} className="bg-primary hover:bg-primary/90 text-primary-foreground select-none">
              Next step <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={onSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
              {isPending
                ? "Processing..."
                : isEdit
                  ? "Update Alert"
                  : "Send Alert"}
            </Button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default TeacherNotificationModal;
