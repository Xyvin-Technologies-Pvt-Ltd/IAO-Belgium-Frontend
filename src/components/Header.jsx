import { MapPin, ChevronDown } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import logo from "../assets/images/logo.png";
import userImage from "../assets/images/user.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguageStore } from "@/store/useLanguageStore";

const Header = () => {
  const { language, setLanguage, t } = useLanguageStore();

  const { location } = useRouterState();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  const navItems = [
    { label: "Dashboard", to: "/student/dashboard" },
    { label: "My Courses", to: "/student/courses" },
    { label: "My APP", to: "/student/app" },
    { label: "Invoices", to: "/student/invoices" },
    { label: "Assessment", to: "/student/assessment" },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const showStudentNavbar = location.pathname.startsWith("/student");

  return (
    <header className="px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="IAO Logo" className="h-10 w-auto" />

          <div className="hidden md:flex items-start gap-3 rounded-full bg-[#FFF2F2] px-6 py-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-semibold">Netherlands</span>
            </div>
          </div>
        </div>

        {showStudentNavbar && (
          <nav className="hidden lg:flex bg-[#FFFFFF]/34 rounded-full px-2 py-1 border border-white">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-6 py-4 rounded-[50px] text-base  transition ${
                  isActive(item.to)
                    ? "bg-primary  shadow-sm"
                    : " hover:text-primary "
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-full bg-white px-2 py-2">
              <img
                src={userImage}
                alt="User Avatar"
                className="h-9 w-9 rounded-full object-cover"
              />

              <div className="hidden md:block text-left">
                <p className="text-base font-medium">Maria Jeen</p>
                <p className="text-xs text-muted-foreground">
                  maria@example.com
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>

            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="text-xs text-muted-foreground mb-1">Language</p>
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 ${
                    language === lang.code ? "bg-orange-50 text-orange-600" : ""
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-red-600">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
