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

const LtiManagement = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPlatformConfigOpen, setIsPlatformConfigOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
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
            LTI Tool Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage LTI 1.3 external tools integrated with the HUB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPlatformConfigOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Platform Config
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Register Tool
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Client ID</TableHead>
            <TableHead>Deployment ID</TableHead>
            <TableHead>OIDC Login URL</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || "Failed to load LTI tools"}
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
                  />
                </TableCell>
                <TableCell>
                  <RowActionMenu
                    actions={[
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(tool),
                      },
                      {
                        label: "Deactivate",
                        icon: Trash2,
                        onClick: () => handleDeleteClick(tool._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <p className="font-medium">No LTI tools registered</p>
                  <p className="text-sm">
                    Click "Register Tool" to add Enatom or another LTI 1.3 tool.
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
