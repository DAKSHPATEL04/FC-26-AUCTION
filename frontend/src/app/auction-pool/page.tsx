"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { Player } from "@/types/player.types";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  GripVertical,
  Plus,
  Trash2,
  Search,
  Layers,
  ArrowRightLeft,
  Loader2,
  Sparkles,
  Info,
  CheckCircle,
} from "lucide-react";

export default function AuctionPoolPage() {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";

  const [poolQueue, setPoolQueue] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  
  // Loading & search states
  const [loadingPool, setLoadingPool] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSavedBadge, setOrderSavedBadge] = useState(false);

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch players in pool
  const fetchPoolQueue = useCallback(async () => {
    setLoadingPool(true);
    try {
      const res = await api.get("/api/players", {
        params: { status: "pool", sortBy: "auctionPoolOrder", sortOrder: "asc", limit: 100 },
      });
      // Sort manually just to be absolutely sure
      const sorted = res.data.players.sort(
        (a: Player, b: Player) => (a.auctionPoolOrder ?? 0) - (b.auctionPoolOrder ?? 0)
      );
      setPoolQueue(sorted);
    } catch (err) {
      console.error("Failed to fetch pool queue:", err);
    } finally {
      setLoadingPool(false);
    }
  }, []);

  // Fetch available players (paginated / searched)
  const fetchAvailablePlayers = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const params: Record<string, any> = {
        status: "available",
        sortBy: "rating",
        sortOrder: "desc",
        limit: 15,
      };
      if (searchVal) params.search = searchVal;
      if (positionFilter !== "all") params.positionGroup = positionFilter;

      const res = await api.get("/api/players", { params });
      setAvailablePlayers(res.data.players);
    } catch (err) {
      console.error("Failed to fetch available players:", err);
    } finally {
      setLoadingAvailable(false);
    }
  }, [searchVal, positionFilter]);

  useEffect(() => {
    fetchPoolQueue();
  }, [fetchPoolQueue]);

  useEffect(() => {
    fetchAvailablePlayers();
  }, [fetchAvailablePlayers]);

  // Handle Add to Pool
  const handleAddToPool = async (player: Player) => {
    try {
      await api.patch(`/api/players/${player._id}/pool`, { action: "add" });
      
      // Update local states
      setAvailablePlayers((prev) => prev.filter((p) => p._id !== player._id));
      
      // Re-fetch pool queue to get correct sequence and details
      fetchPoolQueue();
      toast.success("Player added to the auction pool!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add player to pool.");
    }
  };

  // Handle Remove from Pool
  const handleRemoveFromPool = async (player: Player) => {
    try {
      await api.patch(`/api/players/${player._id}/pool`, { action: "remove" });
      
      // Remove from pool list locally
      setPoolQueue((prev) => prev.filter((p) => p._id !== player._id));
      
      // Re-fetch available players list
      fetchAvailablePlayers();
      toast.success("Player removed from the auction pool!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove player from pool.");
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Rearrange locally for preview
    const updated = [...poolQueue];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setPoolQueue(updated);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    // Persist new ordering to the backend
    setSavingOrder(true);
    try {
      const ids = poolQueue.map((p) => p._id);
      await api.put("/api/players/pool/order", { ids });
      
      // Show success badge temporarily
      setOrderSavedBadge(true);
      setTimeout(() => setOrderSavedBadge(false), 2000);
      toast.success("Pool order saved successfully!");
    } catch (err) {
      console.error("Failed to save pool order:", err);
      toast.error("Failed to save pool order in backend.");
    } finally {
      setSavingOrder(false);
    }
  };

  if (!isAdmin) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers size={48} className="text-accent-red mb-4" />
          <h2 className="font-display text-2xl font-bold text-text-primary">Access Denied</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-sm">
            Only auction administrators can manage the live auction queue.
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <Layers className="text-accent-amber" /> Auction Pool Queue Builder
            </h1>
            <p className="text-sm text-text-secondary">
              Prepare the live auction sequence. Drag to re-order the players in the auction pool queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savingOrder && (
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> Saving order...
              </span>
            )}
            {orderSavedBadge && (
              <span className="text-xs text-accent-green font-bold flex items-center gap-1">
                <CheckCircle size={13} /> Order saved!
              </span>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="flex items-start gap-3 rounded-xl border border-accent-blue/15 bg-accent-blue/5 p-4 text-xs text-text-secondary">
          <Info className="text-accent-blue flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold text-text-primary mb-0.5">Queue Priority System</p>
            <p>
              The player at the top (Position 1) will be the next player set up for live bidding when the admin clicks "Next Player" on the live auction screen.
            </p>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* LEFT: Pool Queue (col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="border border-border rounded-xl bg-surface p-4">
              <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                Live Auction Queue ({poolQueue.length})
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                Drag and drop items to sort. Top players will be auctioned first.
              </p>

              {loadingPool ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
                </div>
              ) : poolQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-xl text-center">
                  <ArrowRightLeft className="text-text-muted mb-3" size={28} />
                  <p className="text-sm font-bold text-text-primary">Queue is Empty</p>
                  <p className="text-xs text-text-secondary mt-1 max-w-xs">
                    Search and click "+ Add to Pool" on available players to queue them.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {poolQueue.map((player, idx) => {
                    const posColor =
                      player.positionGroup === "GK" ? "#F59E0B" :
                      player.positionGroup === "DEF" ? "#3B82F6" :
                      player.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                    return (
                      <div
                        key={player._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-surface-elevated/40 transition-colors select-none cursor-grab active:cursor-grabbing"
                      >
                        {/* Drag Handle */}
                        <div className="text-text-muted hover:text-text-primary">
                          <GripVertical size={16} />
                        </div>

                        {/* Order Index */}
                        <span className="font-display text-sm font-bold text-text-secondary w-6 text-center">
                          {idx + 1}
                        </span>

                        {/* Player Rating & Position */}
                        <div
                          className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-surface-elevated text-xs font-display border"
                          style={{ borderColor: `${posColor}30` }}
                        >
                          <span className="font-black text-text-primary leading-none">{player.rating}</span>
                          <span className="text-[8px] font-bold mt-0.5" style={{ color: posColor }}>{player.position}</span>
                        </div>

                        {/* Name & Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{player.commonName || player.name}</p>
                          <p className="text-[10px] text-text-secondary truncate">{player.club} | {player.nation}</p>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => handleRemoveFromPool(player)}
                          title="Remove from Pool"
                          className="p-2 rounded-lg border border-accent-red/20 bg-accent-red/5 text-accent-red hover:bg-accent-red hover:text-white transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Available Database Selector (col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="border border-border rounded-xl bg-surface p-4">
              <h3 className="font-display text-lg font-bold text-text-primary mb-1">
                Available Database
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                Quick search and add players to the queue.
              </p>

              {/* Filters */}
              <div className="flex flex-col gap-3 mb-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search available players..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="w-full bg-background border border-border text-text-primary text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent-blue transition-colors"
                  />
                  <Search className="absolute left-3 top-2.5 text-text-secondary h-3.5 w-3.5" />
                </div>

                {/* Position Group buttons */}
                <div className="flex gap-1">
                  {["all", "GK", "DEF", "MID", "FWD"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        positionFilter === pos
                          ? "bg-accent-blue border-accent-blue text-white"
                          : "bg-background border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              {loadingAvailable ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-secondary">
                  No available players found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {availablePlayers.map((player) => {
                    const posColor =
                      player.positionGroup === "GK" ? "#F59E0B" :
                      player.positionGroup === "DEF" ? "#3B82F6" :
                      player.positionGroup === "MID" ? "#22C55E" : "#EF4444";

                    return (
                      <div
                        key={player._id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background hover:border-text-secondary transition-colors"
                      >
                        {/* Rating & Position */}
                        <div
                          className="flex flex-col items-center justify-center h-9 w-9 rounded bg-surface-elevated text-xs font-display border"
                          style={{ borderColor: `${posColor}30` }}
                        >
                          <span className="font-black text-text-primary leading-none text-[11px]">{player.rating}</span>
                          <span className="text-[7px] font-bold" style={{ color: posColor }}>{player.position}</span>
                        </div>

                        {/* Name & Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{player.commonName || player.name}</p>
                          <p className="text-[9px] text-text-secondary truncate">{player.club} | {player.nation}</p>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => handleAddToPool(player)}
                          className="flex items-center gap-1 bg-accent-amber/10 hover:bg-accent-amber hover:text-black border border-accent-amber/30 text-accent-amber font-bold text-[10px] uppercase px-2.5 py-1.5 rounded transition-all"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
