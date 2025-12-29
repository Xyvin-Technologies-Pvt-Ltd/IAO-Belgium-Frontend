import PageHeading from "@/components/PageHeading";
import AppCard from "@/components/student/AppCard";

const MyApp = () => {
  const apps = [
    {
      id: 1,
      title: "Applied Professional Practice-Year 3",
      deadline: "January 15th, 2025",
      status: "Ongoing",
      downloadableCount: 3,
      progress: 50,
      view: true,
    },
    {
      id: 2,
      title: "Applied Professional Practice-Year 2",
      deadline: "December 1st, 2024",
      status: "Submitted",
      downloadableCount: 3,
      progress: 100,
      view: true,
    },
    {
      id: 3,
      title: "Applied Professional Practice-Year 1",
      deadline: "December 1st, 2024",
      status: "Submitted",
      downloadableCount: 3,
      progress: 100,
      view: true,
    },
  ];

  const ongoingApps = apps.filter((app) => app.status === "Ongoing");
  const completedApps = apps.filter((app) => app.status === "Submitted");

  return (
    <div className="min-h-screen space-y-10">
      <PageHeading userName="Maria" />

      <div className="px-5 lg:px-15 mx-auto space-y-8 py-10">
        <section className="space-y-4">
          <h2 className="text-xl">Ongoing APP</h2>
          {ongoingApps.map((app) => (
            <AppCard key={app.id} data={app} />
          ))}
        </section>
        <section className="space-y-4">
          <h2 className="text-xl">Completed APP</h2>
          {completedApps.map((app) => (
            <AppCard key={app.id} data={app} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default MyApp;
