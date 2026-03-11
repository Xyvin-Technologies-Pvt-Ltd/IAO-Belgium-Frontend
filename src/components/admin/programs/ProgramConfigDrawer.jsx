import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2, Plus } from "lucide-react";
import {
  useGetProgramConfigs,
  useCreateProgramConfig,
  useUpdateProgramConfig,
} from "@/store/useProgramConfigStore";

const ProgramConfigDrawer = ({ programId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState({
    year: 1,
    exams: {
      min_pass_percentage: 50,
    },
    attendance: {
      overall_min_percentage: 80,
      per_module_min_percentage: 60,
    },
    submissions: {
      case_studies: {
        required: false,
        min_pass_percentage: 50,
      },
      essays: {
        required: false,
        min_pass_percentage: 50,
      },
      internships: {
        required: false,
        min_pass_percentage: 50,
      },
    },
    internship: {
      min_cases: 0,
    },
    status: true,
  });

  const { data: configsData, isLoading } = useGetProgramConfigs(
    { program: programId },
    { enabled: isOpen && !!programId }
  );

  const createMutation = useCreateProgramConfig();
  const updateMutation = useUpdateProgramConfig();

  const allConfigs = configsData?.data || [];
  const existingConfig = allConfigs.find(config => config.year === selectedYear);
  const isEditing = !!existingConfig && !isCreatingNew;

  // Initialize selected year when drawer opens
  useEffect(() => {
    if (isOpen && allConfigs.length > 0 && !selectedYear) {
      setSelectedYear(allConfigs[0].year);
    }
  }, [isOpen, allConfigs, selectedYear]);

  // Load config data when year changes
  useEffect(() => {
    if (existingConfig && !isCreatingNew) {
      setFormData({
        year: existingConfig.year || 1,
        exams: {
          min_pass_percentage: existingConfig.exams?.min_pass_percentage || 50,
        },
        attendance: {
          overall_min_percentage: existingConfig.attendance?.overall_min_percentage || 80,
          per_module_min_percentage: existingConfig.attendance?.per_module_min_percentage || 60,
        },
        submissions: {
          case_studies: {
            required: existingConfig.submissions?.case_studies?.required || false,
            min_pass_percentage: existingConfig.submissions?.case_studies?.min_pass_percentage || 50,
          },
          essays: {
            required: existingConfig.submissions?.essays?.required || false,
            min_pass_percentage: existingConfig.submissions?.essays?.min_pass_percentage || 50,
          },
          internships: {
            required: existingConfig.submissions?.internships?.required || false,
            min_pass_percentage: existingConfig.submissions?.internships?.min_pass_percentage || 50,
          },
        },
        internship: {
          min_cases: existingConfig.internship?.min_cases || 0,
        },
        status: existingConfig.status ?? true,
      });
    } else if (isCreatingNew) {
      // Find next available year
      const existingYears = allConfigs.map(c => c.year);
      const nextYear = Math.max(0, ...existingYears) + 1;
      setFormData({
        year: nextYear,
        exams: { min_pass_percentage: 50 },
        attendance: { overall_min_percentage: 80, per_module_min_percentage: 60 },
        submissions: {
          case_studies: { required: false, min_pass_percentage: 50 },
          essays: { required: false, min_pass_percentage: 50 },
          internships: { required: false, min_pass_percentage: 50 },
        },
        internship: { min_cases: 0 },
        status: true,
      });
    }
  }, [existingConfig, isCreatingNew, allConfigs]);

  const handleSubmit = () => {
    const payload = {
      program: programId,
      ...formData,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: existingConfig._id, data: formData },
        {
          onSuccess: () => {
            setIsCreatingNew(false);
            setSelectedYear(formData.year);
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsCreatingNew(false);
          setSelectedYear(formData.year);
        },
      });
    }
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedYear(null);
  };

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
    setIsCreatingNew(false);
  };

  const updateField = (path, value) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Program Configuration
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] p-0 bg-sidebar flex flex-col h-full max-h-screen"
      >
        <SheetHeader
          className="p-6 pb-5 shrink-0"
          style={{ borderBottom: "1px solid var(--sidebar-border, #e8edf3)" }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(255,137,4,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Settings size={18} color="#ff8904" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base font-semibold text-sidebar-foreground">
                Program Configuration
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Configure academic requirements and thresholds
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {/* Year Selector */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                    Select Year
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateNew}
                    className="h-8 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Year
                  </Button>
                </div>
                
                {isCreatingNew ? (
                  <div className="space-y-2">
                    <Label htmlFor="year">Year (1st, 2nd, 3rd, etc.)</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1"
                      value={formData.year}
                      onChange={(e) => updateField("year", parseInt(e.target.value))}
                      className="bg-sidebar border-sidebar-border"
                      placeholder="e.g., 1 for first year"
                    />
                    <p className="text-xs text-dashboard-text-secondary">
                      Creating configuration for a new program year
                    </p>
                  </div>
                ) : allConfigs.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="year-select">Program Year</Label>
                    <Select value={selectedYear?.toString()} onValueChange={handleYearChange}>
                      <SelectTrigger className="bg-sidebar border-sidebar-border">
                        <SelectValue placeholder="Select a year" />
                      </SelectTrigger>
                      <SelectContent>
                        {allConfigs.map((config) => (
                          <SelectItem key={config._id} value={config.year.toString()}>
                            Year {config.year} {!config.status && "(Inactive)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-dashboard-text-secondary">
                      Viewing configuration for Year {selectedYear}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-dashboard-text-secondary">
                      No configurations yet. Click "New Year" to create one.
                    </p>
                  </div>
                )}
              </div>

              {/* Exams */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  Exam Requirements
                </p>
                <div className="space-y-2">
                  <Label htmlFor="exam-pass">Minimum Pass Percentage (%)</Label>
                  <Input
                    id="exam-pass"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.exams.min_pass_percentage}
                    onChange={(e) => updateField("exams.min_pass_percentage", parseFloat(e.target.value))}
                    className="bg-sidebar border-sidebar-border"
                  />
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  Attendance Requirements
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="overall-attendance">Overall Minimum Percentage (%)</Label>
                    <Input
                      id="overall-attendance"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendance.overall_min_percentage}
                      onChange={(e) => updateField("attendance.overall_min_percentage", parseFloat(e.target.value))}
                      className="bg-sidebar border-sidebar-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-attendance">Per Module Minimum Percentage (%)</Label>
                    <Input
                      id="module-attendance"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendance.per_module_min_percentage}
                      onChange={(e) => updateField("attendance.per_module_min_percentage", parseFloat(e.target.value))}
                      className="bg-sidebar border-sidebar-border"
                    />
                  </div>
                </div>
              </div>

              {/* Submissions */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  Submission Requirements
                </p>

                {/* Case Studies */}
                <div className="space-y-3 p-4 bg-sidebar-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="case-studies-required" className="font-medium">Case Studies</Label>
                    <Switch
                      id="case-studies-required"
                      checked={formData.submissions.case_studies.required}
                      onCheckedChange={(checked) => updateField("submissions.case_studies.required", checked)}
                    />
                  </div>
                  {formData.submissions.case_studies.required && (
                    <div className="space-y-2">
                      <Label htmlFor="case-studies-pass" className="text-xs">Minimum Pass Percentage (%)</Label>
                      <Input
                        id="case-studies-pass"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.submissions.case_studies.min_pass_percentage}
                        onChange={(e) => updateField("submissions.case_studies.min_pass_percentage", parseFloat(e.target.value))}
                        className="bg-sidebar border-sidebar-border"
                      />
                    </div>
                  )}
                </div>

                {/* Essays */}
                <div className="space-y-3 p-4 bg-sidebar-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="essays-required" className="font-medium">Essays</Label>
                    <Switch
                      id="essays-required"
                      checked={formData.submissions.essays.required}
                      onCheckedChange={(checked) => updateField("submissions.essays.required", checked)}
                    />
                  </div>
                  {formData.submissions.essays.required && (
                    <div className="space-y-2">
                      <Label htmlFor="essays-pass" className="text-xs">Minimum Pass Percentage (%)</Label>
                      <Input
                        id="essays-pass"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.submissions.essays.min_pass_percentage}
                        onChange={(e) => updateField("submissions.essays.min_pass_percentage", parseFloat(e.target.value))}
                        className="bg-sidebar border-sidebar-border"
                      />
                    </div>
                  )}
                </div>

                {/* Internships */}
                <div className="space-y-3 p-4 bg-sidebar-accent rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="internships-required" className="font-medium">Internships</Label>
                    <Switch
                      id="internships-required"
                      checked={formData.submissions.internships.required}
                      onCheckedChange={(checked) => updateField("submissions.internships.required", checked)}
                    />
                  </div>
                  {formData.submissions.internships.required && (
                    <div className="space-y-2">
                      <Label htmlFor="internships-pass" className="text-xs">Minimum Pass Percentage (%)</Label>
                      <Input
                        id="internships-pass"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.submissions.internships.min_pass_percentage}
                        onChange={(e) => updateField("submissions.internships.min_pass_percentage", parseFloat(e.target.value))}
                        className="bg-sidebar border-sidebar-border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Internship */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  Internship Requirements
                </p>
                <div className="space-y-2">
                  <Label htmlFor="min-cases">Minimum Cases</Label>
                  <Input
                    id="min-cases"
                    type="number"
                    min="0"
                    value={formData.internship.min_cases}
                    onChange={(e) => updateField("internship.min_cases", parseInt(e.target.value))}
                    className="bg-sidebar border-sidebar-border"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="bg-sidebar rounded-xl p-5 border border-sidebar-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="status" className="font-medium">Active Status</Label>
                    <p className="text-xs text-dashboard-text-secondary mt-1">
                      Enable or disable this configuration
                    </p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => updateField("status", checked)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter
          className="mt-auto shrink-0"
          style={{
            background: "var(--sidebar, #fff)",
            borderTop: "1px solid var(--sidebar-border, #e8edf3)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "row",
            gap: 12,
          }}
        >
          <SheetClose asChild>
            <Button variant="outline" className="flex-1 border-sidebar-border" disabled={isSaving}>
              Cancel
            </Button>
          </SheetClose>
          <Button 
            className="flex-1" 
            onClick={handleSubmit} 
            disabled={isSaving || (!isCreatingNew && !existingConfig)}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{isEditing ? "Update" : "Create"} Configuration</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ProgramConfigDrawer;
