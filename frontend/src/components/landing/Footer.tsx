"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#050505] pt-32 pb-12 border-t border-gray-900">
      <div ref={contentRef} className="container mx-auto px-6 md:px-12 text-center">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6">
          Ready to build your <span className="text-[#10E36C]">dream squad?</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-12 font-medium">
          Join the elite manager auction today. Prove your football knowledge and assemble a team capable of dominating the season.
        </p>
        
        {/* The final Call to Action button as requested */}
        <div className="flex justify-center mb-24">
          <Link 
            href="/login" 
            className="group relative inline-flex items-center justify-center px-12 py-6 font-black text-black uppercase tracking-widest bg-[#10E36C] overflow-hidden transition-all duration-300 hover:scale-105"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
            <span className="relative">Enter Live Auction</span>
            <svg 
              className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </Link>
        </div>

        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#10E36C] rounded-sm flex items-center justify-center transform rotate-45">
              <span className="text-black font-black text-[10px] transform -rotate-45 block">FC</span>
            </div>
            <span className="text-gray-500 font-bold text-sm tracking-widest uppercase">
              FC26 Auction
            </span>
          </div>
          
          <div className="text-gray-600 text-xs font-semibold tracking-wider">
            &copy; {new Date().getFullYear()} EA FC 26 Friends League. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
