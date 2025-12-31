'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    business_type: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sign-up failed");
      }

      toast.success(data.message, { position: "top-right" });
      router.push("/login");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your details below to sign up
        </p>
      </div>

      <div className="grid gap-6">
        {/* Business Name */}
        <div className="grid gap-3">
          <Label htmlFor="name">Business Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="John_Doe"
            value={formData.name}
            onChange={handleInputChange}
            required
            pattern="^[a-zA-Z0-9_ ]+$"
          />
        </div>

        {/* Business Type */}
        <div className="grid gap-3">
          <Label htmlFor="business_type">Business Type</Label>
          <Input
            id="business_type"
            name="business_type"
            placeholder="Bakery, Retail, Service, etc."
            value={formData.business_type}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Email */}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Phone */}
        <div className="grid gap-3">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="1234567890"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Address */}
        <div className="grid gap-3">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="123 Main St"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Password */}
        <div className="grid gap-3 relative">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="******"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-9 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <Button type="submit" className="w-full text-white" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </div>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Button
          variant="link"
          className="underline p-0"
          onClick={(e) => {
            e.preventDefault();
            router.push("/login");
          }}
        >
          Login
        </Button>
      </div>
    </form>
  );
}
