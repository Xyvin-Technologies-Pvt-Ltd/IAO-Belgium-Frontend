import { Check, Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const ViewRole = ({ open, onClose, roleData }) => {
  const { t } = useTranslation();

  const PERMISSION_MODULES = [
    {
      name: t("roleManagement.permissions.rolesManagement"),
      viewId: "roles_management_view",
      modifyId: "roles_management_modify",
    },
    {
      name: t("roleManagement.permissions.adminManagement"),
      viewId: "admin_management_view",
      modifyId: "admin_management_modify",
    },
    {
      name: t("roleManagement.permissions.operationsManagement"),
      viewId: "operations_management_view",
      modifyId: "operations_management_modify",
    },
    {
      name: t("roleManagement.permissions.academicManagement"),
      viewId: "academic_management_view",
      modifyId: "academic_management_modify",
    },
    {
      name: t("roleManagement.permissions.financeManagement"),
      viewId: "finance_management_view",
      modifyId: "finance_management_modify",
    },
    {
      name: t("roleManagement.permissions.masterDataManagement"),
      viewId: "master_data_management_view",
      modifyId: "master_data_management_modify",
    },
    {
      name: t("roleManagement.permissions.logsManagement"),
      viewId: "logs_management_view",
      modifyId: null,
    },
  ];

  if (!open || !roleData) return null;

  const permissions = roleData.permissions || [];

  const hasPermission = (permissionId) => {
    return permissionId && permissions.includes(permissionId);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-150 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("roleManagement.view.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70 mt-1">
              {t("roleManagement.view.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("roleManagement.modal.nameLabel")}
            </h3>
            <p className="text-base text-gray-900 dark:text-white">
              {roleData.name}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("roleManagement.modal.descriptionLabel")}
            </h3>
            <p className="text-base text-gray-900 dark:text-white">
              {roleData.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("roleManagement.modal.permissionsLabel")}
            </h3>
            <div className="border dark:border-white/20 rounded-lg overflow-hidden bg-white dark:bg-black">
              <div className="grid grid-cols-[2fr_100px_100px] gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-white/20">
                <div></div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {t("roleManagement.modal.viewLabel")}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {t("roleManagement.modal.modifyLabel")}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {PERMISSION_MODULES.map((module, index) => (
                  <div
                    key={module.name}
                    className={`grid grid-cols-[2fr_100px_100px] gap-4 p-4 items-center ${
                      index !== PERMISSION_MODULES.length - 1
                        ? "border-b dark:border-white/10"
                        : ""
                    }`}
                  >
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {module.name}
                    </div>
                    <div className="flex justify-center">
                      {hasPermission(module.viewId) ? (
                        <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <Minus className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <div className="flex justify-center">
                      {module.modifyId ? (
                        hasPermission(module.modifyId) ? (
                          <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Minus className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                        )
                      ) : (
                        <Minus className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewRole;
