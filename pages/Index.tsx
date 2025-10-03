import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Zap, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-trust-gradient opacity-5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Trade Skills, Items & Money
              <span className="block mt-2 bg-trust-gradient bg-clip-text text-transparent">
                Built on Trust
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized marketplace where reputation matters. Barter skills, exchange items, or use money - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/marketplace")}>
                Browse Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Shield}
              title="Trust First"
              description="Reputation scores and badges help you make informed decisions about who to trade with."
            />
            <FeatureCard
              icon={Users}
              title="Flexible Trading"
              description="Exchange skills for skills, items for items, or use money - whatever works for you."
            />
            <FeatureCard
              icon={Zap}
              title="Prerequisites"
              description="Set clear requirements before starting work to avoid disputes and misunderstandings."
            />
            <FeatureCard
              icon={Award}
              title="Earn Badges"
              description="Build your reputation through successful trades and unlock special badges."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 bg-card rounded-2xl p-12 shadow-card">
            <h2 className="text-4xl font-bold">Ready to Start Trading?</h2>
            <p className="text-lg text-muted-foreground">
              Join a community built on responsibility and mutual benefit
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>TrustTrade © 2025 - A decentralized responsibility & incentive system</p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200 animate-fade-in">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

export default Index;
