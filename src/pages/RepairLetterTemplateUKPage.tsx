import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://repairletter.co.uk/#organization',
      name: 'RepairLetter',
      url: 'https://repairletter.co.uk',
      logo: 'https://repairletter.co.uk/logo.png',
      description: 'AI-powered repair letter generator for UK tenants.',
      foundingDate: '2026',
      founder: { '@type': 'Organization', name: 'Autaimate' },
      contactPoint: { '@type': 'ContactPoint', email: 'hello@repairletter.co.uk', contactType: 'customer service' },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://repairletter.co.uk/repair-letter-template-uk#webpage',
      url: 'https://repairletter.co.uk/repair-letter-template-uk',
      name: 'Repair Letter Template UK 2026 — Better Than a Template | RepairLetter',
      description: 'Free repair letter templates exist — but RepairLetter generates a better letter: AI-powered, photo evidence attached, three UK statutes cited, sent automatically. £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Repair Letter Template UK', item: 'https://repairletter.co.uk/repair-letter-template-uk' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
      description: 'AI-powered repair letter generator — better than a template because it cites the specific HHSRS hazard for your defect, attaches your photos, and sends automatically.',
    },
    {
      '@type': 'Article',
      headline: 'Repair Letter Template UK: Why Generic Templates Fall Short in 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'What a good repair letter template includes, what free templates miss, and why an AI-generated letter with photo evidence is more effective than filling in a Word document.',
      mainEntityOfPage: 'https://repairletter.co.uk/repair-letter-template-uk',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Repair Letter Template Components',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Legal Citation', description: 'Reference to the specific statutory provision creating the landlord\'s repair obligation — s.11 LTA 1985, HHSRS, Homes Act 2018.' },
        { '@type': 'DefinedTerm', name: 'HHSRS Classification', description: 'The specific hazard category under the Housing Health and Safety Rating System that applies to the defect in question.' },
        { '@type': 'DefinedTerm', name: 'Evidence Pack', description: 'The collection of timestamped photographs, letters, and delivery records that support a tenant\'s claim in any subsequent dispute.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'Is there a free repair letter template for UK tenants?', a: 'Yes. Shelter, Citizens Advice, and some local councils provide free repair letter templates that tenants can download and customise. These are Word documents with placeholder text for the tenant\'s name, address, and defect description. They are a starting point, but they have significant limitations: they use generic legal language, cannot identify the specific HHSRS hazard for your defect, do not attach photo evidence, and require you to print, post, or email the letter yourself.' },
  { q: 'What should a repair letter template include?', a: 'A complete repair letter should include: your name and rental address; the date of the letter; a specific description of the defect including location, nature, and duration; citation of s.11 of the Landlord and Tenant Act 1985 and the specific obligation it creates; citation of the HHSRS hazard category applicable to your defect; citation of the Homes (Fitness for Human Habitation) Act 2018; a specific deadline for repair; an escalation warning; and photographic evidence of the defect.' },
  { q: 'What is missing from most free repair letter templates?', a: 'Most free templates miss several critical elements: the specific HHSRS hazard category (which requires AI photo analysis to identify accurately); photo evidence attached to the letter (templates are text-only); automatic delivery tracking; automatic escalation to environmental health after 14 days; and citation of Awaab\'s Law for damp and mould complaints. Templates also require you to send the letter yourself — creating an additional barrier.' },
  { q: 'Why does citing the HHSRS category matter?', a: 'Citing the specific HHSRS hazard category does two things. First, it signals to your landlord that you have an expert assessment of the severity of the defect and are prepared to involve environmental health. Second, it connects your specific problem to a category that your local council has statutory enforcement powers over. A letter that says "your property has a Category 1 HHSRS Damp and Mould Growth hazard" is significantly more compelling than one that says "there is mould in my flat."' },
  { q: 'Can I write a repair letter myself without a template?', a: 'Yes. A repair letter does not have to use any particular form — it just needs to contain the key elements: formal notice of the defect, citation of the relevant legislation, a deadline, and an escalation warning. RepairLetter generates this automatically from your photos and voice description. You review it before it is sent.' },
  { q: 'What makes RepairLetter different from a template?', a: 'RepairLetter generates a personalised legal letter specific to your defect and property, rather than a generic fill-in document. Key differences: AI analyses your photos against 29 HHSRS categories and identifies the specific hazard; the letter cites three UK statutes plus Awaab\'s Law where relevant; your photos are embedded in the branded PDF with timestamps; the letter is emailed to your landlord with delivery tracking; and if your landlord does not respond within 14 days, RepairLetter auto-generates your environmental health complaint.' },
  { q: 'Should I send a repair letter by post or email?', a: 'Email is generally preferred: it creates an immediate timestamp, provides delivery confirmation, and is harder for a landlord to deny receipt of. Post to your landlord\'s address of service is also legally valid — use recorded delivery for proof of posting. RepairLetter sends a branded PDF by email with delivery tracking. Avoid relying solely on text or WhatsApp messages.' },
  { q: 'Does the format of a repair letter matter legally?', a: 'No specific format is required by law. What matters is that the letter constitutes formal written notice of the defect, describes it specifically, and gives your landlord a reasonable time to respond. A hand-typed letter on plain paper is legally as valid as a professionally formatted PDF. However, a professionally formatted letter with specific legal citations is more likely to be taken seriously by your landlord and by any subsequent tribunal or court.' },
  { q: 'Do I need a solicitor to write a repair letter?', a: 'No. A repair letter citing UK housing legislation is within the capacity of any tenant. RepairLetter generates it automatically from your photos and voice description for £4.99. If your landlord continues to ignore you and you need to pursue legal action in the tribunal or court, you may then wish to seek advice from Citizens Advice or a housing solicitor.' },
  { q: 'What is the difference between a repair letter and a legal letter?', a: 'In the context of housing, a repair letter is a legal letter — it invokes specific statutory rights and obligations. The phrase "legal letter" sometimes implies a letter from a solicitor, but this is not a requirement. A formal written repair letter citing s.11 LTA 1985, sent by a tenant or their representative, constitutes formal legal notice regardless of who drafted it.' },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

const TEMPLATE_VS_REPAIRLETTER = [
  { feature: 'Three UK statutes cited', template: false, repairletter: true },
  { feature: 'HHSRS hazard category identified', template: false, repairletter: true },
  { feature: "Awaab's Law cited for damp", template: false, repairletter: true },
  { feature: 'Photo evidence embedded in PDF', template: false, repairletter: true },
  { feature: 'Automatically sent to landlord', template: false, repairletter: true },
  { feature: 'Delivery tracking', template: false, repairletter: true },
  { feature: '14-day deadline auto-tracked', template: false, repairletter: true },
  { feature: 'Auto-escalation after 14 days', template: false, repairletter: true },
  { feature: 'Timestamped evidence pack', template: false, repairletter: true },
  { feature: 'SHA-256 integrity verification', template: false, repairletter: true },
  { feature: 'Works in 50+ languages', template: false, repairletter: true },
  { feature: 'Generic legal language', template: true, repairletter: false },
  { feature: 'Requires manual sending', template: true, repairletter: false },
  { feature: 'Free', template: true, repairletter: false },
];

export function RepairLetterTemplateUKPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Repair Letter Template UK 2026 — Better Than a Template | RepairLetter</title>
        <meta name="description" content="Free repair letter templates exist — but RepairLetter generates a better letter: AI photo analysis, HHSRS citation, three UK statutes, photo evidence, auto-sent. £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/repair-letter-template-uk" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/repair-letter-template-uk" />
        <meta property="og:title" content="Repair Letter Template UK 2026 — Better Than a Template | RepairLetter" />
        <meta property="og:description" content="Free templates exist but miss HHSRS classification, photo evidence, and auto-delivery. RepairLetter does all of it for £4.99." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Repair Letter Template UK 2026 — Better Than a Template" />
        <meta name="twitter:description" content="Free templates miss HHSRS, photos, and auto-sending. RepairLetter does it all for £4.99." />
        <meta name="twitter:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta name="author" content="RepairLetter — Autaimate" />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <header className="px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </Link>
        </div>
        <nav className="mb-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">← Back to RepairLetter</Link>
        </nav>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Why Templates Aren't Enough in 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Repair Letter Template UK?
          <br />
          <span className="text-shield-mid">RepairLetter Does More.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Free repair letter templates from Shelter and Citizens Advice are a starting point — but they cannot identify your HHSRS hazard category, attach your photos, or send the letter for you. RepairLetter generates a legally stronger, evidence-backed letter in 60 seconds for £4.99.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Generate your legal letter — £4.99 <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </SignedIn>
      </header>

      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest flex-wrap">
        <span>HHSRS Classification</span><span className="text-white/15">·</span>
        <span>Photo Evidence</span><span className="text-white/15">·</span>
        <span>Auto-Sent</span><span className="text-white/15">·</span>
        <span>50+ Languages</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">What a Good Repair Letter Must Include</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Most free templates cover the basics — your name, the address, a description of the defect, and a citation of s.11 LTA 1985. That is a starting point. But in 2026, with Awaab's Law, the Renters' Rights Act 2025, and the HHSRS in play, a complete repair letter needs to do more.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Specific HHSRS hazard classification', desc: 'Not just "there is mould" but "HHSRS Hazard 1 — Damp and Mould Growth." This connects your problem to a category that gives your council statutory enforcement powers. Requires AI photo analysis to identify accurately.' },
                { title: "Awaab's Law citation for damp and mould", desc: "Where relevant, the letter should cite Awaab's Law and the 14-day acknowledgement timescale. Free templates do not do this." },
                { title: 'Three UK statutes, not one', desc: 's.11 LTA 1985 is the core, but HHSRS (Housing Act 2004) and s.9A LTA 1985 (Homes Act 2018) add further legal grounds. Citing all three demonstrates legal knowledge and leaves your landlord with fewer arguments.' },
                { title: 'Photo evidence embedded in the PDF', desc: 'A letter without photos is a claim without proof. Photos embedded in the PDF letter — timestamped and integrity-verified — are far more compelling than photos sent separately.' },
                { title: 'Automatic delivery and a tracked deadline', desc: 'A letter that arrives in your landlord\'s inbox with read confirmation, and a 14-day deadline that is automatically tracked, changes the dynamic. Your landlord knows you know when the deadline expires.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Template vs RepairLetter — Side by Side</h2>
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-navy text-white text-xs font-semibold">
                <div className="p-3">Feature</div>
                <div className="p-3 text-center">Free template</div>
                <div className="p-3 text-center text-shield-mid">RepairLetter</div>
              </div>
              {TEMPLATE_VS_REPAIRLETTER.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 border-t border-border ${i % 2 === 0 ? 'bg-white' : 'bg-surface/30'}`}>
                  <div className="p-3 text-xs text-slate">{row.feature}</div>
                  <div className="p-3 text-center">{row.template ? <span className="text-shield font-bold">✓</span> : <span className="text-slate/30 text-xs">—</span>}</div>
                  <div className="p-3 text-center">{row.repairletter ? <span className="text-shield font-bold">✓</span> : <span className="text-slate/30 text-xs">—</span>}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'What to Include in a Repair Letter', desc: 'Complete guide to the elements that make a repair letter legally effective.' },
                { to: '/landlord-repair-obligations-uk', title: 'Full Repair Obligations Guide', desc: 'Understanding the law behind every repair letter citation.' },
                { to: '/hhsrs-complaint-letter', title: 'HHSRS Complaint Letter', desc: 'How the HHSRS classification strengthens your letter.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Escalation steps when the letter is ignored.' },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="bg-white border border-border rounded-xl p-4 hover:border-shield/40 transition-colors">
                  <h3 className="text-sm font-bold text-navy mb-1">{link.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (<FaqItem key={i} question={faq.q} answer={faq.a} />))}
            </div>
          </section>

          <section className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-shield/10 border border-shield/20 rounded-full px-4 py-2 mb-4">
              <Shield className="h-4 w-4 text-shield-mid" />
              <span className="text-xs text-shield-mid font-medium">Better than any template — AI-powered, photo-evidenced, auto-sent</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Your Strongest Possible Repair Letter</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Photo your defect. Describe it by voice. A legally robust letter citing the specific HHSRS hazard for your problem, with your photos embedded, is sent to your landlord in 60 seconds.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Generate your legal letter — £4.99 <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate('/dashboard')} className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </SignedIn>
          </section>
        </div>
      </div>

      <footer className="bg-navy border-t border-white/5 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-shield-mid" />
            <span className="text-base font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-md">
            RepairLetter generates correspondence based on UK housing legislation. It does not constitute legal advice. For specific legal guidance, contact Citizens Advice, Shelter, or a qualified solicitor.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">Home</Link>
            <Link to="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-white/15 mt-6">© {new Date().getFullYear()} RepairLetter · Autaimate · ICO Registered · UK GDPR Compliant</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-semibold text-navy pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-slate flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
