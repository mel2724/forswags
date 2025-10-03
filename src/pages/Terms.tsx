import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
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
              <h2 className="text-2xl font-semibold mt-6 mb-4">4. Content and Conduct</h2>
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
              <h2 className="text-2xl font-semibold mt-6 mb-4">5. Membership and Payments</h2>
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
              <h2 className="text-2xl font-semibold mt-6 mb-4">6. Evaluations and Coaching Services</h2>
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
              <h2 className="text-2xl font-semibold mt-6 mb-4">7. Privacy and Data Protection</h2>
              <p>
                We take your privacy seriously. Your use of ForSwags is also governed by our Privacy Policy, 
                which can be found separately. By using our service, you consent to our collection and use of your 
                personal data as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">8. Intellectual Property</h2>
              <p>
                All content on ForSwags, including text, graphics, logos, images, and software, is the property of 
                ForSwags or its content suppliers and is protected by copyright and intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, ForSwags shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">10. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account and access to the service at our sole 
                discretion, without notice, for conduct that we believe violates these Terms or is harmful to other 
                users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes. 
                Your continued use of the service after such modifications constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                ForSwags operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-6 mb-4">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us through the contact information 
                provided on our website.
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                By using ForSwags, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
