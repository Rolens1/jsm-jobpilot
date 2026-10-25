import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { Features } from "@/components/homepage/Features";
import { Testimonial } from "@/components/homepage/Testimonial";
import { BottomCta } from "@/components/homepage/BottomCta";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col gap-6 sm:gap-10 pb-16">
        <Hero />
        <Features />
        <Testimonial />
        <BottomCta />
      </main>
      <Footer />
    </div>
  );
}