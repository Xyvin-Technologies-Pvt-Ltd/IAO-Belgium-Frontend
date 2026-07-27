import { useState } from "react";
import { Edit, Trash2, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import { Switch } from "@/components/ui/switch";
import RegisterLtiTool from "@/components/admin/lti/RegisterLtiTool";
import PlatformConfigModal from "@/components/admin/lti/PlatformConfigModal";
import { useGetLtiTools, useDeactivateLtiTool, useUpdateLtiTool } from "@/store/useLtiStore";
import { useTranslation } from "react-i18next";
import { useCanModify } from "@/hooks/useCanModify";

const LtiManagement = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("admin");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPlatformConfigOpen, setIsPlatformConfigOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [platformConfigToolId, setPlatformConfigToolId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, error, refetch } = useGetLtiTools();
  const { mutateAsync: deactivateTool, isPending: isDeactivating } = useDeactivateLtiTool();
  const { mutate: updateTool } = useUpdateLtiTool();

  const tools = data?.data || [];

  const handleOpenCreate = () => {
    setSelectedTool(null);
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (tool) => {
    setSelectedTool(tool);
    setIsRegisterOpen(true);
  };

  const handleOpenPlatformConfig = (toolId) => {
    setPlatformConfigToolId(toolId || null);
    setIsPlatformConfigOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deactivateTool(deleteId);
    } finally {
      setDeleteId(null);
      setIsDeleteOpen(false);
    }
  };

  const handleToggleActive = (tool) => {
    updateTool({ id: tool._id, data: { is_active: !tool.is_active } });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            {t("ltiManagement.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("ltiManagement.subtitle")}
          </p>
        </div>
        {canModify && (
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t("ltiManagement.registerTool")}
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("ltiManagement.table.name")}</TableHead>
            <TableHead>{t("ltiManagement.table.clientId")}</TableHead>
            <TableHead>{t("ltiManagement.table.deploymentId")}</TableHead>
            <TableHead>{t("ltiManagement.table.oidcLoginUrl")}</TableHead>
            <TableHead>{t("ltiManagement.table.active")}</TableHead>
            <TableHead>{t("ltiManagement.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("ltiManagement.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : tools.length > 0 ? (
            tools.map((tool) => (
              <TableRow key={tool._id}>
                <TableCell className="font-medium">{tool.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tool.client_id}
                </TableCell>
                <TableCell>{tool.deployment_id}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {tool.oidc_login_url}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={tool.is_active}
                    onCheckedChange={() => handleToggleActive(tool)}
                    disabled={!canModify}
                  />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      ...(canModify
                        ? [
                            {
                              label: t("ltiManagement.actions.edit"),
                              icon: Edit,
                              onClick: () => handleOpenEdit(tool),
                            },
                          ]
                        : []),
                      {
                        label: t("ltiManagement.actions.platformConfig"),
                        icon: Settings,
                        onClick: () => handleOpenPlatformConfig(tool._id),
                      },
                      ...(canModify
                        ? [
                            {
                              label: t("ltiManagement.actions.deactivate"),
                              icon: Trash2,
                              onClick: () => handleDeleteClick(tool._id),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <p className="font-medium">{t("ltiManagement.messages.noTools")}</p>
                  <p className="text-sm">
                    {t("ltiManagement.messages.clickToRegister")}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RegisterLtiTool
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        toolData={selectedTool}
      />

      <PlatformConfigModal
        open={isPlatformConfigOpen}
        onClose={() => setIsPlatformConfigOpen(false)}
        toolId={platformConfigToolId}
      />

      <DeleteConfirm
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        count={1}
        isLoading={isDeactivating}
        data="LTI Tool"
      />
    </div>
  );
};

export default LtiManagement;
