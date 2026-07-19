import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  motion,
  useAnimation,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  Droplets,
  Shield,
  Brain,
  MessageSquare,
  Activity,
  Users,
  Heart,
  Star,
  Zap,
  Lock,
  ChevronRight,
  Check,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// --------------------- Animation Variants ---------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

// --------------------- Floating Blood Drops ---------------------
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 24 + 12}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          <Droplets />
        </motion.div>
      ))}
    </div>
  );
}

// --------------------- Animated Counter ---------------------
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}+</span>;
}

// --------------------- Section Wrapper with Scroll Trigger ---------------------
function SectionWrapper({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  return (
    <motion.section
      id={id}
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={controls}
      className={cn("py-20 md:py-28 relative", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </motion.section>
  );
}

// --------------------- 3D Tilt Card ---------------------
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("cursor-pointer", className)}
    >
      <motion.div style={{ transform: "translateZ(20px)" }}>{children}</motion.div>
    </motion.div>
  );
}

// --------------------- Main Component ---------------------
export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="overflow-hidden">
      <HeroSection />
      <AboutSection />
      <ProblemSection />
      <FeaturesSection />
      <PrivacySection />
      <AIMatchingSection />
      <RAGSection />
      <WorkflowSection />
      <ArchitectureSection />
      <BenefitsSection />
      <ComparisonSection />
      <TeamSection />
      <FAQSection />
      <ContactSection />
      <CTASection />
    </div>
  );
}

// --------------------- Hero Section ---------------------
function HeroSection() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/20">
      <FloatingParticles />
      <motion.div
        style={{ y: y1 }}
        className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
          >
            <Zap className="h-4 w-4" />
            AI-Powered & Privacy-First
          </motion.div>

          <h1 className="text-4xl font-extrabold tracking-tight text-dark sm:text-5xl lg:text-6xl">
            Save Lives with{" "}
            <span className="bg-gradient-to-r from-primary to-red-700 bg-clip-text text-transparent animate-pulse">
              Anonymous
            </span>{" "}
            Blood Donation
          </h1>

          <p className="mt-6 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
            AnonBlood connects donors and hospitals through privacy-preserving AI, 
            ensuring secure, efficient, and intelligent blood matching without 
            compromising personal identity.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-primary hover:bg-primary-600 text-lg px-8 py-6 shadow-lg shadow-primary/25">
                  Become a Donor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Hospital Login
                </Button>
              </motion.div>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-primary" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-4 w-4 text-primary" />
              End-to-End Encrypted
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <AnimatedCounter end={10000} /> Donors
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// --------------------- About Section (NEW) ---------------------
function AboutSection() {
  return (
    <SectionWrapper id="about" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
          <Droplets className="h-4 w-4" /> About the Platform
        </div>
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">
          AnonBlood: Privacy-Preserving Blood Donation
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          AnonBlood is a capstone project that combines artificial intelligence,
          strong cryptography, and user-centric design to create a safe, efficient,
          and anonymous blood donation ecosystem. We bridge the gap between
          hospitals in need and willing donors, all while protecting your identity.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-dark flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Our Mission
          </h3>
          <p className="mt-2 text-gray-600">
            To save lives by making blood donation accessible, secure, and completely
            anonymous for donors while providing hospitals with real-time, intelligent
            matching capabilities.
          </p>
        </motion.div>
        <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-dark flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Our Vision
          </h3>
          <p className="mt-2 text-gray-600">
            A world where no one dies due to lack of blood, and every donor can
            contribute without fear of privacy invasion or data misuse.
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

// --------------------- Problem Section ---------------------
function ProblemSection() {
  return (
    <SectionWrapper id="problem" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">The Challenge</h2>
        <p className="mt-4 text-lg text-gray-600">
          Current blood donation systems suffer from identity exposure, manual
          matching delays, and lack of intelligent donor-hospital coordination.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Shield, title: "Privacy Risks", desc: "Personal data exposed during donor registration and requests" },
          { icon: Activity, title: "Inefficient Matching", desc: "Manual processes cause delays and mismatches" },
          { icon: MessageSquare, title: "Poor Communication", desc: "Lack of secure, anonymous channel between donors and hospitals" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <TiltCard key={i}>
              <motion.div variants={fadeInUp} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-dark">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.desc}</p>
              </motion.div>
            </TiltCard>
          );
        })}
      </div>
    </SectionWrapper>
  );
}

// --------------------- Features Section ---------------------
function FeaturesSection() {
  const features = [
    { icon: Droplets, title: "Real-time Blood Matching", desc: "AI instantly matches donors to hospital needs based on blood type, location, and availability." },
    { icon: Shield, title: "Zero-Knowledge Privacy", desc: "Donor identities remain hidden using cryptographic protocols and anonymous IDs." },
    { icon: Brain, title: "Intelligent RAG Assistant", desc: "Retrieval-Augmented Generation answers medical queries with verified knowledge." },
    { icon: MessageSquare, title: "Secure Messaging", desc: "End-to-end encrypted communication without exposing phone numbers or emails." },
    { icon: Activity, title: "Live Donation Tracking", desc: "Hospitals track donation status in real-time through a unified dashboard." },
    { icon: Lock, title: "Blockchain Audit Trail", desc: "Immutable records for every match and consent, ensuring transparency and trust." },
  ];

  return (
    <SectionWrapper id="features" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Core Features</h2>
        <p className="mt-4 text-lg text-gray-600">
          Everything you need for a secure, intelligent, and private blood donation ecosystem.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ scale: 1.03, y: -5 }}
              className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-dark">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}

// --------------------- Privacy Section ---------------------
function PrivacySection() {
  return (
    <SectionWrapper id="privacy" className="bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div variants={fadeInUp}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Lock className="h-4 w-4" /> Privacy by Design
          </div>
          <h2 className="mt-4 text-3xl font-bold text-dark sm:text-4xl">
            Your identity stays anonymous, always
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            AnonBlood uses advanced cryptographic techniques including zero-knowledge
            proofs and ring signatures to ensure that your personal data is never exposed
            during the matching process. Only essential medical information is shared.
          </p>
          <ul className="mt-6 space-y-3">
            {["Anonymous donor IDs", "Encrypted communication", "Consent-based data sharing", "HIPAA & GDPR compliant"].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={fadeInUp} className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="relative"
          >
            <div className="h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-accent/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-32 w-32 text-primary/60" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

// --------------------- AI Matching Section ---------------------
function AIMatchingSection() {
  return (
    <SectionWrapper id="ai-matching" className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div variants={fadeInUp} className="order-2 lg:order-1 flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="relative"
          >
            <div className="h-80 w-80 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/20 backdrop-blur" />
            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 text-primary/70" />
          </motion.div>
        </motion.div>
        <motion.div variants={fadeInUp} className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Brain className="h-4 w-4" /> AI-Powered Matching
          </div>
          <h2 className="mt-4 text-3xl font-bold text-dark sm:text-4xl">
            Intelligent donor-hospital pairing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Our AI algorithm considers blood type compatibility, geographic proximity, 
            urgency level, and donor availability to create optimal matches in seconds,
            not hours.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {["Blood Type Matching", "Location Awareness", "Urgency Triage", "Availability Calendar"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-700">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

// --------------------- RAG Section ---------------------
function RAGSection() {
  return (
    <SectionWrapper id="rag" className="bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div variants={fadeInUp}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <MessageSquare className="h-4 w-4" /> Intelligent Assistant
          </div>
          <h2 className="mt-4 text-3xl font-bold text-dark sm:text-4xl">
            Get instant medical guidance with RAG AI
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Our Retrieval-Augmented Generation (RAG) system answers your questions
            about eligibility, blood compatibility, and donation process using trusted
            medical sources — all without exposing your identity.
          </p>
          <Link to="/ai-assistant">
            <Button className="mt-6" variant="outline">
              Try AI Assistant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
        <motion.div variants={fadeInUp} className="flex justify-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="h-72 w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg"
          >
            <div className="flex flex-col space-y-3">
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none bg-primary/10 px-4 py-2 text-sm text-dark">
                  Am I eligible to donate blood if I have a tattoo?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-none bg-gray-100 px-4 py-2 text-sm text-dark">
                  In most regions, you can donate blood after 3-12 months of getting a tattoo, as long as it was done at a licensed facility. Check local guidelines.
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Lock className="h-3 w-3" /> Identity protected
            </div>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}

// --------------------- Workflow Section ---------------------
function WorkflowSection() {
  const steps = [
    { step: "01", title: "Anonymous Registration", desc: "Pseudonymous donors verified via zero-knowledge proof." },
    { step: "02", title: "AI Matching", desc: "Hospitals request blood; AI matches without revealing donor identity." },
    { step: "03", title: "Secure Consent", desc: "Donor approves via encrypted channel; location shared temporarily." },
    { step: "04", title: "Donation & Verification", desc: "Donation completed, verified, and recorded on blockchain." },
  ];

  return (
    <SectionWrapper id="workflow" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">How It Works</h2>
        <p className="mt-4 text-lg text-gray-600">
          A seamless, privacy-preserving workflow from request to donation.
        </p>
      </motion.div>

      <div className="mt-12 relative">
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
        <div className="space-y-8 lg:space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className={`flex flex-col lg:flex-row gap-8 items-center ${
                i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              }`}
            >
              <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg shadow-lg"
                >
                  {step.step}
                </motion.div>
                <h3 className="mt-4 text-xl font-semibold text-dark">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.desc}</p>
              </div>
              <div className="hidden lg:block w-12" />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// --------------------- Architecture Section ---------------------
function ArchitectureSection() {
  const techs = ["React + Vite", "Node.js API", "PostgreSQL", "Blockchain", "AI Model", "Redis Cache", "Cloud Storage", "WebSocket"];
  return (
    <SectionWrapper id="architecture" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">System Architecture</h2>
        <p className="mt-4 text-lg text-gray-600">
          Built with modern, scalable technologies ensuring security and performance.
        </p>
      </motion.div>
      <motion.div variants={fadeInUp} className="mt-12 flex justify-center">
        <div className="w-full max-w-4xl rounded-2xl border bg-white p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {techs.map((tech, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(230,57,70,0.1)" }}
                className="rounded-lg bg-gray-50 p-4 text-sm font-medium text-dark transition-colors"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  );
}

// --------------------- Benefits Section ---------------------
function BenefitsSection() {
  const benefits = [
    { icon: Users, title: "For Donors", desc: "Total privacy, AI-driven availability, and direct impact." },
    { icon: Building2, title: "For Hospitals", desc: "Faster matching, reduced manual work, and real-time tracking." },
    { icon: Shield, title: "For Society", desc: "Increased donation rates with trust and transparency." },
  ];
  return (
    <SectionWrapper id="benefits" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Benefits for Everyone</h2>
      </motion.div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div key={i} variants={fadeInUp} whileHover={{ y: -8 }} className="rounded-2xl bg-white p-8 border text-center shadow-sm">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
            >
              <Icon className="mx-auto h-10 w-10 text-primary" />
            </motion.div>
            <h3 className="mt-4 text-xl font-semibold">{b.title}</h3>
            <p className="mt-2 text-gray-600">{b.desc}</p>
          </motion.div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}

// --------------------- Comparison Section ---------------------
function ComparisonSection() {
  return (
    <SectionWrapper id="comparison" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Why AnonBlood?</h2>
      </motion.div>
      <motion.div variants={fadeInUp} className="mt-12 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Feature</th>
              <th className="py-3 px-4 text-primary font-bold">AnonBlood</th>
              <th className="py-3 px-4 text-gray-500">Traditional Systems</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Privacy", "Anonymous IDs", "Personal data exposed"],
              ["Matching", "AI-powered seconds", "Manual hours/days"],
              ["Communication", "Encrypted chat", "Phone/email leaks"],
              ["Transparency", "Blockchain audit", "Opaque records"],
            ].map((row, i) => (
              <motion.tr key={i} variants={fadeInUp} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{row[0]}</td>
                <td className="py-3 px-4 text-primary">{row[1]}</td>
                <td className="py-3 px-4 text-gray-500">{row[2]}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </SectionWrapper>
  );
}

// --------------------- Team Section ---------------------
function TeamSection() {
  const team = [
    { name: "Dr. Sarah Chen", role: "Project Lead", avatar: "SC" },
    { name: "Alex Rivera", role: "AI Engineer", avatar: "AR" },
    { name: "Priya Patel", role: "Privacy Architect", avatar: "PP" },
    { name: "James Okonkwo", role: "Full-Stack Dev", avatar: "JO" },
  ];
  return (
    <SectionWrapper id="team" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Meet the Team</h2>
      </motion.div>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {team.map((member, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -5 }}
            className="text-center"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
              className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shadow-sm"
            >
              {member.avatar}
            </motion.div>
            <h3 className="mt-3 font-semibold">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.role}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// --------------------- FAQ Section ---------------------
function FAQSection() {
  const faqs = [
    { q: "Is my identity really anonymous?", a: "Yes, we use zero-knowledge proofs and ring signatures to ensure that no one, not even the hospital, knows your real identity." },
    { q: "How does AI matching work?", a: "Our model analyzes blood type, location, urgency, and donor history to find the optimal match in real-time." },
    { q: "Is AnonBlood compliant with healthcare regulations?", a: "Absolutely. We follow HIPAA, GDPR, and local health data protection laws." },
  ];
  return (
    <SectionWrapper id="faq" className="bg-background">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Frequently Asked Questions</h2>
      </motion.div>
      <div className="mt-12 max-w-2xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <h3 className="font-semibold text-dark">{faq.q}</h3>
            <p className="mt-2 text-gray-600">{faq.a}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
}

// --------------------- Contact Section ---------------------
function ContactSection() {
  return (
    <SectionWrapper id="contact" className="bg-white">
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-dark sm:text-4xl">Get in Touch</h2>
        <p className="mt-4 text-lg text-gray-600">
          Have questions? We'd love to hear from you.
        </p>
      </motion.div>
      <motion.div variants={fadeInUp} className="mt-12 max-w-xl mx-auto">
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Name" />
            <Input type="email" placeholder="Email" />
          </div>
          <textarea
            placeholder="Message"
            rows={4}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full">Send Message</Button>
          </motion.div>
        </form>
      </motion.div>
    </SectionWrapper>
  );
}

// --------------------- CTA Section ---------------------
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-red-700 text-white relative overflow-hidden">
      <FloatingParticles />
      <div className="mx-auto max-w-4xl text-center px-4 relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold sm:text-4xl"
        >
          Ready to Save Lives Anonymously?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-white/80"
        >
          Join our community of private donors and hospitals.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Link to="/register">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Sign Up Now
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}