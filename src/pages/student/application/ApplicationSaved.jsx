import { Copy } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import checkIcon from "../../../assets/images/Group (2).png";
const ApplicationSaved = ({ applicationReference = "IAO-2025-9ERQ9M" }) => {
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/login" });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#ccccccc]/80 p-8 max-w-xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <img src={checkIcon} alt="Success Icon" className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl">
            {t?.applicationSaved?.title || "Your application has been saved"}
          </h2>

          <div className="space-y-2">
            <p className="text-muted-foreground text-lg">
              {t?.applicationSaved?.subtitle1 ||
                "You can return anytime to complete your application."}
              {t?.applicationSaved?.subtitle2 ||
                "We've saved your progress so far."}
            </p>
          </div>
        </div>
        <div className="p-4 bg-[#F9F9F9] rounded-md space-y-2 text-left">
          <div className="flex items-center gap-2">
            <p className="text-base text-gray-800">
              {t?.applicationSaved?.referenceLabel || "Application Reference:"}
            </p>

            <p className="text-base font-semibold text-gray-900">
              {applicationReference}
            </p>

            <button
              onClick={() =>
                navigator.clipboard.writeText(applicationReference)
              }
              className="ml-1 p-1 rounded hover:bg-gray-200"
            >
              <Copy className="w-4 h-4 text-gray-700" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {t?.applicationSaved?.referenceNote ||
              "Please save this reference number for future correspondence"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSaved;
