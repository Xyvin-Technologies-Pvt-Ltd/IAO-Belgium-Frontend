import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { sendOtp } from "@/api/authApi";
import logo from "../assets/images/logo.png";
import bg from "../assets/images/login-image.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { verifyOtp, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setSendingOtp(true);
    clearError();

    try {
      await sendOtp({ email });
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP. Please try again.");
      console.error("Send OTP failed:", err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    clearError();

    try {
      const response = await verifyOtp(email, otp);
      const userRole = response?.data?.user?.role;
      toast.success("Login successful!");
      console.log("OTP verified successfully:", response?.data?.user?.role);

      // Navigate based on user role
      if (userRole === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (userRole === "TEACHER") {
        navigate({ to: "/teacher/dashboard" });
      } else {
        // For students, check if there's a saved step in localStorage
        const savedStep = localStorage.getItem("currentStep");

        if (savedStep) {
          navigate({ to: "/review" });
        } else {
          navigate({ to: "/application" });
        }
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP. Please try again.");
      console.error("OTP verification failed:", err);
    }
  };

  return (
    <div className="h-screen bg-background p-4 lg:p-6">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden bg-background">
        <div className="relative hidden lg:block rounded-2xl overflow-hidden">
          <img src={bg} alt="Login" className="h-full w-full object-cover" />

          <div className="absolute bottom-10 left-10 right-10 text-white max-w-md">
            <img src={logo} alt="logo" className="h-20 mb-4" />
            <h2 className="text-2xl font-semibold leading-snug">
              Take the next step in your academic journey and move closer to
              your goals.
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-start space-y-2 text-center">
              <img src={logo} alt="IAO Logo" className="h-20" />
              <h1 className="text-3xl font-semibold">IAO Online Application</h1>
              <p className="text-sm text-muted-foreground">
                Create your account to get started
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sendingOtp || isLoading || otpSent}
                />
              </div>

              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
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
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email}
                >
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                    onClick={handleVerifyOtp}
                    disabled={isLoading || !otp}
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
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
                    Change Email
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-blue-700 dark:text-blue-300 text-start bg-blue-50 dark:bg-blue-950/30 rounded-[6px] px-2 py-1 flex items-center gap-2">
                <CircleAlert className="h-3 w-3 shrink-0" />
                {!otpSent
                  ? "We'll send you a one-time verification code to your email"
                  : "Enter the 6-digit code sent to your email"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
