"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

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

  return (
    <section 
      ref={heroRef} 
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* Background overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/40 to-[#111111] z-10 pointer-events-none" />

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
            href="#features" 
            className="text-white px-10 py-5 text-sm font-bold uppercase tracking-widest border border-white/20 hover:border-white transition-all duration-300 w-full sm:w-auto"
          >
            Explore Features
          </Link>
        </div>
      </div>
    </section>
  );
}
