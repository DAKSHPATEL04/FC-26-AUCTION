"use client";

import { useEffect, useState, useRef } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
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
} from "lucide-react";

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
  const { user } = useUserStore();
  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "owner";

  const [socket, setSocket] = useState<Socket | null>(null);

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
  const [soldOverlay, setSoldOverlay] = useState<{
    playerName: string;
    buyerName: string;
    price: number;
    playerImage?: string;
  } | null>(null);
  const [unsoldOverlay, setUnsoldOverlay] = useState<string | null>(null);
  
  // Custom Bid Input
  const [customBid, setCustomBid] = useState("");

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

  useEffect(() => {
    if (isOwner) {
      fetchOwnerTeam();
    }
  }, [isOwner, user?.teamId, currentBid]); // Refresh when bids update

  // Initialize Socket.IO connection
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = localStorage.getItem("fc26_token");

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    // Socket Event Listeners
    newSocket.on("auction:state", (data) => {
      setCurrentPlayer(data.currentPlayer);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder);
      setTimer(data.timer);
      setStatus(data.status);
      setMinBidIncrement(data.minBidIncrement);
      setBidHistory(data.bidHistory || []);
      setErrorMsg(null);
    });

    newSocket.on("bid:broadcast", (data) => {
      if (soundEnabled && bidSoundRef.current) {
        bidSoundRef.current.currentTime = 0;
        bidSoundRef.current.play().catch(() => {});
      }
      // Re-fetch owner team stats if a bid goes through to sync budget
      if (isOwner) fetchOwnerTeam();
    });

    newSocket.on("bid:error", (data: { message: string }) => {
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(null), 3500);
    });

    newSocket.on("auction:sold_broadcast", (data) => {
      setSoldOverlay(data);
      if (soundEnabled && soldSoundRef.current) {
        soldSoundRef.current.play().catch(() => {});
      }
      // Fire confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      // Refresh owner statistics
      if (isOwner) fetchOwnerTeam();

      setTimeout(() => setSoldOverlay(null), 5000);
    });

    newSocket.on("auction:unsold_broadcast", (data) => {
      setUnsoldOverlay(data.playerName);
      setTimeout(() => setUnsoldOverlay(null), 3000);
      if (isOwner) fetchOwnerTeam();
    });

    newSocket.on("auction:undo_broadcast", (data) => {
      alert(`Admin undid the draft for player: ${data.playerName}`);
      if (isOwner) fetchOwnerTeam();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [soundEnabled, isOwner]);

  // Audio objects initialization
  useEffect(() => {
    // Standard system tones
    bidSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
    soldSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
    timerSoundRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-84.wav");
  }, []);

  // Tick sound on low timer
  useEffect(() => {
    if (status === "bidding" && timer <= 5 && timer > 0 && soundEnabled && timerSoundRef.current) {
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.play().catch(() => {});
    }
  }, [timer, status, soundEnabled]);

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

  // Bid Button validations
  const basePrice = currentPlayer?.basePrice || 10;
  const minRequiredBid = highestBidder ? currentBid + minBidIncrement : basePrice;

  // Preset Bid buttons (e.g. min, +10, +50, +100)
  const presets = [
    { label: `${minRequiredBid}`, value: minRequiredBid },
    { label: `+${minBidIncrement}`, value: minRequiredBid + minBidIncrement },
    { label: `+50`, value: minRequiredBid + 50 },
    { label: `+100`, value: minRequiredBid + 100 },
  ];

  // Colors based on positions
  const posColor =
    currentPlayer?.positionGroup === "GK" ? "#F59E0B" :
    currentPlayer?.positionGroup === "DEF" ? "#3B82F6" :
    currentPlayer?.positionGroup === "MID" ? "#22C55E" : "#EF4444";

  // Check if owner is disabled from bidding
  const isHighestBidder = highestBidder?._id === ownerTeam?._id;
  const isBudgetInsufficient = (ownerTeam?.remainingBudget ?? 0) < minRequiredBid;
  const isSquadFull = (ownerTeam?.players?.length ?? 0) >= 15;
  const isBiddingClosed = status !== "bidding";
  const isBidDisabled = isHighestBidder || isBudgetInsufficient || isSquadFull || isBiddingClosed;

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
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-border bg-surface hover:text-text-primary transition-all text-text-secondary"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

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
                <div className="flex flex-col items-center text-center w-full">
                  
                  {/* Rating + Position badge */}
                  <div className="flex gap-2 items-center mb-4">
                    <span className="font-display text-3xl font-black text-text-primary">
                      {currentPlayer.rating}
                    </span>
                    <span
                      className="text-xs font-extrabold uppercase px-2.5 py-1 rounded border"
                      style={{ color: posColor, borderColor: `${posColor}40`, backgroundColor: `${posColor}10` }}
                    >
                      {currentPlayer.position}
                    </span>
                  </div>

                  {/* Player Image */}
                  <div
                    className="h-32 w-32 rounded-full border-4 overflow-hidden shadow-2xl flex items-center justify-center bg-background"
                    style={{ borderColor: `${posColor}80` }}
                  >
                    {currentPlayer.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentPlayer.image} alt={currentPlayer.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-4xl font-bold text-text-primary">
                        {currentPlayer.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h2 className="font-display text-xl font-bold text-text-primary mt-4 truncate max-w-full">
                    {currentPlayer.commonName || currentPlayer.name}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    {currentPlayer.club} | {currentPlayer.league}
                  </p>

                  {/* Club & Flag Flags */}
                  <div className="flex items-center gap-4 mt-3">
                    {currentPlayer.clubLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentPlayer.clubLogo} alt={currentPlayer.club} className="h-6 w-6 object-contain" />
                    )}
                    {currentPlayer.nationFlag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentPlayer.nationFlag} alt={currentPlayer.nation} className="h-4 w-6 object-cover rounded-sm" />
                    )}
                  </div>

                  {/* Base price */}
                  <div className="mt-5 bg-background border border-border px-4 py-2 rounded-xl text-center w-full flex items-center justify-between">
                    <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Base Price</span>
                    <span className="font-display text-sm font-black text-accent-amber flex items-center gap-1">
                      <Coins size={14} /> {currentPlayer.basePrice} coins
                    </span>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-5xl animate-pulse">🏟️</span>
                  <h4 className="mt-4 font-display text-base font-bold text-text-primary">Stage is Empty</h4>
                  <p className="text-xs text-text-secondary mt-1 max-w-xs">
                    Admin needs to load the next player from the auction pool queue to start bidding.
                  </p>
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
                    <p className="text-base font-black text-accent-blue mt-0.5">{ownerTeam.players.length} / 15</p>
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
                  {isBudgetInsufficient && (
                    <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-3 text-xs text-accent-red flex items-center gap-2">
                      <AlertTriangle size={14} /> You do not have enough coins to bid on this player.
                    </div>
                  )}

                  {/* Preset increments 2x2 grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {presets.map((p) => {
                      const isDisabled = isBidDisabled || (ownerTeam ? ownerTeam.remainingBudget < p.value : false);
                      return (
                        <button
                          key={p.value}
                          disabled={isDisabled}
                          onClick={() => placeBid(p.value)}
                          className="flex flex-col items-center justify-center rounded-xl border border-border bg-background py-3.5 hover:border-accent-blue transition-all disabled:opacity-40 disabled:hover:border-border disabled:cursor-not-allowed group"
                        >
                          <span className="text-[10px] text-text-secondary group-hover:text-text-primary transition-colors">
                            {p.label.startsWith("+") ? `Inc ${p.label}` : "Bid Min"}
                          </span>
                          <span className="font-display text-lg font-black text-text-primary mt-1">
                            {p.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Bid input field */}
                  <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                    <input
                      type="number"
                      min={minRequiredBid}
                      value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      disabled={isBidDisabled}
                      placeholder={`Enter custom bid (Min: ${minRequiredBid})...`}
                      className="flex-1 bg-background border border-border text-text-primary text-sm rounded-xl px-4 py-3.5 outline-none focus:border-accent-blue disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isBidDisabled || !customBid}
                      className="bg-accent-blue hover:bg-accent-blue/80 text-white font-bold px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-accent-blue"
                    >
                      Bid
                    </button>
                  </form>
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

      {/* SOLD CONFETTI SCREEN OVERLAY */}
      <AnimatePresence>
        {soldOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="max-w-md w-full flex flex-col items-center"
            >
              <span className="text-6xl mb-6">🎉</span>
              
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-accent-amber px-4 py-1.5 border border-accent-amber/30 rounded-full bg-accent-amber/10 mb-4 flex items-center gap-1.5">
                <Sparkles size={14} /> Sold!
              </h2>

              <h1 className="font-display text-3xl font-black text-text-primary leading-tight max-w-full truncate px-3">
                {soldOverlay.playerName}
              </h1>

              {/* Player Image if available */}
              {soldOverlay.playerImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={soldOverlay.playerImage}
                  alt={soldOverlay.playerName}
                  className="h-28 w-28 rounded-full border-4 border-accent-amber/50 object-cover mt-6 shadow-2xl bg-surface"
                />
              )}

              <p className="text-base text-text-secondary mt-6 max-w-xs">
                Drafted to <span className="font-bold text-text-primary text-lg block mt-1 uppercase text-accent-blue">{soldOverlay.buyerName}</span>
              </p>

              <div className="bg-surface border border-border rounded-2xl px-6 py-4 mt-6 flex flex-col items-center shadow-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Draft Price</span>
                <span className="font-display text-3xl font-black text-accent-amber mt-1 flex items-center gap-1.5">
                  <Coins size={24} /> {soldOverlay.price} coins
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNSOLD SCREEN OVERLAY */}
      <AnimatePresence>
        {unsoldOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-md w-full"
            >
              <span className="text-6xl mb-6">🔇</span>
              <h2 className="font-display text-xs font-black uppercase tracking-widest text-text-secondary px-4 py-1.5 border border-border rounded-full bg-surface mb-4 inline-block">
                Passed / Unsold
              </h2>
              <h1 className="font-display text-3xl font-black text-text-primary mt-4">
                {unsoldOverlay}
              </h1>
              <p className="text-sm text-text-secondary mt-4">
                No bids were placed on this player. Player returned to catalog.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AuthenticatedLayout>
  );
}
