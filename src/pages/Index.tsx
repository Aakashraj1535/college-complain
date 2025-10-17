import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, BarChart3, CheckCircle, MessageSquare, Sparkles, Bell, Smartphone, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StatsCounter } from "@/components/ui/stats-counter";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fetch real statistics from database
  const { data: complaints = [] } = useQuery({
    queryKey: ["homepage-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("status");
      if (error) throw error;
      return data || [];
    },
  });

  const completedComplaints = complaints.filter(c => c.status === "completed").length;
  const totalComplaints = complaints.length;
  const satisfactionRate = totalComplaints > 0 
    ? Math.round((completedComplaints / totalComplaints) * 100) 
    : 0;

  const { data: userRole } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user && userRole) {
      switch (userRole.role) {
        case "student":
          navigate("/student");
          break;
        case "faculty":
          navigate("/faculty");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    }
  }, [user, userRole, navigate]);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 mesh-gradient animate-gradient -z-10" />
      
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent animate-gradient">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-heading gradient-text">ComplaintHub</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button onClick={() => signOut()} className="hover-scale shadow-neon">Sign Out</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate("/login")} className="hover-scale">Login</Button>
                <Button onClick={() => navigate("/register")} className="hover-scale shadow-neon">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 lg:py-32 space-y-12">
        <div className="text-center space-y-6 relative">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-2 border-primary/50 mb-4 hover-scale">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Now with Real-time Notifications</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight relative">
            <span className="gradient-text animate-gradient inline-block">
              Streamline Complaint
            </span>
            <br />
            <span className="text-foreground">Management</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform for students, faculty, and administrators to track, manage, and resolve complaints with unprecedented efficiency.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="text-4xl font-bold mb-2">
                <StatsCounter value={completedComplaints} suffix="+" />
              </div>
              <p className="text-sm text-muted-foreground">Complaints Resolved</p>
            </div>
            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="text-4xl font-bold mb-2">
                <StatsCounter value={satisfactionRate} suffix="%" />
              </div>
              <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
            </div>
            <div className="glass-card rounded-xl p-6 hover-lift">
              <div className="text-4xl font-bold mb-2">
                <StatsCounter value={24} />
              </div>
              <p className="text-sm text-muted-foreground">Avg. Hours to Resolve</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {user ? (
              <Button size="lg" onClick={() => signOut()} className="shadow-neon hover-scale text-lg px-8 py-6">
                Sign Out
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => navigate("/register")} className="shadow-neon hover-scale text-lg px-8 py-6">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={scrollToFeatures} className="hover-scale text-lg px-8 py-6 glass-card">
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-heading">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage complaints effectively and transparently
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-variant w-fit mb-4 shadow-neon animate-float">
                <FileText className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Easy Submission</CardTitle>
              <CardDescription className="text-base">
                Submit complaints with our intuitive drag-and-drop interface, file attachments, and detailed categorization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-secondary w-fit mb-4 shadow-neon animate-float" style={{ animationDelay: "0.2s" }}>
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Real-time Tracking</CardTitle>
              <CardDescription className="text-base">
                Track complaint status from submission to resolution with live updates and visual progress indicators
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-accent w-fit mb-4 shadow-neon animate-float" style={{ animationDelay: "0.4s" }}>
                <MessageSquare className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Smart Notifications</CardTitle>
              <CardDescription className="text-base">
                Stay informed with automated notifications and email updates for all stakeholders in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent w-fit mb-4 shadow-neon animate-float" style={{ animationDelay: "0.6s" }}>
                <Bell className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Push Notifications</CardTitle>
              <CardDescription className="text-base">
                Instant push notifications keep you updated on every status change, comment, and resolution
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary w-fit mb-4 shadow-neon animate-float" style={{ animationDelay: "0.8s" }}>
                <Smartphone className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Mobile-Ready</CardTitle>
              <CardDescription className="text-base">
                Access from any device with our responsive design optimized for mobile, tablet, and desktop experiences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="glass-card border-2 hover-lift overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-primary w-fit mb-4 shadow-neon animate-float" style={{ animationDelay: "1s" }}>
                <Shield className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">Secure & Private</CardTitle>
              <CardDescription className="text-base">
                Anonymous complaint submission with enterprise-grade security, encryption, and data protection
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container relative">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading">
              <span className="gradient-text">Designed for Everyone</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences and powerful tools for each user role
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="glass-strong border-2 border-primary/30 hover-lift overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl font-heading mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-neon">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                {[
                  "Submit and track complaints easily",
                  "Anonymous submission option",
                  "Provide feedback and ratings",
                  "Real-time email notifications",
                  "Upload images and documents"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 group/item">
                    <div className="mt-0.5">
                      <CheckCircle className="h-5 w-5 text-primary group-hover/item:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-strong border-2 border-accent/30 hover-lift overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl font-heading mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-secondary shadow-neon">
                    <Shield className="h-6 w-6 text-accent-foreground" />
                  </div>
                  Faculty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                {[
                  "View department complaints",
                  "Update status and progress",
                  "Add comments and responses",
                  "Upload resolution documents",
                  "Department analytics access"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 group/item">
                    <div className="mt-0.5">
                      <CheckCircle className="h-5 w-5 text-accent group-hover/item:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-strong border-2 border-secondary/30 hover-lift overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-2xl font-heading mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-primary shadow-neon">
                    <BarChart3 className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  Administrators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                {[
                  "View all system complaints",
                  "Assign to faculty members",
                  "Advanced analytics dashboard",
                  "User and role management",
                  "Export reports and data"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 group/item">
                    <div className="mt-0.5">
                      <CheckCircle className="h-5 w-5 text-secondary group-hover/item:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="relative rounded-3xl overflow-hidden glass-strong border-2 border-primary/30 p-12 md:p-16 text-center hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-10 group-hover:opacity-20 transition-opacity animate-gradient" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <TrendingUp className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4">
              <span className="gradient-text">Ready to Get Started?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform how your institution handles complaints today. Join thousands of satisfied users.
            </p>
            {!user && (
              <Button 
                size="lg" 
                className="shadow-neon hover-scale text-lg px-8 py-6"
                onClick={() => navigate("/register")}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create Account Free
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card border-t py-12">
        <div className="container text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-heading gradient-text">ComplaintHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 College Complaint Management System. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for better campus communication
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
