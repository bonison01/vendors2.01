'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/store/userSilce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner"; // Assuming you are using a toast notification library

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  // New state for forgot password dialog
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState("");
  const [forgotPasswordVendorId, setForgotPasswordVendorId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save user_id and encoded role to localStorage
      localStorage.setItem("user_id", data.user.user_id);
      localStorage.setItem("role", btoa(data.role));

      // Dispatch user data to Redux store
      dispatch(setUser(data.user));

      // Fetch the bank_name
      const bankName = data.user.bank_name;

      // Redirect based on role and bank_name
      if (data.role === "Admin") {
        router.push("/admin/dashboard");
      } else if (!bankName || bankName.trim() === "") {
        // No bank_name, redirect to form
        router.push("/form");
      } else {
        // Has bank_name, redirect to parcel
        router.push("/parcel");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    
    try {
      const response = await fetch("/api/forgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: forgotPasswordEmail,
          phone: forgotPasswordPhone,
          vendor_id: forgotPasswordVendorId,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      // Handle success
      toast.success(data.message);
      setForgotPasswordDialogOpen(false); // Close the dialog
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Dialog open={forgotPasswordDialogOpen} onOpenChange={setForgotPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="link" className="ml-auto text-sm underline-offset-4 hover:underline p-0 h-auto">
                  Forgot your password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email, phone, and vendor ID to reset your password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleForgotPasswordSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      placeholder="m@example.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-phone">Phone</Label>
                    <Input
                      id="forgot-phone"
                      placeholder="e.g., +15551234567"
                      value={forgotPasswordPhone}
                      onChange={(e) => setForgotPasswordPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-vendorId">Vendor ID</Label>
                    <Input
                      id="forgot-vendorId"
                      placeholder="e.g., VENDOR_12345"
                      value={forgotPasswordVendorId}
                      onChange={(e) => setForgotPasswordVendorId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="forgot-newPassword">New Password</Label>
                    <Input
                      id="forgot-newPassword"
                      type="password"
                      placeholder="******"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isResetting}>
                      {isResetting ? "Resetting..." : "Reset Password"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        <div className="grid gap-3 relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="******"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-10 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
        <Button type="submit" className="w-full text-white" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Button
          variant="link"
          className="underline underline-offset-4 p-0"
          onClick={(e) => {
            e.preventDefault();
            const params = new URLSearchParams(searchParams);
            params.set("mode", "signup");
            router.push(`/login?${params.toString()}`);
          }}
        >
          Sign up
        </Button>
      </div>
    </form>
  );
}