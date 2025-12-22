import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguageStore } from "@/store/useLanguageStore";
import { GetCountries } from "react-country-state-city";

const StepOne = ({ onNext, onSaveAndLogout, applicationData = {} }) => {
  const { t } = useLanguageStore();
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    GetCountries().then((result) => {
      setCountries(result);
    });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: applicationData.firstName || "",
      lastName: applicationData.lastName || "",
      email: applicationData.email || "",
      phone: applicationData.phone || "",
      education: applicationData.education || "",
      address: applicationData.address || "",
      postalCode: applicationData.postalCode || "",
      country: applicationData.country || null,
      city: applicationData.city || "",
    },
  });

  const onSubmit = (data) => {
    console.log("STEP 1 DATA 👉", data);
    onNext?.(data);
  };

  const handleSaveAndLogout = async () => {
    const isValid = await trigger([
      "firstName",
      "lastName",
      "email",
      "phone",
      "education",
    ]);

    if (!isValid) {
      return;
    }

    console.log("SAVE & LOGOUT DATA 👉", watch());
    onSaveAndLogout?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-[#EFEFEF] p-6 space-y-6"
    >
      <div>
        <span className="text-sm text-[#066541] bg-[#49BA6C]/20 px-3 py-1 rounded-full">
          {t?.stepOne?.stepIndicator || "Step 1 of 3"}
        </span>
        <p className="text-base text-muted-foreground mt-2">
          {t?.stepOne?.subtitle || "Please provide your basic informations"}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.firstName || "First Name"} *</Label>
          <Input
            placeholder={t?.stepOne?.placeholders?.firstName || "First name"}
            {...register("firstName", {
              required: "First name is required",
            })}
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.lastName || "Last Name"} *</Label>
          <Input
            placeholder={t?.stepOne?.placeholders?.lastName || "lastname"}
            {...register("lastName", {
              required: "Last name is required",
            })}
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.email || "Email Address"} *</Label>
          <Input
            placeholder={t?.stepOne?.placeholders?.email || "email@example.com"}
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.phone || "Phone Number"} *</Label>
          <Input
            placeholder={
              t?.stepOne?.placeholders?.phone || "Enter your phone number"
            }
            {...register("phone", {
              required: "Phone number is required",
            })}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>
            {t?.stepOne?.fields?.education || "Previous Education"} *
          </Label>
          <Select
            onValueChange={(value) =>
              setValue("education", value, { shouldValidate: true })
            }
            {...register("education", { required: true })}
          >
            <SelectTrigger className={errors.education ? "border-red-500" : ""}>
              <SelectValue
                placeholder={
                  t?.stepOne?.placeholders?.education ||
                  "Select your education level"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="highschool">
                {t?.stepOne?.educationOptions?.highschool || "High School"}
              </SelectItem>
              <SelectItem value="bachelor">
                {t?.stepOne?.educationOptions?.bachelor || "Bachelor"}
              </SelectItem>
              <SelectItem value="master">
                {t?.stepOne?.educationOptions?.master || "Master"}
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.education && (
            <p className="text-sm text-red-500">Education level is required</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>{t?.stepOne?.fields?.address || "Address"}</Label>
          <Input
            placeholder={
              t?.stepOne?.placeholders?.address || "Enter your Address"
            }
            {...register("address")}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.postalCode || "Postal Code"}</Label>
          <Input
            placeholder={
              t?.stepOne?.placeholders?.postalCode || "Enter postal code"
            }
            {...register("postalCode")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.country || "Country"}</Label>
          <Select onValueChange={(value) => setValue("country", value)}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  t?.stepOne?.placeholders?.country || "Select country"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.iso2}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t?.stepOne?.fields?.city || "City"}</Label>
          <Input
            placeholder={t?.stepOne?.placeholders?.city || "Enter your city"}
            {...register("city")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleSaveAndLogout}>
          {t?.stepOne?.buttons?.saveLogout || "Save & Logout"}
        </Button>

        <Button type="submit">
          {t?.stepOne?.buttons?.nextStep || "Next Step"}
        </Button>
      </div>
    </form>
  );
};

export default StepOne;
