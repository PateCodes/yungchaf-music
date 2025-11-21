import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p>
            Welcome to the Yung Chaf platform. By accessing or using our website and services, you agree to be bound by these Terms of Service and our Privacy Policy.
          </p>

          <h2>1. Use of the Platform</h2>
          <p>
            You agree to use the platform for personal, non-commercial use only. You must not use the platform for any illegal or unauthorized purpose.
          </p>

          <h2>2. Intellectual Property</h2>
          <p>
            The content on the platform, including music, text, graphics, and images, is the property of Yung Chaf and is not copyrighted. You are free to use and share the music, but please provide attribution.
          </p>

          <h2>3. User Content</h2>
          <p>
            You are responsible for any content you post, including comments and profile information. By posting content, you grant us a license to use, modify, and display it on the platform.
          </p>
          
          <h2>4. Prohibited Conduct</h2>
          <p>
            You agree not to engage in any of the following prohibited activities: spamming, harassing other users, distributing malware, or attempting to compromise the platform's security.
          </p>

          <h2>5. Disclaimers</h2>
          <p>
            The platform is provided "as is" without any warranties. We do not guarantee that the service will be uninterrupted or error-free.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall Yung Chaf or his affiliates be liable for any indirect, incidental, or consequential damages arising out of your use of the platform.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
