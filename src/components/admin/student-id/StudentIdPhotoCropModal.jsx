import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/api/uploadApi";

async function getCroppedBlob(imageSrc, cropPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { width, height, x, y } = cropPixels;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Crop failed"));
        else resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

const StudentIdPhotoCropModal = ({
  open,
  title = "Student photo",
  confirmLabel = "Accept and upload",
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const reset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAccept = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Please choose and frame a photo first");
      return;
    }
    try {
      setUploading(true);
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "student-id-photo.jpg", {
        type: "image/jpeg",
      });
      const uploadRes = await uploadFile(file);
      const photo_key =
        uploadRes?.data?.key ||
        uploadRes?.data?.file_key ||
        uploadRes?.key ||
        uploadRes?.data?.url;
      if (!photo_key) {
        throw new Error("Upload did not return a file key");
      }
      try {
        await onSubmit(photo_key);
        reset();
      } catch {
        // Issue/reissue mutation already toasts the API message
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to upload photo",
      );
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const busy = uploading || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border bg-white shadow-xl dark:border-white/20 dark:bg-black">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
            {title}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-4 dark:border-white/20">
            <div className="relative aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  Photo
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              ID photo frame: 21.8 x 28.9 mm (3:4)
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm text-dashboard-text file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-white dark:file:bg-white/10"
            />
            <p className="text-sm text-muted-foreground">
              Resize the photo with the slider, then accept it.
            </p>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={!imageSrc}
              className="w-full accent-[#ff8904]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/10">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={busy || !imageSrc}>
            {busy ? "Uploading…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentIdPhotoCropModal;
