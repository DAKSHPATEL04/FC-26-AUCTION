"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import PlayerCard from "@/components/players/PlayerCard";
import PlayerDetailModal from "@/components/players/PlayerDetail";
import { Player } from "@/types/player.types";
import { api } from "@/lib/api";
import { Loader2, Bookmark, SlidersHorizontal } from "lucide-react";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/watchlist");
      // The watchlist response has populated "players"
      setWatchlist(res.data.players || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemoveFromWatchlist = async (player: Player) => {
    try {
      await api.post("/api/watchlist/toggle", { playerId: player._id });
      // Remove from state locally
      setWatchlist((prev) => prev.filter((p) => p._id !== player._id));
      
      // Close modal if open
      if (selectedPlayer?._id === player._id) {
        setSelectedPlayer(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove player from watchlist.");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
            <Bookmark className="text-accent-blue" /> My Watchlist
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Keep track of targeted players during the live bidding session.
          </p>
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
              <p className="mt-4 text-sm text-text-secondary">Loading watchlisted players...</p>
            </div>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
            <Bookmark size={48} className="text-text-muted mb-4" />
            <h3 className="font-display text-lg font-bold text-text-primary">Your Watchlist is Empty</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-sm">
              You haven't bookmarked any players yet. Go to the Player Database page and click the bookmark icon on any player.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.map((player) => (
              <PlayerCard
                key={player._id}
                player={player}
                isAdmin={false}
                onView={(p) => setSelectedPlayer(p)}
                onAddToWatchlist={handleRemoveFromWatchlist} // bookmarks act as toggle/remove
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isAdmin={false}
          onClose={() => setSelectedPlayer(null)}
          onAddToWatchlist={() => handleRemoveFromWatchlist(selectedPlayer)}
        />
      )}
    </AuthenticatedLayout>
  );
}
