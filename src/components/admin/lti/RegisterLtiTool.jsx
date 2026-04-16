import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateLtiTool, useUpdateLtiTool } from "@/store/useLtiStore";
import { useTranslation } from "react-i18next";

const RegisterLtiTool = ({ open, onClose, toolData }) => {
  const { t } = useTranslation();
  const isEdit = !!toolData;
  const { mutate: createTool, isPending: isCreating } = useCreateLtiTool();
  const { mutate: updateTool, isPending: isUpdating } = useUpdateLtiTool();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      oidc_login_url: "",
      redirect_uri: "",
      jwks_url: "",
      launch_url: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (toolData) {
      reset({
        name: toolData.name || "",
        oidc_login_url: toolData.oidc_login_url || "",
        redirect_uri: toolData.redirect_uri || "",
        jwks_url: toolData.jwks_url || "",
        launch_url: toolData.launch_url || "",
      });
    } else {
      reset({
        name: "",
        oidc_login_url: "",
        redirect_uri: "",
        jwks_url: "",
        launch_url: "",
      });
    }
  }, [open, toolData, reset]);

  const onSubmit = (data) => {
    // Strip empty optional fields
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== ""),
    );

    if (isEdit) {
      updateTool({ id: toolData._id, data: payload }, { onSuccess: onClose });
    } else {
      createTool(payload, { onSuccess: onClose });
    }
  };

  if (!open) return null;

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-white/20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEdit
                  ? t("lti.registerTool.editTitle")
                  : t("lti.registerTool.createTitle")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70 mt-1">
                {isEdit
                  ? t("lti.registerTool.editSubtitle")
                  : t("lti.registerTool.createSubtitle")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label={t("lti.registerTool.nameLabel")}
              placeholder={t("lti.registerTool.namePlaceholder")}
              error={errors.name?.message}
              required
              {...register("name", {
                required: t("lti.registerTool.errors.nameRequired"),
              })}
            />
            {isEdit && (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">
                    {t("lti.registerTool.clientIdLabel")}
                  </p>
                  <div className="bg-gray-50 dark:bg-white/5 border dark:border-white/10 rounded-lg px-3 py-2">
                    <span className="text-sm font-mono text-gray-500 dark:text-white/50 break-all">
                      {toolData?.client_id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("lti.registerTool.generatedByPlatform")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide">
                    {t("lti.registerTool.deploymentIdLabel")}
                  </p>
                  <div className="bg-gray-50 dark:bg-white/5 border dark:border-white/10 rounded-lg px-3 py-2">
                    <span className="text-sm font-mono text-gray-500 dark:text-white/50 break-all">
                      {toolData?.deployment_id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("lti.registerTool.generatedByPlatform")}</p>
                </div>
              </>
            )}
            <FormField
              label={t("lti.registerTool.oidcLoginUrlLabel")}
              placeholder={t("lti.registerTool.oidcLoginUrlPlaceholder")}
              error={errors.oidc_login_url?.message}
              required
              {...register("oidc_login_url", {
                required: t("lti.registerTool.errors.oidcLoginUrlRequired"),
                pattern: {
                  value: /^https:\/\/.+/,
                  message: t("lti.registerTool.errors.invalidHttps"),
                },
              })}
            />
            <FormField
              label={t("lti.registerTool.redirectUriLabel")}
              placeholder={t("lti.registerTool.redirectUriPlaceholder")}
              error={errors.redirect_uri?.message}
              required
              {...register("redirect_uri", {
                required: t("lti.registerTool.errors.redirectUriRequired"),
                pattern: {
                  value: /^https:\/\/.+/,
                  message: t("lti.registerTool.errors.invalidHttps"),
                },
              })}
            />
            <FormField
              label={t("lti.registerTool.jwksUrlLabel")}
              placeholder={t("lti.registerTool.jwksUrlPlaceholder")}
              error={errors.jwks_url?.message}
              required
              {...register("jwks_url", {
                required: t("lti.registerTool.errors.jwksUrlRequired"),
                pattern: {
                  value: /^https:\/\/.+/,
                  message: t("lti.registerTool.errors.invalidHttps"),
                },
              })}
            />
            <FormField
              label={t("lti.registerTool.launchUrlLabel")}
              placeholder={t("lti.registerTool.launchUrlPlaceholder")}
              error={errors.launch_url?.message}
              {...register("launch_url", {
                pattern: {
                  value: /^https:\/\/.+/,
                  message: t("lti.registerTool.errors.invalidHttps"),
                },
              })}
            />

            <FormActions
              onCancel={onClose}
              isLoading={isSubmitting}
              isEdit={isEdit}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterLtiTool;
