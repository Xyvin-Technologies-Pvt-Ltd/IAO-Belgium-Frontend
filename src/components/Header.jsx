import { MapPin, ChevronDown } from "lucide-react";
import logo from "../assets/images/logo.png";
import userImage from "../assets/images/user.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguageStore } from "@/store/useLanguageStore";

const Header = () => {
  const { language, setLanguage } = useLanguageStore();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ];

  const currentLanguage = languages.find(
    (lang) => lang.code === language
  );

  return (
    <header className="px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={logo}
            alt="IAO Logo"
            className="h-10 sm:h-12 w-auto"
          />

          {/* Location – hide on mobile */}
          <div className="hidden md:flex items-start gap-3 rounded-full bg-[#FFF2F2] px-6 py-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-muted-foreground">
                Location
              </span>
              <span className="text-sm font-semibold">
                Netherlands
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full flex items-center gap-2 px-2 sm:px-3"
              >
                <span className="text-lg">
                  {currentLanguage?.flag}
                </span>
                <span className="hidden md:inline text-sm">
                  {currentLanguage?.name}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-2 ${
                    language === lang.code
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

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 rounded-full bg-white px-2 py-2">
                <img
                  src={userImage}
                  alt="User Avatar"
                  className="h-9 w-9 rounded-full object-cover"
                />

                <div className="hidden md:block text-left">
                  <p className="text-base font-medium">
                    Maria Jeen
                  </p>
                  <p className="text-xs text-muted-foreground">
                    maria@example.com
                  </p>
                </div>

                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
};

export default Header;
