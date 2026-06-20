"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";

interface Frame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const videoUrls = [
  "/video/trailer.mp4",
  "/video/vidssave.com Nike Football_ The Last Game full edition 1080p.mp4"
];

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  // Video Frame Logic
  const [frames, setFrames] = useState<Frame[]>([
    { id: '1', x: 100, y: 100, width: 300, height: 200 },
    { id: '2', x: 450, y: 150, width: 250, height: 300 },
    { id: '3', x: 200, y: 350, width: 350, height: 200 },
    { id: '4', x: 600, y: 120, width: 200, height: 150 },
    { id: '5', x: 50, y: 500, width: 280, height: 180 },
    { id: '6', x: 768, y: 243, width: 620, height: 420 },
    { id: '7', x: 248, y: 100, width: 620, height: 420 },
  ]); const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [revealVideo, setRevealVideo] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Audio Logic
  const [isMuted, setIsMuted] = useState(true); // Start muted so it autoplays silently
  const [hasUnmutedOnce, setHasUnmutedOnce] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // If this is the very first time the user is unmuting, restart the audio from the beginning
    if (!nextMuted && !hasUnmutedOnce && audioRef.current) {
      audioRef.current.currentTime = 0;
      setHasUnmutedOnce(true);
    }
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videoUrls.length);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro animation
      gsap.fromTo(
        [titleRef.current, subtitleRef.current, btnRef.current],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.5 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const frame = frames.find(f => f.id === id);
    if (frame) {
      setDraggingId(id);
      setDragOffset({
        x: e.clientX - frame.x,
        y: e.clientY - frame.y,
      });
    }
  };

  const toggleReveal = () => {
    setRevealVideo(!revealVideo);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingId && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left - dragOffset.x;
        const y = e.clientY - containerRect.top - dragOffset.y;

        setFrames(prev =>
          prev.map(frame =>
            frame.id === draggingId
              ? {
                ...frame,
                x: Math.max(0, Math.min(x, containerRect.width - frame.width)),
                // Allow dragging down to the very bottom, and up to just below the navbar (80px)
                y: Math.max(80, Math.min(y, Math.max(80, containerRect.height - frame.height))),
              }
              : frame
          )
        );
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingId, dragOffset]);

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Intersection Observer to mute audio when scrolled out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 } // Mute when less than 5% is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Auto-play audio when it becomes visible again
  useEffect(() => {
    if (isVisible && !isMuted && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Autoplay prevented by browser policy:', e));
    }
  }, [isVisible, isMuted]);

  return (
    <div className="relative w-full">
      {/* Continuous Background overlay to ensure text readability across both sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/40 to-[#111111] z-0 pointer-events-none" />

      {/* First Section: Video Frames Showcase */}
      <section
        id="video-frames"
        ref={containerRef}
        className="relative z-10 min-h-screen w-full bg-transparent overflow-hidden"
      >
        {/* Background Audio */}
        <audio 
          ref={audioRef}
          src="/music/BIA - WE ON GO (Official Audio).mp3"
          autoPlay
          loop
          muted={isMuted || !isVisible}
        />

        {/* Mute Toggle Button */}
        <div className="absolute top-32 left-8 z-30 pointer-events-auto">
          <button
            onClick={toggleMute}
            className="bg-black/50 text-[#10E36C] p-3 rounded-full hover:bg-black hover:scale-110 transition-all duration-300 shadow-lg border border-[#10E36C]/30 backdrop-blur-sm cursor-pointer flex items-center justify-center"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        {/* SVG Clip Path Definition for perfectly synced video frames */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <clipPath id="video-frames-clip">
              {frames.map(frame => (
                <rect
                  key={`clip-${frame.id}`}
                  x={frame.x}
                  y={frame.y}
                  width={frame.width}
                  height={frame.height}
                />
              ))}
            </clipPath>
          </defs>
        </svg>

        {/* Reveal mask - shows the single video content clipped to the frame positions */}
        {revealVideo && containerSize.width > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ clipPath: 'url(#video-frames-clip)' }}
          >
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              src={videoUrls[currentVideoIndex]}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Draggable frames (borders) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {frames.map(frame => (
            <div
              key={frame.id}
              className={`absolute border-2 border-[#10E36C]/50 hover:border-[#10E36C] pointer-events-auto group transition-colors duration-300 ${draggingId === frame.id ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              style={{
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
              }}
              onMouseDown={e => handleMouseDown(e, frame.id)}
            >
              <div className="absolute inset-0 bg-[#10E36C]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Added for testing purpose: Display x, y and ID */}
              {/* <div className="absolute top-2 left-2 text-[#10E36C] font-mono text-xs bg-black/50 px-2 py-1 rounded pointer-events-none">
                ID: {frame.id} | x: {Math.round(frame.x)}, y: {Math.round(frame.y)}
              </div> */}
            </div>
          ))}
        </div>

        {/* Next Video Button */}
        <div className="absolute top-32 right-8 z-30 pointer-events-auto">
          <button
            onClick={handleNextVideo}
            className="bg-[#10E36C] text-black px-6 py-3 cursor-pointer text-xs font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 shadow-lg"
          >
            Next
          </button>
        </div>
      </section>

      {/* Second Section: Hero Text Content */}
      <section
        id="hero-text"
        ref={heroRef}
        className="relative z-10 min-h-screen flex items-center justify-center pt-20 overflow-hidden"
      >
        <div className="container mx-auto px-6 md:px-12 relative z-20 text-center">
          <p
            ref={subtitleRef}
            className="text-[#10E36C] font-bold tracking-[0.3em] uppercase text-sm mb-6"
          >
            The Ultimate Manager Experience
          </p>

          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-8 drop-shadow-2xl"
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Season 2026
            </span>
            <span className="block mt-2">Auction</span>
          </h1>

          <div ref={btnRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              href="/register"
              className="bg-[#10E36C] text-black px-10 py-5 text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
            >
              Create Franchise
            </Link>
            <Link
              href="#video-frames"
              className="text-white px-10 py-5 text-sm font-bold uppercase tracking-widest border border-white/20 hover:border-white transition-all duration-300 w-full sm:w-auto bg-black/50 backdrop-blur-sm"
            >
              Explore Video Frames
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
