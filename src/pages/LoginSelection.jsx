import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GraduationCap, Shield, Users, Copy, Check } from "lucide-react";
import { useGetProgramsList } from "@/store/useProgramStore";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import logo from "../assets/images/logo.png";

const LoginSelection = () => {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { data: programsData, isLoading, error, refetch } = useGetProgramsList();
  const programs = programsData?.data || [];
  const handleAdminLogin = () => {
    // Navigate to admin login (existing login page)
    navigate({ to: "/login" });
  };

  const handleStudentLogin = () => {
    if (!selectedProgram) {
      return;
    }
    
    const studentLoginUrl = `https://student-iao.xyvin.com/login?programId=${selectedProgram}`;
    window.open(studentLoginUrl, '_blank');
  };

  const handleCopyUrl = async () => {
    if (!selectedProgram) return;
    const studentLoginUrl = `https://student-iao.xyvin.com/login?programId=${selectedProgram}`;
    try {
      await navigator.clipboard.writeText(studentLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = studentLoginUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="IAO Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to IAO Learning Management System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your login type to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin & Teacher Login
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Access administrative features, manage programs, review applications, and oversee the learning management system.
              </p>
              <Button 
                onClick={handleAdminLogin}
                className="w-full"
                size="lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Continue as Admin/Teacher
              </Button>
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Student Login
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Access your courses, submit applications, track progress, and manage your academic journey.
              </p>

              <div className="space-y-3 text-left">
                <Label htmlFor="program-select">Select Program *</Label>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : error ? (
                  <ErrorMessage 
                    message={error?.message || "Failed to load programs"}
                    onRetry={refetch}
                    variant="inline"
                  />
                ) : (
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger id="program-select">
                      <SelectValue placeholder="Choose your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program._id} value={program._id}>
                          {program.name} - {program?.city?.name} - {program?.language?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button 
                onClick={handleStudentLogin}
                disabled={!selectedProgram || isLoading}
                className="w-full"
                size="lg"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Continue as Student
              </Button>

              <button
                onClick={handleCopyUrl}
                disabled={!selectedProgram || isLoading}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">URL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy login URL</span>
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;