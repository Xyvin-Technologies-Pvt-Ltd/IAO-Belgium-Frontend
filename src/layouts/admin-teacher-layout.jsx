import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { AppBreadcrumbs } from "../components/ui/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Outlet } from "@tanstack/react-router";
import { BreadcrumbProvider } from "@/context/BreadCrumbContext";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AdminTeacherLayoutComponent() {
  const { initializeTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const languages = [
    { code: "en", name: t("languages.en"), flag: "🇺🇸" },
    { code: "fr", name: t("languages.fr"), flag: "🇫🇷" },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <BreadcrumbProvider>
        <main className="flex min-h-svh flex-1 flex-col overflow-hidden bg-sidebar">
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-sidebar/80 backdrop-blur-sm border-b border-sidebar-border px-4">
            <SidebarTrigger className="-ml-1" />
            <AppBreadcrumbs />
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <span className="text-lg">{currentLanguage.flag}</span>
                    <span className="text-xs font-medium uppercase">{currentLanguage.code}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex items-center gap-2 ${
                        i18n.language === lang.code ? "bg-orange-50 text-orange-600" : ""
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
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
