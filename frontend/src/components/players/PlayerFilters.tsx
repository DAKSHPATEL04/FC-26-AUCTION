"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, SlidersHorizontal, Search } from "lucide-react";
import { PlayerFilters } from "@/types/player.types";

const POSITION_GROUPS = ["GK", "DEF", "MID", "FWD"];
const POSITIONS: Record<string, string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB", "LWB", "RWB"],
  MID: ["CDM", "CM", "CAM", "LM", "RM"],
  FWD: ["ST", "CF", "LW", "RW"],
};
const POSITION_COLORS: Record<string, string> = {
  GK: "#F59E0B",
  DEF: "#3B82F6",
  MID: "#22C55E",
  FWD: "#EF4444",
};

interface PlayerFiltersProps {
  filters: PlayerFilters;
  onChange: (filters: PlayerFilters) => void;
  nations: string[];
  clubs: string[];
  leagues: string[];
  onReset: () => void;
}

export default function PlayerFiltersPanel({
  filters,
  onChange,
  nations,
  clubs,
  leagues,
  onReset,
}: PlayerFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [nationSearch, setNationSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [leagueSearch, setLeagueSearch] = useState("");

  // Local name search — debounced 350ms before firing onChange
  const [nameInput, setNameInput] = useState(filters.search ?? "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync nameInput when parent resets filters
  useEffect(() => {
    if (!filters.search) setNameInput("");
  }, [filters.search]);

  const handleNameChange = (value: string) => {
    setNameInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange({ ...filters, search: value });
    }, 350);
  };

  const updateFilter = (key: keyof PlayerFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const filteredNations = nations.filter((n) =>
    n.toLowerCase().includes(nationSearch.toLowerCase())
  );
  const filteredClubs = clubs.filter((c) =>
    c.toLowerCase().includes(clubSearch.toLowerCase())
  );
  const filteredLeagues = leagues.filter((l) =>
    l.toLowerCase().includes(leagueSearch.toLowerCase())
  );

  const activeFiltersCount = [
    filters.search,
    filters.positionGroup,
    filters.position,
    filters.nation,
    filters.club,
    filters.league,
    filters.status,
    filters.ratingMin && filters.ratingMin > 0,
    filters.ratingMax && filters.ratingMax < 99,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-1">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-text-secondary" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">

          {/* ── Player Name Search ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Search by Name
            </p>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Player name or common name..."
                value={nameInput}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-8 pr-8 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none transition-colors"
              />
              {nameInput && (
                <button
                  type="button"
                  onClick={() => handleNameChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── Position ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Position
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {POSITION_GROUPS.map((pg) => {
                const color = POSITION_COLORS[pg];
                const isActive = filters.positionGroup === pg;
                return (
                  <button
                    key={pg}
                    onClick={() => updateFilter("positionGroup", isActive ? undefined : pg)}
                    className="rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: isActive ? `${color}22` : "transparent",
                      color: isActive ? color : "#A1A1A1",
                      border: `1px solid ${isActive ? color : "#2A2A2A"}`,
                    }}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            {filters.positionGroup && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {POSITIONS[filters.positionGroup]?.map((pos) => {
                  const isActive = filters.position === pos;
                  const color = POSITION_COLORS[filters.positionGroup!];
                  return (
                    <button
                      key={pos}
                      onClick={() => updateFilter("position", isActive ? undefined : pos)}
                      className="rounded-md px-2 py-1 text-[11px] font-semibold transition-all"
                      style={{
                        backgroundColor: isActive ? `${color}22` : "#1C1B1B",
                        color: isActive ? color : "#A1A1A1",
                        border: `1px solid ${isActive ? color : "#2A2A2A"}`,
                      }}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Rating Range ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Rating: {filters.ratingMin ?? 0} – {filters.ratingMax ?? 99}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 text-right text-xs text-text-muted">Min</span>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={filters.ratingMin ?? 0}
                  onChange={(e) => updateFilter("ratingMin", Number(e.target.value))}
                  className="flex-1 accent-accent-blue h-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 text-right text-xs text-text-muted">Max</span>
                <input
                  type="range"
                  min={0}
                  max={99}
                  value={filters.ratingMax ?? 99}
                  onChange={(e) => updateFilter("ratingMax", Number(e.target.value))}
                  className="flex-1 accent-accent-blue h-1"
                />
              </div>
            </div>
          </div>

          {/* ── Nation ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Nation
            </p>
            <input
              type="text"
              placeholder="Search nation..."
              value={nationSearch}
              onChange={(e) => setNationSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
            />
            {nationSearch && filteredNations.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-border bg-surface-elevated">
                {filteredNations.slice(0, 8).map((n) => (
                  <button
                    key={n}
                    onClick={() => { updateFilter("nation", n); setNationSearch(n); }}
                    className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-border ${
                      filters.nation === n ? "text-accent-blue" : "text-text-secondary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {filters.nation && (
              <div className="mt-1 flex items-center gap-1 rounded-lg bg-accent-blue/10 px-2 py-1">
                <span className="flex-1 text-xs text-accent-blue">{filters.nation}</span>
                <button onClick={() => { updateFilter("nation", undefined); setNationSearch(""); }}>
                  <X size={12} className="text-accent-blue" />
                </button>
              </div>
            )}
          </div>

          {/* ── Club ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Club
            </p>
            <input
              type="text"
              placeholder="Search club..."
              value={clubSearch}
              onChange={(e) => setClubSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
            />
            {clubSearch && filteredClubs.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-border bg-surface-elevated">
                {filteredClubs.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    onClick={() => { updateFilter("club", c); setClubSearch(c); }}
                    className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-border ${
                      filters.club === c ? "text-accent-blue" : "text-text-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {filters.club && (
              <div className="mt-1 flex items-center gap-1 rounded-lg bg-accent-blue/10 px-2 py-1">
                <span className="flex-1 text-xs text-accent-blue">{filters.club}</span>
                <button onClick={() => { updateFilter("club", undefined); setClubSearch(""); }}>
                  <X size={12} className="text-accent-blue" />
                </button>
              </div>
            )}
          </div>

          {/* ── League ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              League
            </p>
            <input
              type="text"
              placeholder="Search league..."
              value={leagueSearch}
              onChange={(e) => setLeagueSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none"
            />
            {leagueSearch && filteredLeagues.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-border bg-surface-elevated">
                {filteredLeagues.slice(0, 8).map((l) => (
                  <button
                    key={l}
                    onClick={() => { updateFilter("league", l); setLeagueSearch(l); }}
                    className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-border ${
                      filters.league === l ? "text-accent-blue" : "text-text-secondary"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            {filters.league && (
              <div className="mt-1 flex items-center gap-1 rounded-lg bg-accent-blue/10 px-2 py-1">
                <span className="flex-1 text-xs text-accent-blue">{filters.league}</span>
                <button onClick={() => { updateFilter("league", undefined); setLeagueSearch(""); }}>
                  <X size={12} className="text-accent-blue" />
                </button>
              </div>
            )}
          </div>

          {/* ── Status ── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              Status
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "All Players", value: "" },
                { label: "Available", value: "available" },
                { label: "In Pool", value: "pool" },
                { label: "Sold", value: "sold" },
                { label: "Unsold", value: "unsold" },
              ].map(({ label, value }) => (
                <label key={value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={(filters.status ?? "") === value}
                    onChange={() => updateFilter("status", value || undefined)}
                    className="accent-accent-blue"
                  />
                  <span className="text-xs text-text-secondary">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Reset ── */}
          <button
            onClick={onReset}
            className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-text-secondary hover:border-accent-red hover:text-accent-red transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
