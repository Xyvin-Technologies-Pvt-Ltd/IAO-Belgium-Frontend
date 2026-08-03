import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleAlert, Languages, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { sendOtp } from "@/api/authApi";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import logo from "../assets/images/logo.png";
import bg from "../assets/images/login.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const {
    verifyOtp,
    isLoading,
    clearError,
    isAuthenticated,
    role,
    isInitialized,
  } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      if (role === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (role === "teacher") {
        navigate({ to: "/teacher/dashboard" });
      }
    }
  }, [isInitialized, isAuthenticated, role, navigate]);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error(t("login.toast.emailRequired"));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setSendingOtp(true);
    clearError();

    try {
      await sendOtp({ email: normalizedEmail });
      setOtpSent(true);
      toast.success(t("login.toast.otpSentSuccess"));
    } catch (err) {
      toast.error(err.message || t("login.toast.otpSentError"));
      console.error("Send OTP failed:", err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error(t("login.toast.otpRequired"));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    clearError();

    try {
      const response = await verifyOtp(normalizedEmail, otp);
      const userRole = response?.data?.user?.role;
      toast.success(t("login.toast.loginSuccess"));

      // Navigate based on user role
      if (userRole === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (userRole === "teacher") {
        navigate({ to: "/teacher/dashboard" });
      }
    } catch (err) {
      toast.error(err.message || t("login.toast.otpInvalid"));
      console.error("OTP verification failed:", err);
    }
  };

  return (
    <div className="h-screen bg-background p-4 lg:p-6">
      {/* Language switcher and theme toggle in top right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 gap-1 sm:gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{currentLanguage.name}</span>
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
        <ThemeToggle />
      </div>

      <div className="h-full grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden bg-background">
        <div className="relative hidden lg:block rounded-2xl overflow-hidden">
          <img src={bg} alt="Login" className="h-full w-full object-cover" />

          <div className="absolute bottom-10 left-10 right-10 text-white max-w-lg">
            <img src={logo} alt="logo" className="h-20 mb-4" />
            <h2 className="text-2xl font-semibold leading-snug">
              {t("login.subtitle")}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-start space-y-2 text-center">
              <img src={logo} alt="IAO Logo" className="h-20" />
              <h1 className="text-3xl font-semibold">{t("login.title")}</h1>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sendingOtp || isLoading || otpSent}
                />
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">{t("login.otpLabel")}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder={t("login.otpPlaceholder")}
                    className="h-11"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
              )}

              {!otpSent ? (
                <Button
                  className="w-full h-11 "
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email}
                >
                  {sendingOtp ? t("login.loginCodeSending") : t("login.loginCodeButton")}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full h-11"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || !otp}
                  >
                    {isLoading ? t("login.verifyingCode") : t("login.verifyCodeButton")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-11"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    disabled={isLoading}
                  >
                    {t("login.changeEmail")}
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-blue-700 dark:text-blue-300 text-start bg-blue-50 dark:bg-blue-950/30 rounded-[6px] px-2 py-1 flex items-center gap-2">
                <CircleAlert className="h-3 w-3 shrink-0" />
                {!otpSent
                  ? t("login.otpInstructions")
                  : t("login.otpSentInstructions")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
