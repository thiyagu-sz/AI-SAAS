'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background-light text-text-main antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#e7e7f3] glass-nav">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 text-text-main group cursor-pointer">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">auto_stories</span>
            </div>
            <h2 className="text-text-main text-lg font-bold leading-tight tracking-tight">AI Study Notes</h2>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-text-main text-sm font-medium hover:text-primary transition-colors" href="#features">Features</a>
            <a className="text-text-main text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
            <a className="text-text-main text-sm font-medium hover:text-primary transition-colors" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-text-main hover:text-primary">
              Log in
            </Link>
            <button
              onClick={() => router.push('/signup')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-glow"
            >
              Get StartedD
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center pt-16 pb-20 px-4 md:px-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-background-light to-background-light overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl text-center flex flex-col gap-6 items-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-100 shadow-sm mb-2">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">New: GPT-4o Integration</span>
          </div>
          <h1 className="text-text-main text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
            Study smarter.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Not longer.</span>
          </h1>
          <p className="text-text-muted text-lg md:text-xl font-normal max-w-2xl leading-relaxed">
            Turn dense PDFs into exam-ready notes in seconds using AI. Join thousands of students saving time today.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => router.push('/signup')}
              className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary hover:bg-primary-dark text-white text-base font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Try for Free
            </button>
            <button
              onClick={scrollToFeatures}
              className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-text-main text-base font-bold transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
        <div className="mt-16 w-full max-w-5xl relative group perspective-1000">
          <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
            {/* Browser top bar mock */}
            <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60"></div>
            </div>
            {/* Image */}
            <div className="aspect-[16/9] w-full bg-cover bg-center" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPROB-3AKTklYRUNghcpWygWFlM_1WckUhmVMU_ucFhPhsTNju6R_9Yv9J8Wq6TZFNabNzcpMzfFRFpT0NaCYHp_ClU9Lw1WXiclh69EQ1qEyxECuqge23B_t9zYWRU-AOngLJhyJuLav1kqgM3ptvxiUHDhSJmLHczPyykMj60Kvq0xljtTj-CecwQ0Gt-HKrftgsKwnHTMuO7-WdElyCVxyGEHpg3TR38JQO2gDBSnd9R2Rmez-N80Lvr_5YLRQDyZEfJ68EJgo')` }}>
              <div className="w-full h-full bg-gradient-to-tr from-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="absolute -inset-4 bg-primary/20 blur-2xl -z-10 rounded-[30px] opacity-60"></div>
        </div>
      </section>

      {/* Trust / Value Strip */}
      <section className="border-y border-[#e7e7f3] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">
          <h3 className="text-text-main text-lg font-bold">Built for students • Exam-focused • Privacy-first</h3>
          <div className="hidden md:block w-px h-8 bg-gray-200"></div>
          <div className="flex items-center gap-6 opacity-70 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <span className="text-sm font-semibold">SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bolt</span>
              <span className="text-sm font-semibold">10x Faster</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              <span className="text-sm font-semibold">10k+ Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 md:px-10 max-w-7xl mx-auto" id="features">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Powerful Features</h2>
          <h3 className="text-text-main text-3xl md:text-4xl font-bold leading-tight">Everything you need to ace the exam</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="group flex flex-col gap-4 rounded-xl border border-[#cfcfe7] bg-white p-6 transition-all hover:border-primary/50 hover:shadow-soft hover:-translate-y-1">
            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-text-main text-lg font-bold">AI Notes Generator</h4>
              <p className="text-text-muted text-sm leading-relaxed">Instantly summarize long documents into key points and actionable study notes.</p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="group flex flex-col gap-4 rounded-xl border border-[#cfcfe7] bg-white p-6 transition-all hover:border-primary/50 hover:shadow-soft hover:-translate-y-1">
            <div className="size-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-text-main text-lg font-bold">Smart Assistant</h4>
              <p className="text-text-muted text-sm leading-relaxed">Chat with your notes to clarify concepts, ask questions, and get instant answers.</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="group flex flex-col gap-4 rounded-xl border border-[#cfcfe7] bg-white p-6 transition-all hover:border-primary/50 hover:shadow-soft hover:-translate-y-1">
            <div className="size-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">ios_share</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-text-main text-lg font-bold">Export Ready</h4>
              <p className="text-text-muted text-sm leading-relaxed">Export your summaries to PDF, Markdown, or directly to Notion with one click.</p>
            </div>
          </div>
          {/* Feature 4 */}
          <div className="group flex flex-col gap-4 rounded-xl border border-[#cfcfe7] bg-white p-6 transition-all hover:border-primary/50 hover:shadow-soft hover:-translate-y-1">
            <div className="size-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-text-main text-lg font-bold">Privacy First</h4>
              <p className="text-text-muted text-sm leading-relaxed">Your data is encrypted and secure. We never train our models on your private documents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-10 bg-white border-y border-[#e7e7f3]" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-4">From PDF to A+ in 3 steps</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Stop highlighting everything. Let AI identify what actually matters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10"></div>
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-24 rounded-2xl bg-white border border-gray-100 shadow-lg flex items-center justify-center mb-4 relative z-10">
                <span className="material-symbols-outlined text-[40px] text-blue-500">upload_file</span>
                <div className="absolute -top-3 -right-3 size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">1</div>
              </div>
              <h3 className="text-xl font-bold text-text-main">Upload Documents</h3>
              <p className="text-text-muted text-sm max-w-[280px]">Drag and drop your course slides, textbooks, or research papers.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-24 rounded-2xl bg-white border border-gray-100 shadow-lg flex items-center justify-center mb-4 relative z-10">
                <span className="material-symbols-outlined text-[40px] text-purple-500">tune</span>
                <div className="absolute -top-3 -right-3 size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">2</div>
              </div>
              <h3 className="text-xl font-bold text-text-main">Choose Output</h3>
              <p className="text-text-muted text-sm max-w-[280px]">Select between summary, flashcards, or quiz mode depending on your needs.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-24 rounded-2xl bg-white border border-gray-100 shadow-lg flex items-center justify-center mb-4 relative z-10">
                <span className="material-symbols-outlined text-[40px] text-emerald-500">download_done</span>
                <div className="absolute -top-3 -right-3 size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">3</div>
              </div>
              <h3 className="text-xl font-bold text-text-main">Export or Chat</h3>
              <p className="text-text-muted text-sm max-w-[280px]">Download your polished notes or chat with the AI to drill down on specifics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-4">Built for every study scenario</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
            <div className="mb-4 inline-flex p-2 bg-white rounded-lg shadow-sm text-primary">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Exam Prep</h3>
            <p className="text-text-muted text-sm">Condense semester-long courses into 5-page cheat sheets.</p>
          </div>
          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
            <div className="mb-4 inline-flex p-2 bg-white rounded-lg shadow-sm text-orange-500">
              <span className="material-symbols-outlined">timer</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Last-minute Revision</h3>
            <p className="text-text-muted text-sm">Quickly extract key definitions and formulas minutes before the test.</p>
          </div>
          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
            <div className="mb-4 inline-flex p-2 bg-white rounded-lg shadow-sm text-pink-500">
              <span className="material-symbols-outlined">slideshow</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Presentations</h3>
            <p className="text-text-muted text-sm">Turn research papers into bullet points for your slide deck.</p>
          </div>
          {/* Card 4 */}
          <div className="p-6 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
            <div className="mb-4 inline-flex p-2 bg-white rounded-lg shadow-sm text-cyan-500">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">Assignments</h3>
            <p className="text-text-muted text-sm">Understand complex topics faster to write better essays.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-10 pb-20">
        <div className="max-w-7xl mx-auto rounded-3xl bg-primary relative overflow-hidden px-6 py-20 text-center shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight max-w-2xl">
              Start preparing smarter today
            </h2>
            <p className="text-blue-100 text-lg md:text-xl max-w-xl">
              Join 10,000+ students who have switched to AI Study Notes. Get your first summary for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => router.push('/signup')}
                className="flex items-center justify-center rounded-lg h-14 px-8 bg-white text-primary text-lg font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Create Free Account
              </button>
              <button
                onClick={scrollToFeatures}
                className="flex items-center justify-center rounded-lg h-14 px-8 bg-primary-dark/30 text-white border border-white/20 text-lg font-bold hover:bg-primary-dark/50 transition-all"
              >
                View Pricing
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-4">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-light border-t border-[#e7e7f3] pt-16 pb-8">
        <div className="px-4 md:px-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-text-main">
                <span className="material-symbols-outlined text-primary">auto_stories</span>
                <h2 className="text-lg font-bold">AI Study Notes</h2>
              </div>
              <p className="text-text-muted text-sm max-w-xs">
                Empowering students with AI tools to learn faster, retain more, and stress less.
              </p>
              <div className="flex gap-4 mt-2">
                <a className="text-text-muted hover:text-primary" href="#"><span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
                <a className="text-text-muted hover:text-primary" href="#"><span className="sr-only">GitHub</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path></svg></a>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-text-main text-sm">Product</h3>
              <a className="text-text-muted text-sm hover:text-primary" href="#features">Features</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#pricing">Pricing</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#how-it-works">Integration</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Changelog</a>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-text-main text-sm">Company</h3>
              <a className="text-text-muted text-sm hover:text-primary" href="#">About</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Blog</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Careers</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Contact</a>
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-text-main text-sm">Legal</h3>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Privacy</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Terms</a>
              <a className="text-text-muted text-sm hover:text-primary" href="#">Security</a>
            </div>
          </div>
          <div className="border-t border-[#e7e7f3] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-muted text-sm">© 2024 AI Study Notes. All rights reserved.</p>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
