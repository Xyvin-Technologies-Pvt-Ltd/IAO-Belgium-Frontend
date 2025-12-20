import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleAlert } from "lucide-react";
import { useLanguageStore } from "@/store/useLanguageStore";
import logo from "../../assets/images/logo.png";
import bg from "../../assets/images/login-image.webp";

const Login = () => {
  const [email, setEmail] = useState("");
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const handleEmailSubmit = () => {
    navigate({ to: "/application" });
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

            <div className="space-y-3">
              <Button variant="outline" className="w-full h-11">
                Continue with Google
              </Button>

              <Button variant="outline" className="w-full h-11">
                Continue with Microsoft
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">
                  or use your email
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.login?.emailPlaceholder || "Enter your email"}
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button 
                className="w-full h-11 bg-orange-500 hover:bg-orange-600"
                onClick={handleEmailSubmit}
              >
                Continue with Email
              </Button>

              <p className="text-[10px] text-[#005AC8] text-start bg-[#F5F7FF] rounded-[6px] px-2 py-1 flex items-center gap-2">
                <CircleAlert className="h-3 w-3 shrink-0" />
                We'll send you a one-time verification code to your email
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
