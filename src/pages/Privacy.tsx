import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, Users } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Privacy Policy"
        description="ForSWAGs privacy policy. Learn how we protect your data, create public athletic profiles while keeping contact information private, and secure student-athlete information."
        keywords="privacy policy, data protection, athletic profile privacy, student athlete privacy, contact information security, ForSWAGs privacy"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy",
          "description": "ForSWAGs privacy policy explaining how we handle athletic profiles and protect personal information",
          "url": "https://forswags.org/privacy"
        }}
      />
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">Our Commitment to Your Privacy</h2>
              <p>
                At ForSwags, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our platform. Please read this policy carefully 
                to understand our practices regarding your personal data.
              </p>
            </section>

            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg my-6">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Important: Public Athletic Profiles</h3>
                  <p className="text-sm">
                    Your athletic information, including stats, achievements, highlights, and performance data, 
                    will be used to create a <strong>public player profile</strong> that is visible to college recruiters, 
                    coaches, and other users of the platform. This is essential to help you get recruited and showcase your talent.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded-r-lg my-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Your Contact Information is Private</h3>
                  <p className="text-sm">
                    All contact information including your email address, phone number, home address, and social media 
                    handles will be <strong>kept strictly private</strong> and will not be publicly displayed. We only 
                    share this information with verified recruiters who have paid accounts, and only when necessary 
                    for legitimate recruitment purposes.
                  </p>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">1.1 Information You Provide to Us</h3>
              <p>When you create an account or use our services, you may provide:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password, date of birth, phone number</li>
                <li><strong>Profile Information:</strong> Photos, biographical information, graduation year, school information</li>
                <li><strong>Athletic Data:</strong> Sport, position, stats, achievements, highlights, videos, performance metrics</li>
                <li><strong>Academic Information:</strong> GPA, test scores, academic achievements, honors courses</li>
                <li><strong>Contact Details:</strong> Address, social media handles, parent/guardian contact information</li>
                <li><strong>Payment Information:</strong> Billing details (processed securely by third-party payment processors)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">1.2 Information We Collect Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (browser type, operating system, IP address)</li>
                <li>Usage data (pages viewed, features used, time spent on platform)</li>
                <li>Location data (general geographic location based on IP address)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">1.3 Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Social media profile information (if you connect social accounts)</li>
                <li>Verification data from educational institutions</li>
                <li>Payment processing information from payment providers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">2.1 Public Profile Creation</h3>
              <p>
                We use your athletic information to create a comprehensive public profile that includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Athletic stats, achievements, and performance data</li>
                <li>Highlight videos and photos</li>
                <li>Sport, position, and graduation year</li>
                <li>School and team information</li>
                <li>Rankings and evaluations</li>
              </ul>
              <p className="mt-3">
                <strong>This information is publicly visible</strong> to help college recruiters and coaches discover and evaluate you.
              </p>

              <h3 className="text-xl font-semibold mt-4 mb-3">2.2 Private Information Protection</h3>
              <p>Your contact information is kept private and used only to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Communicate with you about your account and services</li>
                <li>Send important updates and notifications</li>
                <li>Facilitate legitimate recruitment connections (only to verified recruiters)</li>
                <li>Process payments and transactions</li>
                <li>Respond to your support requests</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">2.3 Service Improvement</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Analyze usage patterns to improve our platform</li>
                <li>Develop new features and services</li>
                <li>Personalize your experience</li>
                <li>Provide customer support</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">2.4 Legal and Security Purposes</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comply with legal obligations</li>
                <li>Protect against fraud and abuse</li>
                <li>Enforce our terms and conditions</li>
                <li>Protect the rights and safety of our users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">3. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">3.1 Public Information</h3>
              <p>
                Your athletic profile information is <strong>publicly accessible</strong> to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>College recruiters and coaches</li>
                <li>Other platform users</li>
                <li>Anyone visiting the ForSwags website</li>
                <li>Search engines (your profile may appear in search results)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">3.2 Private Contact Information</h3>
              <p>
                Your contact information (email, phone, address, social media handles) is <strong>never publicly displayed</strong>. 
                We only share it:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With verified college recruiters who have paid accounts (for legitimate recruitment purposes)</li>
                <li>With coaches assigned to your evaluations</li>
                <li>With our service providers who help operate our platform (under strict confidentiality agreements)</li>
                <li>When required by law or to protect legal rights</li>
                <li>With your explicit consent</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">3.3 Service Providers</h3>
              <p>We work with trusted third-party service providers who assist us with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processing (Stripe, PayPal)</li>
                <li>Cloud hosting and storage</li>
                <li>Email communications</li>
                <li>Analytics and performance monitoring</li>
                <li>Customer support tools</li>
              </ul>
              <p className="mt-3">
                These providers are contractually obligated to protect your information and use it only for authorized purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">4. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">4.1 Profile Visibility Controls</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can set your profile to private (limits visibility to verified recruiters only)</li>
                <li>You can control which specific information is displayed on your public profile</li>
                <li>You can remove or update your profile information at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.2 Access and Correction</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can access and update your account information at any time</li>
                <li>You can request a copy of all data we have about you</li>
                <li>You can correct inaccurate information</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.3 Deletion Rights</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can request deletion of your account and personal data</li>
                <li>Some information may be retained for legal or legitimate business purposes</li>
                <li>Deleted profiles are removed from public view immediately</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.4 Communication Preferences</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can opt out of marketing emails (account-related emails are required)</li>
                <li>You can manage notification preferences in your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure payment processing (PCI DSS compliant)</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="mt-3">
                However, no method of transmission over the internet is 100% secure. While we strive to protect 
                your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">6. Children&apos;s Privacy</h2>
              <p>
                ForSwags is designed for student-athletes aged 13 and older. For users under 18:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We recommend parental involvement in account creation and management</li>
                <li>We offer parent accounts with oversight capabilities</li>
                <li>Parents can request to review or delete their child&apos;s information</li>
                <li>We comply with applicable child privacy protection laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Improve site performance and user experience</li>
                <li>Provide personalized content and recommendations</li>
              </ul>
              <p className="mt-3">
                You can control cookie settings through your browser, though some features may not function properly 
                if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">8. Third-Party Links</h2>
              <p>
                Our platform may contain links to external websites or services. We are not responsible for the 
                privacy practices of these third parties. We encourage you to review their privacy policies before 
                providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">9. International Users</h2>
              <p>
                If you are accessing ForSwags from outside the United States, please note that your information 
                may be transferred to, stored, and processed in the United States. By using our services, you 
                consent to this transfer and processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal 
                requirements. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a prominent notice on the platform</li>
              </ul>
              <p className="mt-3">
                Your continued use of ForSwags after such modifications constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">11. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, 
                please contact us through the contact information provided on our website.
              </p>
              <p className="mt-3">
                For data access, correction, or deletion requests, please use the data management tools in your 
                account settings or contact our support team.
              </p>
            </section>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Summary of Key Points</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Your <strong>athletic information</strong> is used to create a <strong>public profile</strong> visible to recruiters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>Your <strong>contact information</strong> (email, phone, address) is <strong>kept private</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>You have control over your profile visibility and can update or delete your information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary font-bold">•</span>
                      <span>We use industry-standard security measures to protect your data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
