import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/useLanguageStore";
import noCourse from "../../../assets/images/no-course.png";

const CourseProgress = ({ progress = [] }) => {
  const { t } = useLanguageStore();

  return (
    <div className="space-y-4">
      <h2 className="text-xl">
        {t?.dashboard?.courseProgress || "Your Course Progress"}
      </h2>

      <div
        className={`bg-white rounded-2xl border border-[#EFEFEF] p-8 ${
          progress.length === 0 ? "min-h-100 flex flex-col" : ""
        }`}
      >
        {progress.length > 0 ? (
          <div className="space-y-6">
            {progress.map((item, index) => (
              <div key={index}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold">
                        {item.title}
                      </h3>

                      <span className="bg-[#EBEBEB] px-4 py-1.75 rounded-[13px] text-sm font-semibold whitespace-nowrap">
                        {item.totalModules} Modules
                      </span>
                    </div>

                    <p className="text-[#00A603] text-base mt-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white w-full sm:w-auto"
                  >
                    View Details
                  </Button>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="w-full bg-[#D9D9D9] rounded-full h-3">
                    <div
                      className="bg-[#00A603] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {item.completedModules} of {item.totalModules} modules
                    completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center text-center space-y-6">
            <div className="flex justify-center">
              <img
                src={noCourse}
                alt="No course illustration"
                className="w-76.75 h-50"
              />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-muted-foreground text-lg">
                You haven't started any modules yet Purchase a module to begin
                your learning journey
              </p>
            </div>

            <div>
              <Button
                variant="outline"
                className="border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white"
                onClick={() => console.log("Explore modules clicked")}
              >
                {t?.dashboard?.exploreModules || "Explore Modules"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseProgress;
