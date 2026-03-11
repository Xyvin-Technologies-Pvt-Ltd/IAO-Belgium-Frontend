import UserCard from "@/components/admin/UserCard";
import { ErrorMessage, LoadingState } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetStudentById } from "@/store/useStudentStore";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import StatusBadge from "@/components/StatusBadge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const StudentView = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: student, isLoading, error, refetch } = useGetStudentById(id);

  useEffect(() => {
    if (student?.data) {
      updateBreadcrumbs([
        {
          label: "Student Management",
          path: "/admin/student-management",
          navigable: true,
        },
        {
          label: "Student Details",
          path: "/admin/student-management",
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [student?.data, id]);

  if (isLoading) {
    return (
      <LoadingState text={t("intakeManagement.details.loading")} fullHeight />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("intakeManagement.details.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const studentData = student?.data;
  if (!studentData) return null;

  const modules = studentData?.completed_modules || [];
  const exams = studentData?.completed_exams || [];
  const apps = studentData?.completed_submissions || [];
  const attendance = studentData?.attendance_percentage || 0;

  const attendanceData = [
    { name: "Present", value: attendance, color: "#FFCD71" },
    { name: "Absent", value: 100 - attendance, color: "#FFF7E8" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 mt-4 bg-sidebar  rounded-xl p-5 border border-sidebar-border">
      <UserCard student={studentData} hide />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold mb-4">Completed Modules</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module ID</TableHead>
                <TableHead>Module Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length > 0 ? (
                modules.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell>{m.uid}</TableCell>
                    <TableCell>{m.name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    No modules completed
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <h3 className="font-semibold mb-4">Completed Exams</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Scores</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <TableRow key={exam._id}>
                    <TableCell>{exam.exam_name}</TableCell>
                    <TableCell>{exam.percentage?.toFixed(2)}/100</TableCell>
                    <TableCell>
                      <StatusBadge status={exam.result} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No exams completed
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <h3 className="font-semibold mb-4">Completed APPs</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>APP</TableHead>
                <TableHead>Scores</TableHead>
                <TableHead>Submitted Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.length > 0 ? (
                apps.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.score || "-"}</TableCell>
                    <TableCell>
                      {formatTZ(app.submitted_at, "DD MMM YYYY") || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No APP submissions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <h3 className="font-semibold mb-4">Attendance</h3>

          <div className="border border-sidebar-border rounded-lg p-6 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  cx="50%"
                  cy="90%"
                  innerRadius={80}
                  outerRadius={100}
                  stroke="none"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-3xl font-semibold text-black">
              {attendance}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
