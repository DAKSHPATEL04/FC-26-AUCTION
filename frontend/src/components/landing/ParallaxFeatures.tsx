"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    title: "Live Bidding Engine",
    desc: "Experience real-time bidding wars. Outsmart your friends with lightning-fast socket connections.",
    num: "01",
  },
  {
    title: "Dynamic Player Pricing",
    desc: "Player base values adjust based on real-world performance metrics and current market trends.",
    num: "02",
  },
  {
    title: "Squad Management",
    desc: "Build your ultimate team. Track budget, squad roles, and player chemistry in one dashboard.",
    num: "03",
  },
];

export default function ParallaxFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { y: 100, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 80%", // Start animation when top of card hits 80% of viewport
                end: "bottom 20%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={containerRef} className="py-32 bg-[#0a0a0a] relative z-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-20 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
            Next-Gen <span className="text-[#10E36C]">Features</span>
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm max-w-xl">
            Everything you need to host the ultimate EA FC 26 Friends Auction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className="bg-[#111111] border border-gray-800 p-10 hover:border-[#10E36C] transition-colors duration-500 group relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10E36C]/5 rounded-bl-full transition-transform duration-500 group-hover:scale-150" />
              
              <div className="text-6xl font-black text-gray-800 mb-6 group-hover:text-[#10E36C]/20 transition-colors duration-500">
                {feature.num}
              </div>
              <h3 className="text-2xl font-black uppercase text-white mb-4 group-hover:text-[#10E36C] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
