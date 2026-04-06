import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { useCreateLtiTool, useUpdateLtiTool } from "@/store/useLtiStore";

const RegisterLtiTool = ({ open, onClose, toolData }) => {
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
      client_id: "",
      deployment_id: "",
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
        client_id: toolData.client_id || "",
        deployment_id: toolData.deployment_id || "",
        oidc_login_url: toolData.oidc_login_url || "",
        redirect_uri: toolData.redirect_uri || "",
        jwks_url: toolData.jwks_url || "",
        launch_url: toolData.launch_url || "",
      });
    } else {
      reset({
        name: "",
        client_id: "",
        deployment_id: "",
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
                {isEdit ? "Edit LTI Tool" : "Register LTI Tool"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/70 mt-1">
                {isEdit
                  ? "Update the LTI 1.3 tool credentials"
                  : "Add a new LTI 1.3 external tool (e.g. Enatom)"}
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
              label="Tool Name"
              placeholder="Enter a display name for this tool"
              error={errors.name?.message}
              required
              {...register("name", { required: "Name is required" })}
            />
            <FormField
              label="Client ID"
              placeholder="Unique identifier provided by the external tool"
              error={errors.client_id?.message}
              required
              {...register("client_id", { required: "Client ID is required" })}
            />
            <FormField
              label="Deployment ID"
              placeholder="Deployment identifier from the tool provider"
              error={errors.deployment_id?.message}
              required
              {...register("deployment_id", {
                required: "Deployment ID is required",
              })}
            />
            <FormField
              label="OIDC Login URL"
              placeholder="https://tool-provider.com/lti/login"
              error={errors.oidc_login_url?.message}
              required
              {...register("oidc_login_url", {
                required: "OIDC Login URL is required",
                pattern: {
                  value: /^https:\/\/.+/,
                  message: "Must be a valid HTTPS URL",
                },
              })}
            />
            <FormField
              label="Redirect URI"
              placeholder="https://tool-provider.com/lti/callback"
              error={errors.redirect_uri?.message}
              required
              {...register("redirect_uri", {
                required: "Redirect URI is required",
                pattern: {
                  value: /^https:\/\/.+/,
                  message: "Must be a valid HTTPS URL",
                },
              })}
            />
            <FormField
              label="JWKS URL"
              placeholder="https://tool-provider.com/.well-known/jwks.json"
              error={errors.jwks_url?.message}
              required
              {...register("jwks_url", {
                required: "JWKS URL is required",
                pattern: {
                  value: /^https:\/\/.+/,
                  message: "Must be a valid HTTPS URL",
                },
              })}
            />
            <FormField
              label="Launch URL"
              placeholder="https://tool-provider.com/app (optional)"
              error={errors.launch_url?.message}
              {...register("launch_url", {
                pattern: {
                  value: /^https:\/\/.+/,
                  message: "Must be a valid HTTPS URL",
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
