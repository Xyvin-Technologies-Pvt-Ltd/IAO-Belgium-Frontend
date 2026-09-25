import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useCreateSkillDay, useUpdateSkillDay } from "@/store/useSkillDayStore";
import { useGetAllCountries, useGetAllCities } from "@/store/useDropdownStore";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";

const CreateSkillDayModal = ({ open, onClose, skillDayData = null }) => {
  const { t } = useTranslation();
  const isEdit = !!skillDayData;
  const createMutation = useCreateSkillDay();
  const updateMutation = useUpdateSkillDay();

  const [selectedCountry, setSelectedCountry] = useState("");
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [descriptionContent, setDescriptionContent] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      country: "",
      city: "",
      venue: "",
      venue_address: "",
      location: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      description: "",
    },
  });

  const selectedCityId = watch("city");

  // Fetch Countries dropdown
  const { data: countriesData, isLoading: countriesLoading } = useGetAllCountries(
    { status: true, ...(countrySearchTerm && { search: countrySearchTerm }) },
    { enabled: open }
  );
  const countries = (open ? countriesData?.data || [] : []).map((c) => ({
    _id: c._id,
    name: c.name,
  }));

  // Fetch Cities dropdown filtered by Country if selected
  const { data: citiesData, isLoading: citiesLoading } = useGetAllCities(
    {
      status: true,
      ...(selectedCountry && { country: selectedCountry }),
      ...(citySearchTerm && { search: citySearchTerm }),
    },
    { enabled: open }
  );

  const citiesRaw = open ? citiesData?.data || [] : [];
  const cities = citiesRaw.map((c) => ({
    _id: c._id,
    name: c.country?.name ? `${c.name} (${c.country.name})` : c.name,
    rawName: c.name,
  }));

  const selectedCityObj = citiesRaw.find((c) => c._id === selectedCityId);

  useEffect(() => {
    if (open) {
      if (skillDayData) {
        const cityId = skillDayData.city?._id || skillDayData.city || "";
        const countryId = skillDayData.city?.country?._id || skillDayData.city?.country || "";
        const descText = skillDayData.description || "";

        setSelectedCountry(countryId);
        setDescriptionContent(descText);

        reset({
          name: skillDayData.name || "",
          country: countryId,
          city: cityId,
          venue: skillDayData.venue || "",
          venue_address: skillDayData.venue_address || "",
          location: skillDayData.location || "",
          start_date: skillDayData.start_date
            ? formatTZ(skillDayData.start_date, "YYYY-MM-DD")
            : "",
          end_date: skillDayData.end_date
            ? formatTZ(skillDayData.end_date, "YYYY-MM-DD")
            : "",
          start_time: skillDayData.start_time || "",
          end_time: skillDayData.end_time || "",
          description: descText,
        });
      } else {
        setSelectedCountry("");
        setDescriptionContent("");
        reset({
          name: "",
          country: "",
          city: "",
          venue: "",
          venue_address: "",
          location: "",
          start_date: "",
          end_date: "",
          start_time: "",
          end_time: "",
          description: "",
        });
      }
    }
  }, [open, skillDayData, reset]);

  if (!open) return null;

  const handleClose = () => {
    setSelectedCountry("");
    setDescriptionContent("");
    setCountrySearchTerm("");
    setCitySearchTerm("");
    reset({
      name: "",
      country: "",
      city: "",
      venue: "",
      venue_address: "",
      location: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      description: "",
    });
    onClose();
  };

  const onSubmit = async (values) => {
    try {
      const formattedLocation =
        values.venue || values.location
          ? [values.venue, values.venue_address].filter(Boolean).join(", ") || values.location
          : "N/A";

      const payload = {
        name: values.name,
        city: values.city || null,
        venue: values.venue || "",
        venue_address: values.venue_address || "",
        location: formattedLocation,
        start_date: values.start_date,
        end_date: values.end_date,
        start_time: values.start_time || "",
        end_time: values.end_time || "",
        description: descriptionContent,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: skillDayData._id,
          ...payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      handleClose();
    } catch (err) {
      console.error("[CreateSkillDayModal] Error:", err);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-black border dark:border-white/20 shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit ? "Edit Standalone Module" : "Create Standalone Module"}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-l-2 border-gray-300 dark:border-zinc-700 pl-2.5">
                Standalone Module Information
              </h3>

              <FormField
                label="Standalone Module Name"
                placeholder="Enter standalone module name"
                {...register("name", { required: "Name is required" })}
                error={errors.name?.message}
                required
              />

              {/* Location Master Data Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Country (Master Data)"
                  placeholder="Select country"
                  searchPlaceholder="Search country..."
                  items={countries}
                  value={watch("country")}
                  onChange={(val) => {
                    setValue("country", val || "");
                    setSelectedCountry(val || "");
                    setValue("city", "");
                  }}
                  onSearch={setCountrySearchTerm}
                  isLoading={countriesLoading}
                />

                <SearchableSelect
                  label="City (Master Data)"
                  placeholder="Select city"
                  searchPlaceholder="Search city..."
                  items={cities}
                  value={watch("city")}
                  onChange={(val) => {
                    setValue("city", val || "");
                    // Auto select country if city contains country info
                    const matchedCity = citiesRaw.find((c) => c._id === val);
                    if (matchedCity?.country?._id) {
                      setValue("country", matchedCity.country._id);
                      setSelectedCountry(matchedCity.country._id);
                    }
                  }}
                  onSearch={setCitySearchTerm}
                  isLoading={citiesLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Venue"
                  placeholder="Enter venue name"
                  {...register("venue", { required: "Venue is required" })}
                  error={errors.venue?.message}
                  required
                />

                <FormField
                  label="Venue Address"
                  placeholder="Enter full venue address"
                  {...register("venue_address")}
                  error={errors.venue_address?.message}
                />
              </div>

              {/* Preferred Venues Chips from Selected City */}
              {selectedCityObj && selectedCityObj.venue?.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Preferred Venues ({selectedCityObj.name})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCityObj.venue.map((venueObj, index) => {
                      const vName = typeof venueObj === "string" ? venueObj : venueObj.name;
                      const vAddr = typeof venueObj === "string" ? "" : venueObj.address || "";
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setValue("venue", vName, { shouldValidate: true });
                            setValue("venue_address", vAddr);
                          }}
                          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer"
                        >
                          {vName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dates & Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Start Date"
                  type="date"
                  placeholder="Select start date"
                  {...register("start_date", { required: "Start date is required" })}
                  error={errors.start_date?.message}
                  required
                />

                <FormField
                  label="End Date"
                  type="date"
                  placeholder="Select end date"
                  {...register("end_date", { required: "End date is required" })}
                  error={errors.end_date?.message}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time From</Label>
                  <Input
                    type="time"
                    className="dark:scheme-dark"
                    {...register("start_time")}
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-500">{errors.start_time.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time Till</Label>
                  <Input
                    type="time"
                    className="dark:scheme-dark"
                    {...register("end_time")}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-500">{errors.end_time.message}</p>
                  )}
                </div>
              </div>

              {/* Preferred Times Chips from Selected City */}
              {selectedCityObj && selectedCityObj.times?.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Preferred Times ({selectedCityObj.name})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCityObj.times.map((tObj, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setValue("start_time", tObj.start || "");
                          setValue("end_time", tObj.end || "");
                        }}
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer"
                      >
                        {tObj.start} — {tObj.end}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Rich Text Editor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description / Additional Context</Label>
                <RichTextEditor
                  value={descriptionContent}
                  onChange={setDescriptionContent}
                  placeholder="Enter detailed description or context for this standalone module..."
                />
              </div>
            </div>

            {/* Actions */}
            <FormActions
              onCancel={handleClose}
              isLoading={isLoading}
              isEdit={isEdit}
              submitText={isEdit ? "Update Standalone Module" : "Create Standalone Module"}
              cancelText="Cancel"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSkillDayModal;
