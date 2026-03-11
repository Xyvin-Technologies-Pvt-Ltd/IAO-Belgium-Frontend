import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AppBreadcrumbs } from "../components/ui/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Outlet } from "@tanstack/react-router";
import { BreadcrumbProvider } from "@/context/BreadCrumbContext";
import { useThemeStore } from "@/store/useThemeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Languages } from "lucide-react";
import { getMoment } from "@/utils/dateUtils";
import moment from "moment";
import TeacherNotificationDrawer from "./TeacherNotificationDrawer";

export default function AdminTeacherLayoutComponent() {
  const { initializeTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const isTeacher = user?.role === "teacher";

  const languages = [
    { code: "en", name: t("languages.en"), flag: "🇺🇸" },
    { code: "fr", name: t("languages.fr"), flag: "🇫🇷" },
    { code: "nl", name: t("languages.nl"), flag: "🇳🇱" },
    { code: "de", name: t("languages.de"), flag: "🇩🇪" },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <BreadcrumbProvider>
        <main className="flex min-h-svh flex-1 flex-col overflow-hidden bg-sidebar">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar/80 backdrop-blur-sm border-b border-sidebar-border px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 min-w-0">
              <AppBreadcrumbs />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 sm:px-3 gap-1 sm:gap-2"
                  >
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {currentLanguage.name}
                    </span>
                    <span className="sm:hidden">{currentLanguage.flag}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center gap-2 ${
                        i18n.language === lang.code
                          ? "bg-orange-50 text-orange-600"
                          : ""
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {isTeacher && <TeacherNotificationDrawer />}
              <ThemeToggle />
              <p className="text-xs sm:text-sm text-dashboard-text-secondary hidden md:block">
                {getMoment().format("ddd, DD MMM, YYYY").toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto bg-gradient-to-r from-dashboard-gradient-from to-dashboard-gradient-to">
            <Outlet />
          </div>
        </main>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
