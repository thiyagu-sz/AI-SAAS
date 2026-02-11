import Link from 'next/link';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-text-main mb-8">Privacy Policy</h1>
          <p className="text-text-muted mb-8">Last updated: February 11, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Data We Store</h2>
            <ul className="list-disc pl-6 text-text-muted space-y-2">
              <li>PDFs and documents you upload for processing</li>
              <li>AI-generated notes and summaries from your documents</li>
              <li>Your account information (email, name) for authentication</li>
              <li>Chat history with our AI assistant</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Authentication</h2>
            <p className="text-text-muted mb-4">
              We use Supabase for secure authentication. Your login credentials are encrypted and stored securely.
              We support Google OAuth and email/password authentication methods.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Data Usage</h2>
            <p className="text-text-muted mb-4">
              <strong>We do not sell your data.</strong> Your uploaded documents and generated notes are used solely 
              to provide you with study materials. We may analyze usage patterns to improve our service, but this 
              is done with anonymized data only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Data Deletion</h2>
            <p className="text-text-muted mb-4">
              You can request deletion of your account and all associated data at any time. Contact us at{' '}
              <a href="mailto:thiyaguai2004@gmail.com" className="text-primary hover:text-primary-dark">
                thiyaguai2004@gmail.com
              </a>{' '}
              to initiate the deletion process.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-4">Contact</h2>
            <p className="text-text-muted">
              If you have any questions about this Privacy Policy, please contact us at{' '}
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