import Header from "@/components/header";
import Hero from "@/components/hero";
import About from "@/components/about";
import Services from "@/components/services";
import Stats from "@/components/stats";
import Process from "@/components/process";
import AuditForm from "@/components/audit-form";
import Testimonials from "@/components/testimonials";
import NewsletterCTA from "@/components/newsletter-cta";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div >
      <Header />
      <Hero />
      <About />
      <Services />
      <Stats />
      <Process />
      <AuditForm />
      <Testimonials />
      <NewsletterCTA />
      <Contact />
      <Footer />
    </div>
  );
}
