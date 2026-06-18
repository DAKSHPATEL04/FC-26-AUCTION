"use client";

import { useEffect, useState, useCallback } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import PlayerCard from "@/components/players/PlayerCard";
import PlayerFiltersPanel from "@/components/players/PlayerFilters";
import PlayerDetailModal from "@/components/players/PlayerDetail";
import { Player, PlayerFilters, PlayersResponse } from "@/types/player.types";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { Loader2, ArrowUpDown } from "lucide-react";

export default function PlayersPage() {
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";

  // Filter States
  const [filters, setFilters] = useState<PlayerFilters>({
    search: "",
    positionGroup: undefined,
    position: undefined,
    ratingMin: 0,
    ratingMax: 99,
    nation: undefined,
    club: undefined,
    league: undefined,
    status: undefined,
    sortBy: "rating",
    sortOrder: "desc",
  });

  const [searchVal, setSearchVal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Distinct filter options
  const [filterOptions, setFilterOptions] = useState<{
    nations: string[];
    clubs: string[];
    leagues: string[];
  }>({
    nations: [],
    clubs: [],
    leagues: [],
  });

  // Player query response
  const [playersData, setPlayersData] = useState<PlayersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Fetch distinct filters
  const fetchFilterOptions = async () => {
    try {
      const res = await api.get("/api/players/filters");
      setFilterOptions(res.data);
    } catch (err: any) {
      console.error("Failed to fetch filter options", err);
    }
  };

  // Fetch players matching filters
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.search) params.search = filters.search;
      if (filters.positionGroup) params.positionGroup = filters.positionGroup;
      if (filters.position) params.position = filters.position;
      if (filters.ratingMin !== undefined && filters.ratingMin > 0) params.ratingMin = filters.ratingMin;
      if (filters.ratingMax !== undefined && filters.ratingMax < 99) params.ratingMax = filters.ratingMax;
      if (filters.nation) params.nation = filters.nation;
      if (filters.club) params.club = filters.club;
      if (filters.league) params.league = filters.league;
      if (filters.status) params.status = filters.status;

      const res = await api.get("/api/players", { params });
      setPlayersData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load players.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleResetFilters = () => {
    setSearchVal("");
    setPage(1);
    setFilters({
      search: "",
      positionGroup: undefined,
      position: undefined,
      ratingMin: 0,
      ratingMax: 99,
      nation: undefined,
      club: undefined,
      league: undefined,
      status: undefined,
      sortBy: "rating",
      sortOrder: "desc",
    });
  };

  const handleAddToPool = async (player: Player) => {
    try {
      const action = player.status === "pool" ? "remove" : "add";
      const res = await api.patch(`/api/players/${player._id}/pool`, { action });
      
      // Update local state
      setPlayersData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p._id === player._id ? { ...p, status: res.data.player.status, auctionPoolOrder: res.data.player.auctionPoolOrder } : p
          ),
        };
      });

      // Update selected player modal if open
      setSelectedPlayer((prev) => {
        if (prev?._id === player._id) {
          return { ...prev, status: res.data.player.status, auctionPoolOrder: res.data.player.auctionPoolOrder };
        }
        return prev;
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update player pool status.");
    }
  };

  const handleAddToWatchlist = async (player: Player) => {
    try {
      // Toggle watchlist on the backend
      const res = await api.post("/api/watchlist/toggle", { playerId: player._id });
      alert(res.data.message || "Watchlist updated successfully.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update watchlist.");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
              Player Database
            </h1>
            <p className="text-sm text-text-secondary">
              Search and filter EA FC 26 players to build your team.
            </p>
          </div>
        </div>

        {/* Sort Panel */}
        <div className="flex flex-wrap gap-3 items-center justify-end bg-surface border border-border rounded-xl p-4">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mr-auto">
            <ArrowUpDown size={14} />
            Sort By:
          </span>
          <select
            value={filters.sortBy}
            onChange={(e) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
            }}
            className="bg-background border border-border text-text-primary text-xs rounded-lg px-3 py-2 outline-none focus:border-accent-blue"
          >
            <option value="rating">Rating</option>
            <option value="name">Name</option>
            <option value="pace">Pace</option>
            <option value="shooting">Shooting</option>
            <option value="passing">Passing</option>
            <option value="dribbling">Dribbling</option>
            <option value="defending">Defending</option>
            <option value="physical">Physical</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, sortOrder: e.target.value as "asc" | "desc" }));
            }}
            className="bg-background border border-border text-text-primary text-xs rounded-lg px-3 py-2 outline-none focus:border-accent-blue"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Main Grid: Left Filters, Right Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filters Column */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 z-10">
            <PlayerFiltersPanel
              filters={filters}
              onChange={(newFilters) => {
                setPage(1);
                setFilters(newFilters);
              }}
              nations={filterOptions.nations}
              clubs={filterOptions.clubs}
              leagues={filterOptions.leagues}
              onReset={handleResetFilters}
            />
          </div>

          {/* Results Grid Column */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {error && (
              <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red text-center">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-blue" />
                  <p className="mt-4 text-sm text-text-secondary">Loading player cards...</p>
                </div>
              </div>
            ) : playersData?.players.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center">
                <span className="text-4xl">⚽</span>
                <h3 className="mt-4 font-display text-lg font-bold text-text-primary">No Players Found</h3>
                <p className="mt-2 text-sm text-text-secondary max-w-sm">
                  We couldn't find any players matching your filter settings. Try resetting filters or updating your search query.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 rounded-lg bg-surface-elevated border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-elevated/80 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Info and pagination summary */}
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <span>Found {playersData?.total || 0} Players</span>
                  <span>
                    Page {playersData?.page} of {playersData?.totalPages}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {playersData?.players.map((player) => (
                    <PlayerCard
                      key={player._id}
                      player={player}
                      isAdmin={isAdmin}
                      onView={(p) => setSelectedPlayer(p)}
                      onAddToPool={handleAddToPool}
                      onAddToWatchlist={handleAddToWatchlist}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {playersData && playersData.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-6 mt-4">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1.5 hidden sm:flex">
                      {Array.from({ length: Math.min(5, playersData.totalPages) }, (_, i) => {
                        let pageNum = page;
                        if (page <= 3) pageNum = i + 1;
                        else if (page >= playersData.totalPages - 2) pageNum = playersData.totalPages - 4 + i;
                        else pageNum = page - 2 + i;

                        // Ensure page bounds
                        if (pageNum < 1 || pageNum > playersData.totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`rounded-lg h-9 w-9 text-xs font-bold transition-all ${
                              page === pageNum
                                ? "bg-accent-blue text-white"
                                : "bg-surface border border-border text-text-secondary hover:text-text-primary"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      disabled={page === playersData.totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, playersData.totalPages))}
                      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isAdmin={isAdmin}
          onClose={() => setSelectedPlayer(null)}
          onAddToPool={() => handleAddToPool(selectedPlayer)}
          onAddToWatchlist={() => handleAddToWatchlist(selectedPlayer)}
          onPlayerUpdated={(updatedPlayer) => {
            setPlayersData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p => p._id === updatedPlayer._id ? updatedPlayer : p)
              };
            });
            setSelectedPlayer(updatedPlayer);
          }}
        />
      )}
    </AuthenticatedLayout>
  );
}
