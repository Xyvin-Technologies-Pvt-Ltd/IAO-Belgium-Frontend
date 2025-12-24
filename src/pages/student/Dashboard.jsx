import CourseProgress from "@/components/student/dashboard/CourseProgress";
import CompletedModules from "@/components/student/dashboard/CompletedModules";
import PageHeading from "@/components/PageHeading";
import { useLanguageStore } from "@/store/useLanguageStore";
import ModuleCard from "@/components/student/ModuleCard";

const Dashboard = () => {
  const { t } = useLanguageStore();

  const upcomingModules = [
    {
      id: 1,
      title: "Osteopathic Principles+The Iliosacral Joint",
      tutor: "Dr. Sarah Mitchell",
      date: "March 15-17, 2024",
      time: "Daily: 14:00 - 18:00",
      location: "Brussels Campus",
    },
  ];

  const courseProgress = [
    {
      id: 1,
      title: "Master of Science in Osteopathy - Year 1",
      subtitle: "Great! You've completed 1 modules 7 more to go this year",
      totalModules: 9,
      completedModules: 1,
      progress: 11,
    },
  ];

  const completedModules = [
    {
      id: 1,
      title: "Introduction to visceral osteopathy & the pelvic organs",
      tutor: "Dr. Sarah Mitchell",
      date: "March 15-17, 2024",
      location: "Brussels Campus",
    },
    {
      id: 2,
      title: "Introduction to visceral osteopathy & the pelvic organs",
      tutor: "Dr. Sarah Mitchell",
      date: "March 15-17, 2024",
      location: "Brussels Campus",
    },
  ];

  return (
    <div className="min-h-screen">
      <PageHeading userName="Maria" />

      <div className="px-5 lg:px-15 mx-auto space-y-8 py-10">
        <div className="space-y-4">
          <h2 className="text-xl">
            {t?.dashboard?.upcomingModule || "Upcoming Module"}
          </h2>
          <ModuleCard modules={upcomingModules} />
        </div>

        {courseProgress.length > 0 ? (
          <>
            <div className="space-y-4">
              <h2 className="text-xl">
                {t?.dashboard?.courseProgress || "Your Course Progress"}
              </h2>
              <CourseProgress progress={courseProgress} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl">
                {t?.dashboard?.completedModules || "Completed Modules"}
              </h2>
              <CompletedModules modules={completedModules} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl">
                {t?.dashboard?.courseProgress || "Your Course Progress"}
              </h2>
              <CourseProgress progress={courseProgress} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl">
                {t?.dashboard?.completedModules || "Completed Modules"}
              </h2>
              <CompletedModules modules={completedModules} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
