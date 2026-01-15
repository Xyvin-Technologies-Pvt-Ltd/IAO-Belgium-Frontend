import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const StepThree = ({ onSubmit, onSaveAndLogout, applicationData = {} }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    applicationData.country || "Netherlands"
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    applicationData.paymentMethod || "ideal"
  );

  const { handleSubmit, register, setValue, watch } = useForm({
    defaultValues: {
      firstName: applicationData.firstName || "Maria",
      lastName: applicationData.lastName || "Jean",
      email: applicationData.email || "maria@example.com",
      phone: applicationData.phone || "564465399",
      education: applicationData.education || "Physiotherapist",
      address: applicationData.address || "123 Main Street, Amsterdam",
      country: selectedCountry,
      paymentMethod: selectedPaymentMethod,
    },
  });

  const applicationFee = 200;

  const handleFormSubmit = (data) => {
    console.log("FINAL SUBMIT DATA 👉", {
      ...data,
      applicationFee,
    });
    onSubmit?.();
  };

  const ReviewField = ({ label, name }) => {
    const value = watch(name);

    return (
      <div>
        <Label className="text-sm font-semibold text-[#A6A6A6]">{label}</Label>
        {isEditing ? (
          <Input {...register(name)} defaultValue={value} className="mt-1" />
        ) : (
          <p className="text-base mt-1">{value}</p>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-2xl border border-[#EFEFEF] p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <span className="text-sm text-[#066541] bg-[#49BA6C]/20 px-3 py-1 rounded-full">
          Step 3 of 3
        </span>
        <p className="text-base text-muted-foreground mt-2">
          Review and complete your payment process
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 bg-[#F2F2F2] p-4 rounded-[14px]">
          {/* Your Application Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-black">
                  Your Application
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review your application
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>
          </div>

          <div className="space-y-4 ">
            <ReviewField label="First Name *" name="firstName" />
            <ReviewField label="Last Name *" name="lastName" />
            <ReviewField label="Email Address *" name="email" />
            <ReviewField label="Phone Number *" name="phone" />
            <ReviewField label="Previous Education *" name="education" />
            <ReviewField label="Address" name="address" />
          </div>
        </div>

        <div className="space-y-6">
          <Label>Payment Details</Label>

          <div className="bg-[#FF8700]/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base ">Application Fee</span>
              <span className="font-semibold text-sm text-[#FF3333]">
                € {applicationFee}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              This non-refundable fee covers the processing and evaluation of
              your application
            </p>
          </div>
          <div className="space-y-2">
            <Label>Select Country</Label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => {
                setSelectedCountry(value);
                setValue("country", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
                <SelectItem value="Belgium">Belgium</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Select Payment Method *</Label>

            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={(value) => {
                setSelectedPaymentMethod(value);
                setValue("paymentMethod", value);
              }}
              className="space-y-3"
            >
              <label
                className={`flex items-center gap-3 rounded-[6px] border px-4 py-3 cursor-pointer transitionborder-[#D8D8D8]`}
              >
                <RadioGroupItem value="ideal" id="ideal" />
                <span className="font-semibold text-sm">IDEAL</span>
              </label>
              <label
                className={`flex items-center gap-3 rounded-[6px] border px-4 py-3 cursor-pointer transition border-[#D8D8D8]`}
              >
                <RadioGroupItem value="sepa" id="sepa" />
                <span className="font-semibold text-sm">SEPA Instant</span>
              </label>
            </RadioGroup>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t">
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("SAVE & LOGOUT DATA 👉", {
                ...watch(),
                applicationFee,
              });
              onSaveAndLogout?.();
            }}
          >
            Save & Logout
          </Button>

          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            Submit Application
          </Button>
        </div>
      </div>
    </form>
  );
};

export default StepThree;
