"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { Loader2 } from "lucide-react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, fetchMe, loading } = useUserStore();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else if (!user) {
      fetchMe();
    }
  }, [token, user, fetchMe, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
          <p className="mt-4 text-sm text-text-secondary">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 p-6 md:pl-[286px] max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
