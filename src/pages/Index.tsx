import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, BarChart3, CheckCircle, MessageSquare } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: 'var(--gradient-hero)' }}
        />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              College Complaint
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Streamline complaint handling across your institution. Track, manage, and resolve issues with transparency and efficiency.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent shadow-lg hover:opacity-90 transition-opacity"
              >
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive solution for managing complaints across all departments
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <FileText className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Easy Submission</CardTitle>
              <CardDescription>
                Submit complaints with attachments, categories, and detailed descriptions in just a few clicks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Separate dashboards for students, faculty, and administrators with appropriate permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <Shield className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Anonymous Support</CardTitle>
              <CardDescription>
                Option to submit anonymous complaints while maintaining accountability at admin level
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <CheckCircle className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Status Tracking</CardTitle>
              <CardDescription>
                Real-time updates on complaint status from submission to resolution
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <MessageSquare className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Communication Hub</CardTitle>
              <CardDescription>
                Email notifications and feedback system to keep all parties informed
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <BarChart3 className="mb-4 h-12 w-12 text-primary" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Insights into complaint trends, categories, and resolution times
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Designed for Everyone
            </h2>
            <p className="text-lg text-muted-foreground">
              Tailored experiences for each user role
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Submit and track complaints</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Anonymous submission option</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Provide feedback and reopen</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Email notifications</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-full bg-accent/10 p-2">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  Faculty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-accent" />
                  <p className="text-sm">View assigned complaints</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-accent" />
                  <p className="text-sm">Update status and add comments</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-accent" />
                  <p className="text-sm">Upload supporting documents</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-accent" />
                  <p className="text-sm">Department-specific access</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  Administrators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">View all complaints</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Assign to faculty members</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">Analytics and reporting</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 text-primary" />
                  <p className="text-sm">User management</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-12 text-center text-white shadow-xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Transform how your institution handles complaints today
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="shadow-lg"
          >
            Create Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 College Complaint Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
