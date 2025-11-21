import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p>
            This Privacy Policy describes how your personal information is collected, used, and shared when you use the Yung Chaf platform.
          </p>

          <h2>1. Personal Information We Collect</h2>
          <p>
            When you create an account, we collect your name and email address. When you use the platform, we may collect information about your activity, such as likes and comments.
          </p>

          <h2>2. How We Use Your Personal Information</h2>
          <p>
            We use the information we collect to operate and maintain the platform, communicate with you, and personalize your experience.
          </p>

          <h2>3. Sharing Your Personal Information</h2>
          <p>
            We do not sell your personal information. We may share your information with third-party service providers to help us operate the platform, such as hosting providers.
          </p>

          <h2>4. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can do this by visiting your account settings page.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information from unauthorized access or disclosure.
          </p>

          <h2>6. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
