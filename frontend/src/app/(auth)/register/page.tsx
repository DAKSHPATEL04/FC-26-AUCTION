"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface/30 p-8 backdrop-blur-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
            CREATE ACCOUNT
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Join the EA FC 26 Friends Auction
          </p>
        </div>

        {success ? (
          <div className="rounded-lg border border-accent-green bg-accent-green/10 p-4 text-center text-sm text-accent-green">
            Registration successful! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface p-3 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Register As
              </label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("owner")}
                  className={`rounded-lg border p-3 text-sm font-semibold transition-all ${
                    role === "owner"
                      ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                      : "border-border bg-surface text-text-secondary"
                  }`}
                >
                  Team Owner
                </button>
                <button
                  type="button"
                  onClick={() => setRole("guest")}
                  className={`rounded-lg border p-3 text-sm font-semibold transition-all ${
                    role === "guest"
                      ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                      : "border-border bg-surface text-text-secondary"
                  }`}
                >
                  Guest Watcher
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-accent-red bg-accent-red/10 p-3 text-center text-xs text-accent-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-text-primary py-3 text-sm font-semibold text-background transition-all hover:bg-text-secondary disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Register"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-blue hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
