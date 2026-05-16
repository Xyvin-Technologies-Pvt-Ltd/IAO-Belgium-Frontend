import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCreatePayment } from "@/store/usePaymentStore";
import { useGetUsers } from "@/store/useDropdownStore";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CreateInvoice = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      user: "",
      amount: "",
      currency: "EUR",
      purpose: "custom-invoice",
    },
  });

  const { data: usersData, isLoading: usersLoading } = useGetUsers(
    {
      ...(userSearchTerm && { search: userSearchTerm }),
      role: "student",
    },
    { enabled: !!open }
  );

  const students = (usersData?.data || []).map((user) => ({
    _id: user._id,
    name: user.name,
  }));

  const createPaymentMutation = useCreatePayment();

  const handleClose = () => {
    reset();
    setUserSearchTerm("");
    onClose();
  };

  const onSubmit = (data) => {
    createPaymentMutation.mutate(
      {
        user: data.user,
        amount: Number(data.amount),
        currency: data.currency,
        purpose: data.purpose,
        title: data.title,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-white/20 flex items-start justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("finance.reports.createInvoice.title")}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <SearchableSelect
                label={t("finance.reports.createInvoice.student")}
                placeholder={t("finance.reports.createInvoice.searchStudent")}
                searchPlaceholder={t("common.search")}
                items={students}
                value={watch("user")}
                onChange={(value) => setValue("user", value)}
                onSearch={setUserSearchTerm}
                isLoading={usersLoading}
                error={errors.user?.message}
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                {t("finance.reports.createInvoice.invoiceTitle")}
              </Label>
              <Input
                type="text"
                placeholder={t("finance.reports.createInvoice.titlePlaceholder")}
                {...register("title")}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                {t("common.amount")} <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount", { required: true })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                {t("common.currency")} <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("currency", { required: true })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createPaymentMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createPaymentMutation.isPending || !watch("user") || !watch("amount")}>
                {createPaymentMutation.isPending 
                  ? t("common.processing") 
                  : t("finance.reports.createInvoice.submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
