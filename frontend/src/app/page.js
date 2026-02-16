import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ExamplesGallery from "@/components/ExamplesGallery";
import About from "@/components/About";
import Creators from "@/components/Creators";
import Pricing from "@/components/Pricing";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import Video from "@/components/Video";



export default function Home() {
  return (
    <main id="main" className="relative min-h-screen overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      <Video />

      {/* Example Outputs / Gallery */}
      <div id="examples">
        <ExamplesGallery />
      </div>

      {/* About */}
      <div id="about">
        <About />
      </div>

      {/* Built for Creators */}
      <div id="creators">
        <Creators />
      </div>

      {/* Pricing Plans */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* Call to Action */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </main>
  );
}
