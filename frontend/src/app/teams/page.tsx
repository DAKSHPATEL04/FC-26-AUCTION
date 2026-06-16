"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Coins,
  Users,
  Star,
  User as UserIcon,
  Shield,
  X,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface TeamData {
  _id: string;
  teamName: string;
  logo?: string;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  totalBudget: number;
  remainingBudget: number;
  players: any[];
  squadSize: number;
  teamValue: number;
  avgRating: number;
  color: string;
}

interface OwnerUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

export default function TeamsPage() {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [owners, setOwners] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Form States
  const [teamName, setTeamName] = useState("");
  const [logo, setLogo] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [totalBudget, setTotalBudget] = useState(1000);
  const [color, setColor] = useState("#3B82F6");

  // Roster View Modal
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<TeamData | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/teams");
      setTeams(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/auth/users?role=owner");
      setOwners(res.data);
    } catch (err) {
      console.error("Failed to fetch owners list:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
    if (isAdmin) {
      fetchOwners();
    }
  }, [isAdmin, fetchTeams]);

  const handleOpenCreateDrawer = () => {
    setDrawerMode("create");
    setTeamName("");
    setLogo("");
    setOwnerId("");
    setTotalBudget(1000);
    setColor("#3B82F6");
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (team: TeamData) => {
    setDrawerMode("edit");
    setSelectedTeamId(team._id);
    setTeamName(team.teamName);
    setLogo(team.logo || "");
    setOwnerId(team.ownerId?._id || "");
    setTotalBudget(team.totalBudget);
    setColor(team.color || "#3B82F6");
    setIsDrawerOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (drawerMode === "create") {
        await api.post("/api/teams", {
          teamName,
          logo,
          ownerId: ownerId || null,
          totalBudget,
          color,
        });
      } else {
        await api.put(`/api/teams/${selectedTeamId}`, {
          teamName,
          logo,
          ownerId: ownerId || null,
          totalBudget,
          color,
        });
      }
      setIsDrawerOpen(false);
      fetchTeams();
      fetchOwners(); // Refresh owners assignment status
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save team.");
    }
  };

  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Drafted players will be released back to the player database.`)) {
      return;
    }
    try {
      await api.delete(`/api/teams/${teamId}`);
      fetchTeams();
      fetchOwners();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete team.");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <Shield className="text-accent-blue" /> Team Management
            </h1>
            <p className="text-sm text-text-secondary">
              Create and manage auction teams, budgets, and view player rosters.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-all"
            >
              <Plus size={16} />
              Create Team
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
              <p className="mt-4 text-sm text-text-secondary">Loading teams data...</p>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
            <Shield size={48} className="text-text-muted mb-4" />
            <h3 className="font-display text-lg font-bold text-text-primary">No Teams Created</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-sm">
              There are currently no teams registered for this season. Admins can create teams using the "Create Team" button.
            </p>
          </div>
        ) : (
          /* Teams Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teams.map((team) => {
              const borderCol = team.color || "#2A2A2A";
              return (
                <motion.div
                  key={team._id}
                  className="relative flex flex-col rounded-2xl border bg-surface overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  style={{ borderColor: `${borderCol}40` }}
                  whileHover={{ scale: 1.01, borderColor: borderCol }}
                  onClick={() => setSelectedTeamRoster(team)}
                >
                  {/* Top color banner */}
                  <div className="h-2 w-full" style={{ backgroundColor: borderCol }} />

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start gap-4">
                      {/* Logo or Shield fallback */}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${borderCol}10`,
                          borderColor: `${borderCol}40`,
                          color: borderCol,
                        }}
                      >
                                {team.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      typeof team.logo === "string" && team.logo.startsWith("http")
                                        ? `/api/image-proxy?url=${encodeURIComponent(team.logo)}`
                                        : team.logo
                                    }
                                    alt={team.teamName}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  team.teamName.slice(0, 2).toUpperCase()
                                )}
                      </div>

                      {/* Name & Owner */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-bold text-text-primary truncate">
                          {team.teamName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-text-secondary">
                          <UserIcon size={13} className="text-text-muted" />
                          <span className="truncate">
                            Owner: <span className="font-semibold text-text-primary">{team.ownerId?.name || "Unassigned"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6 border-t border-b border-border py-4 my-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-green">
                          <Coins size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Budget</p>
                          <p className="text-sm font-black text-text-primary">
                            {team.remainingBudget} <span className="text-[10px] text-text-secondary">/ {team.totalBudget}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-blue">
                          <Users size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Squad</p>
                          <p className="text-sm font-black text-text-primary">
                            {team.squadSize || team.players.length} <span className="text-[10px] text-text-secondary">players</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center text-accent-amber">
                          <Star size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Avg Rating</p>
                          <p className="text-sm font-black text-text-primary">
                            {team.avgRating?.toFixed(1) || "0.0"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
                          <Sparkles size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Total Value</p>
                          <p className="text-sm font-black text-text-primary">
                            {team.teamValue || 0} <span className="text-[10px] text-text-secondary">coins</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditDrawer(team)}
                          title="Edit Team"
                          className="p-2 rounded-lg border border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id, team.teamName)}
                          title="Delete Team"
                          className="p-2 rounded-lg border border-accent-red/30 bg-accent-red/5 text-accent-red hover:bg-accent-red hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Sliding Drawer (Create/Edit) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Content panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-md border-l border-border bg-surface p-6 flex flex-col h-full z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  {drawerMode === "create" ? "Create New Team" : "Edit Team Details"}
                </h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-lg p-1 hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTeam} className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
                <div className="space-y-5">
                  {/* Team Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Manchester Red"
                      className="w-full bg-background border border-border text-text-primary text-sm rounded-lg p-2.5 outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Logo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="e.g. https://domain.com/logo.png"
                      className="w-full bg-background border border-border text-text-primary text-sm rounded-lg p-2.5 outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Owner Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Assign Team Owner
                    </label>
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full bg-background border border-border text-text-primary text-sm rounded-lg p-2.5 outline-none focus:border-accent-blue"
                    >
                      <option value="">-- No Owner Assigned --</option>
                      {owners.map((owner) => (
                        <option
                          key={owner._id}
                          value={owner._id}
                          disabled={owner.teamId !== null && owner.teamId !== selectedTeamId}
                        >
                          {owner.name} ({owner.email}) {owner.teamId && owner.teamId !== selectedTeamId ? " [Already Assigned]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Total Budget (Coins)
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={100000}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      className="w-full bg-background border border-border text-text-primary text-sm rounded-lg p-2.5 outline-none focus:border-accent-blue"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Theme Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-10 w-12 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <span className="text-sm font-semibold text-text-secondary">{color}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-accent-blue py-3 text-sm font-bold text-white hover:bg-accent-blue/80 transition-all"
                  >
                    {drawerMode === "create" ? "Create Team" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Roster View Modal */}
      <AnimatePresence>
        {selectedTeamRoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTeamRoster(null)} />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div
                className="p-6 border-b border-border flex items-center justify-between"
                style={{ borderLeft: `6px solid ${selectedTeamRoster.color || "#3B82F6"}` }}
              >
                <div>
                  <h2 className="font-display text-2xl font-black text-text-primary">
                    {selectedTeamRoster.teamName} Roster
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Owner: <span className="font-semibold text-text-primary">{selectedTeamRoster.ownerId?.name || "Unassigned"}</span> | Remaining Budget: <span className="font-semibold text-accent-green">{selectedTeamRoster.remainingBudget} coins</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTeamRoster(null)}
                  className="rounded-lg p-1 hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Roster List */}
              <div className="p-6 overflow-y-auto flex-1">
                {selectedTeamRoster.players.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    ⚽ No players drafted into this squad yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTeamRoster.players.map((p: any) => {
                      const posColor =
                        p.positionGroup === "GK" ? "#F59E0B" :
                        p.positionGroup === "DEF" ? "#3B82F6" :
                        p.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                      return (
                        <div
                          key={p._id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-text-secondary transition-colors"
                        >
                          {/* Rating & Position */}
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-surface-elevated font-display border border-border">
                            <span className="text-base font-black text-text-primary leading-none">{p.rating}</span>
                            <span className="text-[9px] font-bold mt-0.5" style={{ color: posColor }}>{p.position}</span>
                          </div>

                          {/* Player details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{p.commonName || p.name}</p>
                            <p className="text-xs text-text-secondary truncate mt-0.5">{p.club} | {p.nation}</p>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xs font-bold text-text-muted">Draft Price</p>
                            <p className="text-sm font-black text-accent-amber">{p.soldPrice || p.basePrice || 10} coins</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-4 flex justify-end">
                <button
                  onClick={() => setSelectedTeamRoster(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthenticatedLayout>
  );
}
