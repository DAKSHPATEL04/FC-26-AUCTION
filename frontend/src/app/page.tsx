import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ThreeScene from "@/components/landing/ThreeScene";
import ParallaxFeatures from "@/components/landing/ParallaxFeatures";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-[#111111] min-h-screen text-white overflow-hidden selection:bg-[#10E36C] selection:text-black">
      <Navbar />
      
      {/* Hero Section with 3D Background */}
      <div className="relative">
        <ThreeScene />
        <HeroSection />
      </div>

      <ParallaxFeatures />
      <Footer />
    </main>
  );
}
