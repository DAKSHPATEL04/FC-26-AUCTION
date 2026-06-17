"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { user } = useUserStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-text-secondary">
            You are logged in as <span className="text-accent-blue font-semibold uppercase">{user?.role}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-text-secondary">Loading dashboard data...</div>
        ) : user?.role === "admin" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Total Teams</h3>
              <p className="mt-2 font-display text-3xl font-bold text-text-primary">{stats?.general?.totalTeams || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Players in Pool</h3>
              <p className="mt-2 font-display text-3xl font-bold text-text-primary">{stats?.general?.playersInPool || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Sold Players</h3>
              <p className="mt-2 font-display text-3xl font-bold text-text-primary">{stats?.general?.soldPlayers || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Remaining Budget</h3>
              <p className="mt-2 font-display text-3xl font-bold text-accent-green">{stats?.general?.totalRemainingBudget?.toLocaleString() || 0}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold text-text-primary">My Squad</h3>
              <p className="mt-2 text-sm text-text-secondary">No players drafted yet. Bids will appear here during live auction.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-lg font-bold text-text-primary">My Budget</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Remaining:</span>
                  <span className="text-accent-green font-bold">
                    {stats?.teamStats?.find((t: any) => t.teamName === user?.name)?.remainingBudget?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-border overflow-hidden">
                  <div 
                    className="h-full bg-accent-green" 
                    style={{ 
                      width: `${(stats?.teamStats?.find((t: any) => t.teamName === user?.name)?.remainingBudget / (stats?.teamStats?.find((t: any) => t.teamName === user?.name)?.totalBudget || 1)) * 100}%` 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
