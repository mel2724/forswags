import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare, HelpCircle } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
            Contact <span className="text-gradient-primary">Us</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We're here to help and support your journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-card/50 backdrop-blur border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Send Us a Message
              </CardTitle>
              <CardDescription>
                Contact form coming soon! For now, please reach out via email.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-2 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Get in Touch</CardTitle>
                <CardDescription>
                  Reach out to us through any of these channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href="mailto:support@forswags.org" className="text-muted-foreground hover:text-primary transition-colors">
                      support@forswags.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-muted-foreground">Coming Soon</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-muted-foreground">Nationwide Service</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold mb-1">How do I get started?</p>
                  <p className="text-sm text-muted-foreground">
                    Sign up for a free account and complete your athlete profile to get started.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">What membership plans do you offer?</p>
                  <p className="text-sm text-muted-foreground">
                    We offer free, pro monthly ($14.99), and championship yearly ($97) plans.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">How do evaluations work?</p>
                  <p className="text-sm text-muted-foreground">
                    Purchase an evaluation and our expert coaches will assess your performance and provide detailed feedback.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Is my information secure?</p>
                  <p className="text-sm text-muted-foreground">
                    Yes! All contact information is kept private. Only athletic information is displayed on public profiles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
