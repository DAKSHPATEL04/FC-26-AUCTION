"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#10E36C] rounded-sm flex items-center justify-center transform rotate-45">
            <span className="text-black font-black text-xs transform -rotate-45 block">FC</span>
          </div>
          <span className="text-white font-black text-xl tracking-widest uppercase">
            FC26 Auction
          </span>
        </Link>
        <div className="hidden md:flex gap-8 items-center text-sm font-bold uppercase tracking-widest text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link
            href="/login"
            className="text-[#10E36C] border border-[#10E36C] px-6 py-2 hover:bg-[#10E36C] hover:text-black transition-all"
          >
            Enter Auction
          </Link>
        </div>
      </div>
    </nav>
  );
}
