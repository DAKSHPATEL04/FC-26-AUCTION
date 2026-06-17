"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, token, user, error, loading, clearError } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") {
        router.push("/dashboard");
      } else if (user.role === "owner") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = await login(email, password);
    if (success) {
      // User store will redirect in useEffect
    }
  };

  return (
    <div className="flex min-h-screen bg-[#111111] font-sans text-white">
      {/* Left Content Area */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 lg:px-24 xl:px-32 relative z-10 bg-[#111111]">
        <div className="w-full max-w-md">
          {/* Header Texts */}
          <div className="mb-10">
            <p className="text-sm font-semibold tracking-widest text-gray-400 mb-6 uppercase">
              FC26 - SEASON 2026
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-4xl font-black uppercase leading-tight tracking-tight mb-4">
              <span className="text-white block">Are you ready for</span>
              <span className="text-[#10E36C] block">the auction?</span>
            </h1>
            <p className="text-xs font-bold tracking-widest text-white uppercase max-w-sm leading-relaxed opacity-90">
              Enter your email and password to enter the live auction
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-600 bg-transparent px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:border-[#10E36C] focus:outline-none transition-colors"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-600 bg-transparent px-4 py-3.5 pr-20 text-sm text-white placeholder-gray-500 focus:border-[#10E36C] focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-xs font-bold tracking-widest text-white uppercase hover:text-[#10E36C] transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="border border-red-500 bg-red-500/10 p-3 text-sm font-semibold text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center bg-[#10E36C] py-4 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-[#0EA25B] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Enter Auction Hall"
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-xs font-bold uppercase tracking-widest text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white hover:text-[#10E36C] transition-colors ml-1">
              Register Here
            </Link>
          </div>
        </div>
      </div>

      {/* Right Image Area */}
      <div className="hidden md:block md:w-1/2 relative bg-black border-l border-gray-800">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/banner/Jun%2017,%202026,%2003_18_47%20PM3.png" 
            alt="FC 26 Banner" 
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}
