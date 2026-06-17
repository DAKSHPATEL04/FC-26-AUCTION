"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "guest">("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/register", { name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#111111] font-sans text-white">
      {/* Left Content Area */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 lg:px-24 xl:px-32 relative z-10 bg-[#111111] py-6 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Header Texts */}
          <div className="mb-8">
            <p className="text-sm font-semibold tracking-widest text-gray-400 mb-4 uppercase">
              FC26 - SEASON 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase leading-tight tracking-tight mb-3">
              <span className="text-white">Create </span>
              <span className="text-[#10E36C]">account</span>
            </h1>
            <p className="text-xs font-bold tracking-widest text-white uppercase max-w-sm leading-relaxed opacity-90">
              Join the EA FC 26 Friends Auction
            </p>
          </div>

          {success ? (
            <div className="border border-[#10E36C] bg-[#10E36C]/10 p-4 text-center text-sm font-bold text-[#10E36C] uppercase tracking-widest">
              Registration successful! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-600 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#10E36C] focus:outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-600 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#10E36C] focus:outline-none transition-colors"
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
                    className="w-full border border-gray-600 bg-transparent px-4 py-3 pr-20 text-sm text-white placeholder-gray-500 focus:border-[#10E36C] focus:outline-none transition-colors"
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

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white">
                  Register As
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                      role === "owner"
                        ? "border-[#10E36C] bg-[#10E36C]/10 text-[#10E36C]"
                        : "border-gray-600 bg-transparent text-gray-400 hover:border-gray-400 hover:text-white"
                    }`}
                  >
                    Team Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("guest")}
                    className={`border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                      role === "guest"
                        ? "border-[#10E36C] bg-[#10E36C]/10 text-[#10E36C]"
                        : "border-gray-600 bg-transparent text-gray-400 hover:border-gray-400 hover:text-white"
                    }`}
                  >
                    Guest
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
                className="mt-6 flex w-full items-center justify-center bg-[#10E36C] py-4 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-[#0EA25B] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          {/* Additional Links */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-xs font-bold uppercase tracking-widest text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:text-[#10E36C] transition-colors ml-1">
              Sign In Here
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
