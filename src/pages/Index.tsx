import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Star, Zap, Users, TrendingUp, CheckCircle, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Animated mesh background */}
      <div className="fixed inset-0 -z-10" style={{ background: "var(--gradient-mesh)" }} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="container mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Decentralized Trust Marketplace</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Trade Skills,
            <br />
            Build Trust
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            A revolutionary marketplace where reputation is everything. Barter skills, exchange items, or use money - your community, your rules.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/marketplace">
              <Button size="lg" className="gap-2 text-lg px-8 h-14 relative group overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Browse Marketplace
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 border-primary/20 hover:border-primary/40">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
            {[
              { label: "Active Traders", value: "10K+" },
              { label: "Deals Completed", value: "50K+" },
              { label: "Trust Score", value: "98%" }
            ].map((stat, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Why Choose TrustTrade?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on trust, powered by community. Trade with absolute confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Reputation System",
                description: "Build unshakeable trust through completed deals and earn badges that prove your reliability",
                gradient: "from-primary/20 to-primary/5"
              },
              {
                icon: Users,
                title: "Flexible Exchange",
                description: "Trade skills for skills, items for items, or use money - whatever works for your deal",
                gradient: "from-accent/20 to-accent/5"
              },
              {
                icon: CheckCircle,
                title: "Prerequisites",
                description: "Set crystal-clear requirements before work begins to eliminate disputes entirely",
                gradient: "from-success/20 to-success/5"
              }
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-glow group bg-gradient-to-br from-card to-card/50 backdrop-blur"
              >
                <CardContent className="pt-8 pb-8 px-6">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Badge System Section */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="container mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">Earn Trust Badges</h2>
            <p className="text-xl text-muted-foreground">Your reputation is your superpower</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Star, label: "Trusted", desc: "100% completion", color: "text-yellow-500" },
              { icon: Zap, label: "Fast", desc: "Quick replies", color: "text-blue-500" },
              { icon: TrendingUp, label: "Master", desc: "High ratings", color: "text-purple-500" },
              { icon: Shield, label: "Fair", desc: "Dispute resolver", color: "text-green-500" }
            ].map((badge, i) => (
              <Card 
                key={i} 
                className="text-center border-primary/10 hover:border-primary/30 hover:shadow-glow transition-all duration-300 group bg-gradient-to-br from-card to-card/50"
              >
                <CardContent className="pt-8 pb-8">
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <badge.icon className={`h-12 w-12 ${badge.color} mx-auto`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{badge.label}</h3>
                  <p className="text-sm text-muted-foreground">{badge.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Join our thriving community of trusted traders and start exchanging skills, items, and opportunities today.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-lg px-12 h-16 text-xl relative group overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Create Your Account
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
