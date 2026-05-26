import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Save, Loader2, Upload, FileText } from "lucide-react";
import { useGetStudentCornerConfig, useUpdateStudentCornerConfig } from "@/store/useStudentCornerStore";
import { uploadFile } from "@/api/uploadApi";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DocumentField = ({ index, register, setValue, watch, removeDoc }) => {
  const fileInputRef = useRef(null);
  const fileUrl = watch(`documents.${index}.file_url`);
  const rawFile = watch(`documents.${index}.rawFile`);
  const fileName = rawFile?.name || (fileUrl ? fileUrl.split("/").pop().split("?")[0] : "");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue(`documents.${index}.rawFile`, file, { shouldValidate: true });
    setValue(`documents.${index}.file_url`, "");
  };

  return (
    <div className="flex gap-4 items-start p-4 border rounded-md bg-muted/50">
      <div className="flex-1 space-y-4">
        <Input {...register(`documents.${index}.title`)} placeholder="Document Title" />
        
        <div className="space-y-2">
          <div
            className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors bg-white dark:bg-black relative"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2 text-center">
              {fileName ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <p className="text-sm text-gray-600 dark:text-white/70 truncate max-w-full">
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-400">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to attach document (uploaded on Save)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => removeDoc(index)} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
};

const StudentCornerCMS = () => {
  const { data: responseData, isLoading: loading } = useGetStudentCornerConfig();
  const updateConfigMutation = useUpdateStudentCornerConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      pams_banner: { title: "", subtitle: "", button_text: "", button_link: "" },
      documents: [],
      teacher_cta: { title: "", description: "", apply_link: "", learn_more_link: "" },
      quick_links: [],
      videos: [],
    },
  });

  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({
    control,
    name: "documents",
  });
  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control,
    name: "quick_links",
  });
  const { fields: videoFields, append: appendVideo, remove: removeVideo } = useFieldArray({
    control,
    name: "videos",
  });

  useEffect(() => {
    if (responseData?.data) {
      reset(responseData.data);
    }
  }, [responseData, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payloadDocuments = [];
      for (const doc of data.documents) {
        let finalUrl = doc.file_url;
        if (doc.rawFile) {
          const res = await uploadFile(doc.rawFile);
          finalUrl = res?.data?.file_url || res?.file_url;
          if (!finalUrl) throw new Error(`Upload failed for ${doc.rawFile.name}`);
        }
        payloadDocuments.push({
          title: doc.title,
          file_url: finalUrl
        });
      }

      const { pams_banner, teacher_cta, quick_links, videos } = data;
      
      const cleanVideos = videos.map(v => ({
        title: v.title,
        video_url: v.video_url
      }));
      
      const cleanQuickLinks = quick_links.map(q => ({
        title: q.title,
        url: q.url
      }));
      
      const payload = { 
        pams_banner,
        teacher_cta,
        quick_links: cleanQuickLinks,
        videos: cleanVideos,
        documents: payloadDocuments 
      };
      
      updateConfigMutation.mutate(payload, {
        onSettled: () => setIsSubmitting(false)
      });
    } catch (error) {
      toast.error(error.message || "Save failed");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Student Corner
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/70 mt-1">Manage content for the Student Corner page.</p>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || updateConfigMutation.isPending}
          className="flex items-center gap-2"
        >
          {(isSubmitting || updateConfigMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-8">
        {/* PAMs Banner Section */}
        <section className="bg-card border rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Banner</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register("pams_banner.title")} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input {...register("pams_banner.button_text")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Subtitle</Label>
              <Textarea {...register("pams_banner.subtitle")} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Button Link</Label>
              <Input {...register("pams_banner.button_link")} />
            </div>
          </div>
        </section>

        {/* Teacher CTA Section */}
        <section className="bg-card border rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Teacher CTA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register("teacher_cta.title")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea {...register("teacher_cta.description")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Apply Link</Label>
              <Input {...register("teacher_cta.apply_link")} />
            </div>
            <div className="space-y-2">
              <Label>Learn More Link</Label>
              <Input {...register("teacher_cta.learn_more_link")} />
            </div>
          </div>
        </section>

        {/* Documents Section */}
        <section className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Documents</h3>
            <button type="button" onClick={() => appendDoc({ title: "", file_url: "" })} className="text-primary flex items-center gap-1 text-sm font-medium">
              <Plus className="h-4 w-4" /> Add Document
            </button>
          </div>
          <div className="space-y-4">
            {docFields.map((field, index) => (
              <DocumentField
                key={field.id}
                index={index}
                register={register}
                setValue={setValue}
                watch={watch}
                removeDoc={removeDoc}
              />
            ))}
            {docFields.length === 0 && <p className="text-muted-foreground text-sm">No documents added.</p>}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Links</h3>
            <button type="button" onClick={() => appendLink({ title: "", url: "" })} className="text-primary flex items-center gap-1 text-sm font-medium">
              <Plus className="h-4 w-4" /> Add Link
            </button>
          </div>
          <div className="space-y-4">
            {linkFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md bg-muted/50">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input {...register(`quick_links.${index}.title`)} placeholder="Title" />
                  <Input {...register(`quick_links.${index}.url`)} placeholder="URL" />
                </div>
                <button type="button" onClick={() => removeLink(index)} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {linkFields.length === 0 && <p className="text-muted-foreground text-sm">No quick links added.</p>}
          </div>
        </section>

        {/* Videos Section */}
        <section className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Videos</h3>
            <button type="button" onClick={() => appendVideo({ title: "", video_url: "" })} className="text-primary flex items-center gap-1 text-sm font-medium">
              <Plus className="h-4 w-4" /> Add Video
            </button>
          </div>
          <div className="space-y-4">
            {videoFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md bg-muted/50">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input {...register(`videos.${index}.title`)} placeholder="Title" />
                  <Input {...register(`videos.${index}.video_url`)} placeholder="Video URL" />
                </div>
                <button type="button" onClick={() => removeVideo(index)} className="text-destructive p-2 hover:bg-destructive/10 rounded-md">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {videoFields.length === 0 && <p className="text-muted-foreground text-sm">No videos added.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentCornerCMS;
