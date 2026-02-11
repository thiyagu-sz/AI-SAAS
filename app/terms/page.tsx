import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary-dark">
            ← Back to QuickNotes
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-text-main mb-8">Terms of Service</h1>
          <p className="text-text-muted mb-8">Last updated: February 11, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">User Responsibility</h2>
            <p className="text-text-muted mb-4">
              You are responsible for all content you upload to QuickNotes. You must ensure that:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2">
              <li>You have the right to upload and process the documents</li>
              <li>The content does not violate any copyright or intellectual property rights</li>
              <li>You use the service for legitimate educational purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Prohibited Content</h2>
            <p className="text-text-muted mb-4">
              You may not upload or process:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2">
              <li>Illegal material or content that promotes illegal activities</li>
              <li>Copyrighted material without proper authorization</li>
              <li>Personal information of others without consent</li>
              <li>Malicious files or spam content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Service Changes</h2>
            <p className="text-text-muted mb-4">
              QuickNotes is currently in beta and may undergo changes. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-text-muted space-y-2">
              <li>Modify or discontinue features with reasonable notice</li>
              <li>Update these terms as the service evolves</li>
              <li>Implement usage limits or pricing in the future</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">No Guarantee of Accuracy</h2>
            <p className="text-text-muted mb-4">
              QuickNotes uses AI technology to generate study materials. While we strive for accuracy, 
              we do not guarantee that all generated content is correct or complete. You should always 
              verify important information and use the generated materials as a study aid, not as a 
              substitute for your own learning and understanding.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Limitation of Liability</h2>
            <p className="text-text-muted mb-4">
              QuickNotes is provided "as is" without warranties. We are not liable for any damages 
              arising from your use of the service, including but not limited to academic performance 
              or decisions based on generated content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Contact</h2>
            <p className="text-text-muted">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:thiyaguai2004@gmail.com" className="text-primary hover:text-primary-dark">
                thiyaguai2004@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}