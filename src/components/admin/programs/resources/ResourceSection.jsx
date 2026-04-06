import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Trash, FileText, Link as LinkIcon, ExternalLink, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ResourceSection = ({ control, register, setValue, append, remove, fields, errors }) => {
  const { t } = useTranslation();
  const resources = useWatch({
    control,
    name: "resources",
  }) || [];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      append({
        type: "file",
        name: file.name.split(".")[0],
        file: file,
        url: "",
      });
    });
    // Reset input
    e.target.value = "";
  };

  const addLink = () => {
    append({
      type: "link",
      name: "",
      url: "",
      file: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          {t("resourceModule.resources.title")}
        </Label>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const resource = resources[index] || field;
          return (
            <div
              key={field.id}
              className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {resource.type === "link" ? (
                    <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                  )}
                  
                  {resource.type === "link" ? (
                    <div className="flex-1 space-y-1">
                        <Input
                          size="sm"
                          placeholder={t("resourceModule.resources.enterUrl")}
                          className="h-8"
                          {...register(`resources.${index}.url`)}
                        />
                      {errors?.resources?.[index]?.url && (
                        <p className="text-[10px] text-red-500">
                          {errors.resources[index].url.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 truncate">
                      <span className="text-sm font-medium">
                        {resource.file
                          ? resource.file.name
                          : resource.name ||
                            t("resourceModule.resources.existingFile")}
                      </span>
                      {resource.file && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          ({(resource.file.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {resource.url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-600"
                      asChild
                    >
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => remove(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pl-7">
               <Input
                size="sm"
                  placeholder={t(
                    "resourceModule.resources.resourceNameOptional",
                  )}
                  className="h-7 text-xs"
                {...register(`resources.${index}.name`)}
              />
            </div>
          </div>
          );
        })}
        
        {resources.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg border-gray-100 dark:border-gray-800">
            <p className="text-sm text-muted-foreground">
              {t("resourceModule.resources.noResources")}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Input
            type="file"
            id="resource-file-upload"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="link"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => document.getElementById("resource-file-upload").click()}
          >
            <Cloud className="h-4 w-4" />
            {t("resourceModule.resources.uploadFile")}
          </Button>
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="flex items-center gap-2"
          onClick={addLink}
        >
          <Plus className="h-4 w-4" />
          {t("resourceModule.resources.addLink")}
        </Button>
      </div>
    </div>
  );
};

export default ResourceSection;
