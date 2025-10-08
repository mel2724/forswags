import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="Terms and Conditions"
        description="ForSWAGs terms of service. Review our user agreement, membership terms, evaluation services, content policies, and legal terms for student-athletes and recruiters."
        keywords="terms of service, terms and conditions, user agreement, membership terms, legal terms, ForSWAGs terms, student athlete agreement"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms and Conditions",
          "description": "ForSWAGs terms and conditions outlining user agreements and service policies",
          "url": "https://forswags.org/terms"
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
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using ForSwags, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials on ForSwags for personal, non-commercial use only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on ForSwags</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Account Responsibilities</h2>
              <p>
                When you create an account with us, you must provide accurate and complete information. 
                You are responsible for maintaining the confidentiality of your account and password and for restricting 
                access to your account.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 13 years old to use this service</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You may not use another user's account without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">4. Minor Privacy and COPPA Compliance</h2>
              <p>
                ForSwags is committed to protecting the privacy of minors and complying with the Children's Online Privacy 
                Protection Act (COPPA) and similar child protection laws.
              </p>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">4.1 Age Requirements and Verification</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users must be at least 13 years of age to create an account</li>
                <li>We may request age verification to ensure compliance</li>
                <li>Users under 18 are considered minors and receive additional privacy protections</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.2 Parental Consent</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>For users between 13-17 years old, we strongly encourage parental involvement and oversight</li>
                <li>Parents may create linked guardian accounts to monitor their child's activity</li>
                <li>Parents have the right to review, modify, or request deletion of their child's information</li>
                <li>We will verify parental consent before collecting additional personal information from users under 13 where required by law</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.3 Enhanced Minor Protections</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact information for minors (email, phone, address) is never publicly displayed</li>
                <li>Only verified, paid recruiters can access minor contact information, and only for legitimate recruitment purposes</li>
                <li>We do not knowingly engage in behavioral advertising targeted to users under 18</li>
                <li>Minors' data is subject to stricter retention and deletion policies</li>
                <li>We maintain detailed audit logs of who accesses minor athlete profiles</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">4.4 Parental Rights</h3>
              <p>Parents and legal guardians of minor users have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Review all personal information collected about their child</li>
                <li>Request correction or deletion of their child's personal information</li>
                <li>Refuse to allow further collection or use of their child's information</li>
                <li>Request details about our data practices regarding their child's information</li>
                <li>Receive notifications about any data breaches affecting their child's account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">5. Content and Conduct</h2>
              <p>
                You are solely responsible for any content you upload, post, or display on ForSwags. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Violate any intellectual property rights</li>
                <li>Transmit any viruses or malicious code</li>
                <li>Engage in any activity that interferes with the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">6. Membership and Payments</h2>
              <p>
                Certain features of ForSwags require a paid membership. By subscribing to a paid membership:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You agree to pay all fees associated with your chosen membership tier</li>
                <li>Payments are processed through secure third-party payment processors</li>
                <li>Memberships automatically renew unless cancelled</li>
                <li>Refunds are subject to our refund policy</li>
                <li>We reserve the right to change pricing with notice to existing members</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">7. Evaluations and Coaching Services</h2>
              <p>
                Our evaluation and coaching services are provided by qualified coaches. However:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Evaluations represent professional opinions and are not guarantees of athletic performance or recruitment</li>
                <li>We do not guarantee college placement or scholarship offers</li>
                <li>Evaluation turnaround times are estimates and may vary</li>
                <li>Purchased evaluations are non-refundable once assigned to a coach</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">8. Privacy and Data Protection</h2>
              <p>
                We take your privacy seriously. Your use of ForSwags is also governed by our Privacy Policy, 
                which can be found separately. By using our service, you consent to our collection and use of your 
                personal data as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">9. Intellectual Property Rights and Protections</h2>
              
              <h3 className="text-xl font-semibold mt-4 mb-3">9.1 Proprietary Rights</h3>
              <p>
                ForSwags™ (For Students With Athletic Goals) and all associated intellectual property are owned exclusively 
                by ForSwags and are protected by United States and international copyright, trademark, patent, trade secret, 
                and other intellectual property or proprietary rights laws.
              </p>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.2 Protected Intellectual Property</h3>
              <p className="font-semibold mb-2">The following are proprietary to ForSwags and protected by law:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Trademarks & Service Marks:</strong> ForSWAGs®, the ForSwAGs logo, "For Students With Athletic Goals," Playbook for Life®, and all related marks</li>
                <li><strong>Proprietary Methodologies:</strong> Our holistic athlete ranking system, life skills evaluation framework, and character assessment algorithms</li>
                <li><strong>Technology & Systems:</strong> College matching algorithms, AI-powered evaluation tools, social media generation technology, and platform architecture</li>
                <li><strong>Educational Content:</strong> All Playbook for Life curriculum, training courses, lesson materials, quizzes, and educational frameworks</li>
                <li><strong>Visual Design:</strong> User interface design, graphics, logos, color schemes, layout patterns, and visual branding elements</li>
                <li><strong>Business Processes:</strong> Evaluation workflows, coach assignment systems, recruiter matching processes, and membership structures</li>
                <li><strong>Data & Analytics:</strong> Performance metrics, ranking formulas, statistical analysis methods, and predictive algorithms</li>
                <li><strong>Content & Media:</strong> All text, images, videos, audio, graphics, code, databases, and data compilations</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.3 Unique Platform Concepts</h3>
              <p className="font-semibold mb-2">ForSwags&apos; innovative approach includes several unique concepts that are protected intellectual property:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Holistic Athlete Development Model:</strong> Integration of athletic performance, academic achievement, and life skills training in a unified platform</li>
                <li><strong>Non-Star-Rating System:</strong> Our proprietary ranking methodology that evaluates character, leadership, and life skills alongside athletic ability</li>
                <li><strong>Playbook for Life®:</strong> Comprehensive life skills curriculum designed specifically for student-athletes</li>
                <li><strong>Expert-Led College Matching:</strong> Human expert review combined with AI technology for personalized college recommendations</li>
                <li><strong>Integrated Media Management:</strong> AI-powered social media content generation and press release tools for athlete branding</li>
                <li><strong>Three-Tiered Access Model:</strong> Our specific membership structure and feature distribution across Starter, Pro, and Championship tiers</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.4 Prohibited Activities</h3>
              <p>You expressly agree that you will NOT:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Copy, reproduce, duplicate, or replicate any portion of the ForSwags platform, methodology, or content</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to derive source code from the platform</li>
                <li>Create derivative works based on ForSwags&apos; intellectual property</li>
                <li>Use our proprietary methodologies, algorithms, or evaluation systems in competing services</li>
                <li>Replicate our business model, membership structure, or service offerings</li>
                <li>Extract, scrape, or systematically collect data from the platform</li>
                <li>Use ForSwags concepts, branding, or methodologies to create a similar or competing service</li>
                <li>Remove, alter, or obscure any copyright, trademark, or proprietary notices</li>
                <li>Claim ownership or authorship of ForSwags&apos; intellectual property</li>
                <li>Use our trademarks, logos, or branding without explicit written permission</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.5 User-Generated Content</h3>
              <p>
                When you upload or submit content to ForSwags (photos, videos, statistics, achievements):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You retain ownership of your original content</li>
                <li>You grant ForSwags a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your content for platform operations</li>
                <li>You represent that you have all necessary rights to the content you submit</li>
                <li>You acknowledge that your content may be displayed publicly as part of your athlete profile</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.6 DMCA and Copyright Infringement</h3>
              <p>
                ForSwags respects intellectual property rights and expects users to do the same. If you believe your 
                copyright has been infringed, contact us immediately with detailed information. We will investigate and 
                take appropriate action, including removing infringing content and terminating repeat infringers.
              </p>

              <h3 className="text-xl font-semibold mt-4 mb-3">9.7 Enforcement</h3>
              <p>
                ForSwags actively monitors and enforces its intellectual property rights. Unauthorized use may result in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Immediate termination of your account and access</li>
                <li>Civil lawsuits for damages, including statutory damages and attorney fees</li>
                <li>Criminal prosecution where applicable</li>
                <li>Injunctive relief to prevent ongoing infringement</li>
                <li>Pursuit of maximum penalties under applicable laws</li>
              </ul>

              <div className="mt-4 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
                <p className="font-bold text-sm">⚠️ WARNING: INTELLECTUAL PROPERTY THEFT IS A SERIOUS CRIME</p>
                <p className="text-sm mt-2">
                  Violations of ForSwags&apos; intellectual property rights are prosecuted to the fullest extent of the law. 
                  This includes both civil and criminal remedies. If you are considering copying, replicating, or adapting 
                  any ForSwags concepts, technology, or content, be aware that you may face substantial legal liability.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, ForSwags shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">11. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to the service at our sole 
                discretion, without notice, for conduct that we believe violates these Terms or is harmful to other 
                users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes. 
                Your continued use of the service after such modifications constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                ForSwags operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">14. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us through the contact information 
                provided on our website.
              </p>
              <p className="mt-4 text-sm">
                For intellectual property inquiries, trademark licensing, or to report infringement, 
                please use the subject line "IP/Legal Inquiry" in your communication.
              </p>
            </section>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
              <p className="font-bold text-center mb-3">COMPREHENSIVE COPYRIGHT NOTICE</p>
              <p className="text-sm text-center leading-relaxed">
                © 2019 ForSWAGs™ (For Students With Athletic Goals). All Rights Reserved Worldwide.<br/>
                This platform, including all content, features, functionality, technology, methodologies, and intellectual 
                property embodied herein, is owned by ForSWAGs and protected by United States and international copyright, 
                trademark, patent, trade secret, and other intellectual property laws.<br/>
                <span className="font-semibold mt-2 block">
                  Unauthorized reproduction, duplication, or use is strictly prohibited and will be prosecuted.
                </span>
              </p>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                By using ForSwags, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, 
                including all intellectual property protections and restrictions outlined herein.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
