"use client";

import { useEffect, useState, useRef } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import PlayerDetailModal from "@/components/players/PlayerDetail";
import { Player } from "@/types/player.types";
import {
  Tv2,
  Coins,
  Users,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Eye,
  Loader2,
  Gavel,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/lib/toast";

interface SocketPlayer {
  _id: string;
  name: string;
  commonName: string;
  image?: string;
  nation?: string;
  nationFlag?: string;
  club?: string;
  clubLogo?: string;
  league?: string;
  position: string;
  positionGroup: string;
  rating: number;
  basePrice: number;
}

interface SocketBidder {
  _id: string;
  teamName: string;
  logo?: string;
  color?: string;
}

interface BidFeedItem {
  teamId: string;
  teamName: string;
  color: string;
  amount: number;
  timestamp: Date;
}

export default function LiveAuctionPage() {
  const { user, fetchMe } = useUserStore();
  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "owner";

  const [socket, setSocket] = useState<Socket | null>(null);

  // Keep a ref to soundEnabled so socket handlers always read the latest value
  // without needing to re-register the socket
  const soundEnabledRef = useRef(true);

  // Auction State
  const [currentPlayer, setCurrentPlayer] = useState<SocketPlayer | null>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState<SocketBidder | null>(null);
  const [timer, setTimer] = useState(30);
  const [status, setStatus] = useState<"idle" | "bidding" | "paused">("idle");
  const [minBidIncrement, setMinBidIncrement] = useState(10);
  const [bidHistory, setBidHistory] = useState<BidFeedItem[]>([]);

  // Local owner info (budget & squad space)
  const [ownerTeam, setOwnerTeam] = useState<{
    _id: string;
    teamName: string;
    remainingBudget: number;
    players: any[];
    color: string;
  } | null>(null);

  // UI States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soldOverlay, setSoldOverlay] = useState<any>(null);
  const [unsoldOverlay, setUnsoldOverlay] = useState<string | null>(null);
  const overlayActiveRef = useRef(false);

  useEffect(() => {
    overlayActiveRef.current = !!(soldOverlay || unsoldOverlay);
  }, [soldOverlay, unsoldOverlay]);

  // Last sale result shown on idle stage
  const [lastSale, setLastSale] = useState<{
    playerName: string;
    buyerName: string;
    price: number;
    playerImage?: string;
    buyerColor?: string;
  } | null>(null);
  
  // Custom Bid Input
  const [customBid, setCustomBid] = useState("");
  // Admin Timer Control
  const [adminTimerInput, setAdminTimerInput] = useState("30");
  // Player detail modal
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  // Bid toast notifications
  const [bidToasts, setBidToasts] = useState<Array<{ id: number; teamName: string; amount: number; color: string }>>([]);
  const toastCounter = useRef(0);

  const bidSoundRef = useRef<HTMLAudioElement | null>(null);
  const soldSoundRef = useRef<HTMLAudioElement | null>(null);
  const timerSoundRef = useRef<HTMLAudioElement | null>(null);

  // Fetch Owner Team details for display
  const fetchOwnerTeam = async () => {
    if (!user?.teamId) return;
    try {
      const res = await api.get(`/api/teams`);
      const myTeam = res.data.find((t: any) => t._id === user.teamId);
      if (myTeam) setOwnerTeam(myTeam);
    } catch (err) {
      console.error("Failed to load owner team details:", err);
    }
  };

  // Keep a ref to fetchOwnerTeam so socket handlers (stale closures) always call the latest version
  const fetchOwnerTeamRef = useRef(fetchOwnerTeam);
  useEffect(() => {
    fetchOwnerTeamRef.current = fetchOwnerTeam;
  });

  useEffect(() => {
    if (isOwner) {
      fetchOwnerTeam();
    }
    // Re-fetch on any auction state change so budget + squad is always fresh
  }, [isOwner, user?.teamId, status, currentBid]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    // Always use the freshest token from localStorage (may have been refreshed by fetchMe)
    const token = localStorage.getItem("fc26_token");

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    // Socket Event Listeners
    newSocket.on("auction:state", (data: any) => {
      if (!data.currentPlayer && overlayActiveRef.current) {
        // Do not clear the current player immediately if an overlay is showing.
        // We will clear it when the overlay timeout finishes.
      } else {
        setCurrentPlayer(data.currentPlayer);
      }
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder);
      setTimer(data.timer);
      setStatus(data.status);
      setMinBidIncrement(data.minBidIncrement);
      setBidHistory(data.bidHistory || []);
      setErrorMsg(null);
      // When a new player is loaded, clear the last-sale recap so the stage shows the new player cleanly
      if (data.currentPlayer) {
        setLastSale(null);
      }
    });

    newSocket.on("bid:broadcast", (data) => {
      if (soundEnabledRef.current && bidSoundRef.current) {
        bidSoundRef.current.currentTime = 0;
        bidSoundRef.current.play().catch(() => {});
      }
      // Show bid toast to everyone
      const id = ++toastCounter.current;
      setBidToasts((prev) => [...prev, { id, teamName: data.teamName, amount: data.amount, color: data.color || "#3B82F6" }]);
      setTimeout(() => setBidToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
      // Use ref so stale closure always calls latest fetchOwnerTeam
      fetchOwnerTeamRef.current();
    });

    newSocket.on("bid:error", (data: { message: string }) => {
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(null), 3500);
    });

    newSocket.on("auction:error", (msg: string) => {
      toast.error(msg);
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3000);
    });

    newSocket.on("auction:sold_broadcast", (data: any) => {
      setSoldOverlay(data);
      if (soundEnabledRef.current && soldSoundRef.current) {
        soldSoundRef.current.play().catch(() => {});
      }
      // Fire confetti!
      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error("Confetti error", e);
      }

      // Save as last sale result (shown on idle stage after overlay closes)
      setLastSale({
        playerName: data.playerName,
        buyerName: data.buyerName,
        price: data.price,
        playerImage: data.playerImage,
        buyerColor: data.buyerColor,
      });

      toast.success(`${data.playerName} sold to ${data.buyerName} for ${data.price} coins!`, { duration: 6000, icon: '🎉' });

      // Refresh owner team budget + squad — first immediately, then again after DB settles
      fetchOwnerTeamRef.current();
      setTimeout(() => fetchOwnerTeamRef.current(), 1500);

      // Auto-close overlay after 6 seconds and clear stage
      setTimeout(() => {
        setSoldOverlay(null);
        setCurrentPlayer(null);
      }, 6000);
    });

    newSocket.on("auction:unsold_broadcast", (data) => {
      setUnsoldOverlay(data.playerName);
      toast(`${data.playerName} went unsold and returned to catalog.`, { duration: 6000, icon: '🔇' });
      // Clear unsold overlay after 3 seconds and clear stage
      setTimeout(() => {
        setUnsoldOverlay(null);
        setCurrentPlayer(null);
      }, 3000);
      fetchOwnerTeamRef.current();
    });

    newSocket.on("auction:undo_broadcast", (data) => {
      if (data.teamName && user?.role !== "admin") {
        toast.success(`Admin undid the draft for player: ${data.playerName}`);
      }
      fetchOwnerTeamRef.current();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);  // Empty deps: socket is created once and never torn down on state changes

  // Audio objects initialization
  useEffect(() => {
    // Standard system tones
    bidSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
    soldSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
    timerSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-84.wav");
  }, []);

  // Tick sound on low timer
  useEffect(() => {
    if (status === "bidding" && timer <= 5 && timer > 0 && soundEnabledRef.current && timerSoundRef.current) {
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.play().catch(() => {});
    }
  }, [timer, status]);

  // Actions: Owner Bids
  const placeBid = (amount: number) => {
    if (!socket) return;
    socket.emit("bid:place", { amount });
  };

  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bidAmount = parseInt(customBid);
    if (isNaN(bidAmount) || bidAmount <= 0) return;
    placeBid(bidAmount);
    setCustomBid("");
  };

  // Actions: Admin Controls
  const loadNextPlayer = () => {
    socket?.emit("admin:load_next");
  };

  const startAuction = () => {
    socket?.emit("admin:start");
  };

  const pauseAuction = () => {
    socket?.emit("admin:pause");
  };

  const resumeAuction = () => {
    socket?.emit("admin:resume");
  };

  const markUnsold = () => {
    if (confirm("Force this player to UNSOLD status?")) {
      socket?.emit("admin:unsold");
    }
  };

  const markSold = () => {
    if (confirm(`Force player sold to ${highestBidder?.teamName} for ${currentBid} coins?`)) {
      socket?.emit("admin:sold");
    }
  };

  const undoLastDraft = () => {
    if (confirm("Are you sure you want to UNDO the last completed draft? This will refund budget and release the player.")) {
      socket?.emit("admin:undo");
    }
  };

  const setAuctionTimer = () => {
    const val = parseInt(adminTimerInput);
    if (!isNaN(val) && val > 0) {
      socket?.emit("admin:set_timer", { duration: val });
    }
  };

  // Bid Button validations
  const basePrice = currentPlayer?.basePrice || 10;
  const minRequiredBid = highestBidder ? currentBid + minBidIncrement : basePrice;

  // Fixed preset increments: bid at currentBid + 5000, 10000, 15000, 20000
  const presets = [
    { label: "+5000",    value: currentBid + 5000 },
    { label: "+10000",   value: currentBid + 10000 },
    { label: "+15000",   value: currentBid + 15000 },
    { label: "+20000",   value: currentBid + 20000 },
  ];

  // Colors based on positions
  const posColor =
    currentPlayer?.positionGroup === "GK" ? "#F59E0B" :
    currentPlayer?.positionGroup === "DEF" ? "#3B82F6" :
    currentPlayer?.positionGroup === "MID" ? "#22C55E" : "#EF4444";

  // Check if owner is disabled from bidding
  const isHighestBidder = highestBidder?._id === ownerTeam?._id;
  const isBudgetInsufficient = (ownerTeam?.remainingBudget ?? Infinity) < minRequiredBid;
  const isSquadFull = (ownerTeam?.players?.length ?? 0) >= 22;
  const isBiddingClosed = status !== "bidding";
  // Only hard-block on things the backend also blocks: squad full, bidding closed, already highest bidder
  // Budget check is a SOFT warning only — backend validates the real budget on bid:place
  const isBidDisabled = isHighestBidder || isSquadFull || isBiddingClosed;

  // Fetch full player data from API and open detail modal
  const [detailLoading, setDetailLoading] = useState(false);

  const openPlayerDetail = async () => {
    if (!currentPlayer) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/players/${currentPlayer._id}`);
      setDetailPlayer(res.data);
    } catch (err) {
      // Fallback to socket data if API call fails
      console.error("Failed to fetch full player data:", err);
      setDetailPlayer({
        _id: currentPlayer._id,
        name: currentPlayer.name,
        commonName: currentPlayer.commonName,
        image: currentPlayer.image,
        nation: currentPlayer.nation,
        nationFlag: currentPlayer.nationFlag,
        club: currentPlayer.club,
        clubLogo: currentPlayer.clubLogo,
        league: currentPlayer.league,
        position: currentPlayer.position,
        positionGroup: currentPlayer.positionGroup as Player["positionGroup"],
        rating: currentPlayer.rating,
        basePrice: currentPlayer.basePrice,
        status: "pool",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
              <Tv2 className="text-accent-red" /> Live Auction Stage
            </h1>
            <p className="text-sm text-text-secondary">
              Live updates, real-time bids, and automated timers.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundEnabledRef.current = next;
              }}
              className="p-2 rounded-lg border border-border bg-surface hover:text-text-primary transition-all text-text-secondary"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Refresh Session — re-fetches JWT so newly assigned teamId/role takes effect */}
            {!isAdmin && (
              <button
                onClick={async () => {
                  await fetchMe();
                  window.location.reload();
                }}
                title="If you were recently assigned to a team, click to refresh your session"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary text-xs font-bold transition-all"
              >
                <RotateCcw size={13} /> Refresh Session
              </button>
            )}

            {/* Role Badge */}
            <span className="bg-accent-blue/10 text-accent-blue text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-accent-blue/20">
              Live: {user?.role}
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="rounded-xl border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-accent-red flex items-center gap-2.5"
            >
              <AlertTriangle size={16} />
              <span className="font-bold">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No team assigned warning for owners */}
        {isOwner && !user?.teamId && (
          <div className="rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-4 text-sm text-accent-amber flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} />
              <span className="font-bold">You are not assigned to a team yet. Ask your admin to assign you, then click Refresh Session.</span>
            </div>
            <button
              onClick={async () => { await fetchMe(); window.location.reload(); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-black text-xs font-bold transition-all"
            >
              <RotateCcw size={12} /> Refresh
            </button>
          </div>
        )}

        {/* Guest cannot bid notice */}
        {!isAdmin && !isOwner && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary flex items-center gap-2.5">
            <AlertTriangle size={16} />
            <span>You are logged in as <strong>guest</strong>. You can watch the auction but cannot place bids. Ask the admin to assign you as a team owner.</span>
          </div>
        )}

        {/* Main Stage Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: Active Player Card Showcase (xl:col-span-1) */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            <div className="border border-border bg-surface rounded-2xl p-5 flex flex-col items-center relative overflow-hidden">
              
              {/* Background Glow */}
              <div
                className="absolute inset-x-0 top-0 h-40 opacity-15 blur-[50px] transition-colors pointer-events-none"
                style={{ backgroundColor: currentPlayer ? posColor : "#A1A1A1" }}
              />

              <h3 className="w-full text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-3 mb-4">
                Active Draft Player
              </h3>

              {currentPlayer ? (
                /* ── Hover card — same pattern as PlayerCard ── */
                <motion.div
                  className="group relative flex w-full flex-col rounded-xl border overflow-hidden cursor-pointer select-none"
                  style={{
                    background: `linear-gradient(160deg, ${posColor}18 0%, #141414 60%)`,
                    borderColor: `${posColor}30`,
                    aspectRatio: "3/4",
                  }}
                  whileHover={{
                    scale: 1.03,
                    borderColor: posColor,
                    transition: { duration: 0.15, ease: "easeOut" },
                  }}
                  onClick={() => openPlayerDetail()}
                >
                  {/* Rating + Position */}
                  <div className="absolute top-3 left-3 flex flex-col items-center leading-none">
                    <span className="font-display text-2xl font-black text-text-primary">{currentPlayer.rating}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: posColor }}>
                      {currentPlayer.position}
                    </span>
                  </div>

                  {/* Live badge */}
                  <div className="absolute top-3 right-3">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-accent-red/10 text-accent-red border border-accent-red/30 animate-pulse">
                      LIVE
                    </span>
                  </div>

                  {/* Player Photo */}
                  <div className="flex flex-1 items-center justify-center pt-4">
                    <div
                      className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 overflow-hidden"
                      style={{ borderColor: `${posColor}60` }}
                    >
                      {currentPlayer.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            currentPlayer.image.startsWith("http")
                              ? `/api/image-proxy?url=${encodeURIComponent(currentPlayer.image)}`
                              : currentPlayer.image
                          }
                          alt={currentPlayer.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-2xl font-bold text-text-primary">
                          {(currentPlayer.commonName || currentPlayer.name).slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="px-3 pb-2 text-center">
                    <p className="truncate text-sm font-bold text-text-primary leading-tight">
                      {currentPlayer.commonName || currentPlayer.name}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5 truncate">
                      {currentPlayer.club} · {currentPlayer.league}
                    </p>
                  </div>

                  {/* Club + Nation + Base Price */}
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex h-6 w-6 items-center justify-center">
                      {currentPlayer.clubLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            currentPlayer.clubLogo.startsWith("http")
                              ? `/api/image-proxy?url=${encodeURIComponent(currentPlayer.clubLogo)}`
                              : currentPlayer.clubLogo
                          }
                          alt={currentPlayer.club}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-text-muted">{currentPlayer.club?.slice(0, 3)}</span>
                      )}
                    </div>

                    <span className="font-display text-xs font-black text-accent-amber flex items-center gap-0.5">
                      <Coins size={11} /> {currentPlayer.basePrice}
                    </span>

                    <div className="flex h-5 w-7 items-center justify-center">
                      {currentPlayer.nationFlag ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            currentPlayer.nationFlag.startsWith("http")
                              ? `/api/image-proxy?url=${encodeURIComponent(currentPlayer.nationFlag)}`
                              : currentPlayer.nationFlag
                          }
                          alt={currentPlayer.nation}
                          className="h-full w-full object-cover rounded-sm"
                        />
                      ) : (
                        <span className="text-[10px] text-text-muted">{currentPlayer.nation?.slice(0, 3)}</span>
                      )}
                    </div>
                  </div>

                  {/* Hover overlay — eye button (visible to everyone) */}
                  <motion.div
                    className="absolute inset-0 flex items-end justify-center gap-2 px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 40%, transparent)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); openPlayerDetail(); }}
                      title="View Details"
                      className="flex items-center gap-1.5 h-9 px-4 items-center justify-center rounded-full border border-border bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-bold transition-colors"
                    >
                      {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      {detailLoading ? "Loading..." : "View Details"}
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center w-full gap-4">
                  {lastSale ? (
                    /* Last sale recap shown when stage is idle */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full flex flex-col items-center gap-3"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 py-1 border border-border rounded-full bg-surface">
                        Last Sold
                      </span>

                      {lastSale.playerImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            lastSale.playerImage.startsWith("http")
                              ? `/api/image-proxy?url=${encodeURIComponent(lastSale.playerImage)}`
                              : lastSale.playerImage
                          }
                          alt={lastSale.playerName}
                          className="h-20 w-20 rounded-full border-2 border-accent-amber/40 object-cover shadow-xl"
                        />
                      )}

                      <div>
                        <p className="font-display text-base font-black text-text-primary">{lastSale.playerName}</p>
                        <p className="text-xs text-text-secondary mt-0.5">Drafted to</p>
                        <span
                          className="inline-block font-bold text-sm mt-1 px-3 py-0.5 rounded-full border uppercase"
                          style={{
                            color: lastSale.buyerColor || "#3B82F6",
                            borderColor: `${lastSale.buyerColor || "#3B82F6"}40`,
                            backgroundColor: `${lastSale.buyerColor || "#3B82F6"}15`,
                          }}
                        >
                          {lastSale.buyerName}
                        </span>
                      </div>

                      <div className="bg-background border border-border rounded-xl px-5 py-2.5 flex items-center gap-2">
                        <Coins size={14} className="text-accent-amber" />
                        <span className="font-display text-lg font-black text-accent-amber">{lastSale.price}</span>
                        <span className="text-xs text-text-muted">coins</span>
                      </div>

                      <p className="text-[10px] text-text-muted animate-pulse mt-1">
                        Waiting for admin to load next player…
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <span className="text-5xl animate-pulse">🏟️</span>
                      <h4 className="font-display text-base font-bold text-text-primary">Stage is Empty</h4>
                      <p className="text-xs text-text-secondary max-w-xs">
                        Admin needs to load the next player from the auction pool queue to start bidding.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Owner Stats panel (Only shown to owners to monitor budget) */}
            {isOwner && ownerTeam && (
              <div className="border border-border bg-surface rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                  My Team Summary
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ownerTeam.color }} />
                  <span className="text-sm font-bold text-text-primary truncate">{ownerTeam.teamName}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-background border border-border p-3 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-text-muted">My Budget</p>
                    <p className="text-base font-black text-accent-green mt-0.5">{ownerTeam.remainingBudget} coins</p>
                  </div>
                  <div className="bg-background border border-border p-3 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-text-muted">Squad Size</p>
                    <p className="text-base font-black text-accent-blue mt-0.5">{ownerTeam.players.length} / 22</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: Timer, Live Bidding Panel, Bidding Actions (xl:col-span-2) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Live Bidding Dashboard */}
            <div className="border border-border bg-surface rounded-2xl p-6 flex flex-col gap-6">
              
              {/* Countdown Timer Row */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">
                  Time Remaining
                </span>
                
                {/* Timer text */}
                <span className={`font-display text-6xl font-black tabular-nums transition-colors ${
                  status === "paused" ? "text-text-muted" :
                  timer <= 5 ? "text-accent-red animate-pulse" :
                  timer <= 15 ? "text-accent-amber" : "text-accent-green"
                }`}>
                  {timer}s
                </span>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-border mt-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{
                      width: `${(timer / 30) * 100}%`,
                      backgroundColor: timer <= 5 ? "#EF4444" : timer <= 15 ? "#F59E0B" : "#22C55E"
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Status and Bid Leader Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                
                {/* Current Bid */}
                <div className="bg-background border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Current Highest Bid
                  </span>
                  <span className="font-display text-4xl font-black text-accent-amber flex items-center gap-1.5">
                    <Coins size={30} className="text-accent-amber" /> {currentBid}
                  </span>
                </div>

                {/* Highest Bidder */}
                <div className="bg-background border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Current Leader
                  </span>
                  {highestBidder ? (
                    <div className="flex flex-col items-center">
                      <span
                        className="text-lg font-bold px-3 py-1 rounded border uppercase truncate max-w-full"
                        style={{
                          backgroundColor: `${highestBidder.color || "#3B82F6"}15`,
                          borderColor: `${highestBidder.color || "#3B82F6"}50`,
                          color: highestBidder.color || "#3B82F6",
                        }}
                      >
                        {highestBidder.teamName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-text-muted py-1">No bids placed yet</span>
                  )}
                </div>

              </div>

              {/* Owner Bidding Console Panel */}
              {isOwner && currentPlayer && (
                <div className="border-t border-border pt-6 flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Place Bid
                  </h3>

                  {/* Warning Banner */}
                  {isHighestBidder && (
                    <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-3 text-xs text-accent-green flex items-center gap-2">
                      <Award size={14} /> You are currently holding the winning bid!
                    </div>
                  )}
                  {isBudgetInsufficient && !isHighestBidder && (
                    <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-3 text-xs text-accent-amber flex items-center gap-2">
                      <AlertTriangle size={14} /> Low budget ({ownerTeam?.remainingBudget ?? 0} coins). You can still try — the server will validate.
                    </div>
                  )}

                  {/* Preset bid buttons: Min / +50 / +100 / +200 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {presets.map((p) => {
                      const canAfford = !ownerTeam || ownerTeam.remainingBudget >= p.value;
                      const isDisabled = isBidDisabled;
                      return (
                        <button
                          key={p.label}
                          disabled={isDisabled}
                          onClick={() => placeBid(p.value)}
                          className={`flex flex-col items-center justify-center rounded-xl border py-3.5 transition-all group ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed border-border bg-background"
                              : canAfford
                              ? "border-border bg-background hover:border-accent-amber hover:bg-accent-amber/5 cursor-pointer"
                              : "border-accent-red/30 bg-accent-red/5 cursor-pointer opacity-70"
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            !canAfford ? "text-accent-red" : "text-text-muted group-hover:text-accent-amber"
                          }`}>
                            {p.label}
                          </span>
                          <span className="font-display text-xl font-black text-text-primary mt-0.5 flex items-center gap-0.5">
                            <Coins size={13} className={canAfford ? "text-accent-amber" : "text-accent-red"} />
                            {p.value}
                          </span>
                          {!canAfford && (
                            <span className="text-[9px] text-accent-red mt-0.5">Low budget</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Bid input */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                      Custom Bid Amount
                    </p>
                    <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                        <Coins size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-amber" />
                        <input
                          type="number"
                          min={minRequiredBid}
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          disabled={isBidDisabled}
                          placeholder={`Min: ${minRequiredBid} coins`}
                          className="w-full bg-background border border-border text-text-primary text-sm rounded-xl pl-9 pr-4 py-3.5 outline-none focus:border-accent-amber disabled:opacity-50 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isBidDisabled || !customBid}
                        className="bg-accent-amber hover:bg-accent-amber/80 text-black font-black px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                      >
                        Bid
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Admin Dashboard Panel */}
              {isAdmin && (
                <div className="border-t border-border pt-6 flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Admin Controls
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Load Next */}
                    <button
                      disabled={status === "bidding" || status === "paused"}
                      onClick={loadNextPlayer}
                      className="flex items-center justify-center gap-2 border border-border bg-background hover:border-text-secondary py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <ArrowRight size={14} /> Load Next Player
                    </button>

                    {/* Start */}
                    <button
                      disabled={!currentPlayer || status === "bidding"}
                      onClick={startAuction}
                      className="flex items-center justify-center gap-2 border border-accent-green/30 bg-accent-green/5 text-accent-green hover:bg-accent-green hover:text-black py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <Play size={14} /> Start Bidding
                    </button>

                    {/* Pause / Resume */}
                    {status === "paused" ? (
                      <button
                        onClick={resumeAuction}
                        className="flex items-center justify-center gap-2 border border-accent-blue/30 bg-accent-blue/5 text-accent-blue hover:bg-accent-blue hover:text-white py-3 rounded-xl text-xs font-bold transition-all"
                      >
                        <Play size={14} /> Resume Timer
                      </button>
                    ) : (
                      <button
                        disabled={status !== "bidding"}
                        onClick={pauseAuction}
                        className="flex items-center justify-center gap-2 border border-accent-amber/30 bg-accent-amber/5 text-accent-amber hover:bg-accent-amber hover:text-black py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                      >
                        <Pause size={14} /> Pause Timer
                      </button>
                    )}

                    {/* Unsold */}
                    <button
                      disabled={!currentPlayer}
                      onClick={markUnsold}
                      className="flex items-center justify-center gap-2 border border-text-muted/30 bg-surface-elevated text-text-secondary hover:text-text-primary py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      Mark Unsold
                    </button>

                    {/* Sold */}
                    <button
                      disabled={!currentPlayer || !highestBidder}
                      onClick={markSold}
                      className="flex items-center justify-center gap-2 border border-accent-red/30 bg-accent-red/5 text-accent-red hover:bg-accent-red hover:text-white py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      Mark Sold
                    </button>

                    {/* Undo Draft */}
                    <button
                      onClick={undoLastDraft}
                      className="flex items-center justify-center gap-2 border border-border bg-background hover:bg-surface-elevated py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <RotateCcw size={14} /> Undo Last Draft
                    </button>
                  </div>

                  {/* Timer Control */}
                  <div className="flex items-center gap-2 mt-2 pt-4 border-t border-border">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary w-24">Set Timer (s)</span>
                    <input 
                      type="number" 
                      value={adminTimerInput} 
                      onChange={(e) => setAdminTimerInput(e.target.value)} 
                      className="bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent-blue outline-none w-24 text-center text-sm"
                    />
                    <button 
                      onClick={setAuctionTimer}
                      className="bg-surface-elevated hover:bg-border text-text-primary px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-border"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Live Bid History Feed */}
            <div className="border border-border bg-surface rounded-2xl p-5 flex-1 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-3 mb-4 flex items-center justify-between">
                <span>Live Bid Feed</span>
                <span className="flex items-center gap-1.5 text-accent-blue text-[10px]">
                  <TrendingUp size={11} /> Real-time active
                </span>
              </h3>

              {bidHistory.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-text-secondary">
                  No bids have been logged for this player yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {bidHistory.map((bid, index) => (
                      <motion.div
                        key={bid.timestamp.toString() + index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bid.color }} />
                          <span className="text-xs font-bold text-text-primary truncate">{bid.teamName}</span>
                        </div>
                        <span className="font-display text-sm font-black text-accent-amber flex items-center gap-0.5">
                          <Coins size={12} /> {bid.amount}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* SOLD OVERLAY — centered card, not full-screen black */}
      <AnimatePresence>
        {soldOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface shadow-2xl flex flex-col items-center text-center p-8"
            >
              <span className="text-5xl mb-4">🎉</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-3 py-1 border border-border rounded-full bg-surface-elevated inline-block mb-5">
                Player Sold
              </span>
              <h2 className="font-display text-2xl font-black text-text-primary">{soldOverlay.playerName}</h2>
              <p className="text-sm text-text-secondary mt-3 max-w-xs">
                Sold to {soldOverlay.buyerName} for {soldOverlay.price} coins. Player added to the squad.
              </p>
              <p className="text-xs text-text-muted mt-5 animate-pulse">Stage clearing…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNSOLD OVERLAY — centered card */}
      <AnimatePresence>
        {unsoldOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface shadow-2xl flex flex-col items-center text-center p-8"
            >
              <span className="text-5xl mb-4">🔇</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-3 py-1 border border-border rounded-full bg-surface-elevated inline-block mb-5">
                No Bids — Passed
              </span>
              <h2 className="font-display text-2xl font-black text-text-primary">{unsoldOverlay}</h2>
              <p className="text-sm text-text-secondary mt-3 max-w-xs">
                No bids were placed. Player returned to the catalog.
              </p>
              <p className="text-xs text-text-muted mt-5 animate-pulse">Stage clearing…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Detail Modal */}
      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          onClose={() => setDetailPlayer(null)}
        />
      )}

      {/* BID TOAST STACK — bottom-right, visible to everyone */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {bidToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-sm"
              style={{
                backgroundColor: `${toast.color}18`,
                borderColor: `${toast.color}50`,
              }}
            >
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: toast.color }} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                  {toast.teamName}
                </span>
                <span className="text-[10px] text-text-secondary">placed a bid</span>
              </div>
              <span
                className="font-display text-lg font-black flex items-center gap-0.5 ml-2"
                style={{ color: toast.color }}
              >
                <Coins size={14} /> {toast.amount}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </AuthenticatedLayout>
  );
}
