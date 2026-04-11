import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle, Clock } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/landlord-wont-fix-boiler#webpage',
      url: 'https://repairletter.co.uk/landlord-wont-fix-boiler',
      name: "Landlord Won't Fix Boiler? Your Rights UK 2026 | RepairLetter",
      description: "Landlord won't fix the boiler? Under s.11 LTA 1985, they must repair it within 24–48 hours in winter. Send a legal letter in 60 seconds — £4.99.",
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: "Landlord Won't Fix Boiler", item: 'https://repairletter.co.uk/landlord-wont-fix-boiler' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
    },
    {
      '@type': 'HowTo',
      name: "What to Do When Your Landlord Won't Fix the Boiler",
      description: 'Step-by-step guide to getting your boiler repaired when your landlord refuses to act.',
      totalTime: 'PT2D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Send a formal repair letter immediately', text: 'Cite s.11(1)(c) LTA 1985 and the HHSRS Excess Cold hazard. Demand repair within 24–48 hours.' },
        { '@type': 'HowToStep', position: 2, name: 'Contact environmental health if no response', text: 'No heating is an emergency. Contact your local council immediately — they can require emergency action within 24 hours.' },
        { '@type': 'HowToStep', position: 3, name: 'Keep receipts for alternative heating', text: 'Electric heaters, temporary accommodation costs — keep all receipts for your compensation claim.' },
        { '@type': 'HowToStep', position: 4, name: 'Claim compensation', text: 'Your landlord owes you compensation for every day without heating. Document the period, the costs, and the health impact.' },
      ],
    },
    {
      '@type': 'Article',
      headline: "Landlord Won't Fix Boiler: Your Legal Rights UK 2026",
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: "Complete guide to what UK tenants can do when their landlord refuses to fix a broken boiler — legal rights, emergency action, compensation, and escalation.",
      mainEntityOfPage: 'https://repairletter.co.uk/landlord-wont-fix-boiler',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Boiler Repair Rights Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Excess Cold', description: 'HHSRS Hazard 2 — inadequate heating or insulation leading to cold homes. A Category 1 hazard in winter triggering a council duty to act.' },
        { '@type': 'DefinedTerm', name: 'Space Heating', description: 'Under s.11(1)(c) LTA 1985, landlords must keep installations for space heating in repair and proper working order. Boilers are the primary example.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: "Is my landlord legally required to fix the boiler?", a: "Yes. Under s.11(1)(c) of the Landlord and Tenant Act 1985, your landlord must keep in repair and proper working order the installations for space heating and heating water. This covers the boiler, radiators, and central heating system. The obligation is absolute — your landlord cannot argue that the boiler is old, that they didn't cause the breakdown, or that repairs are expensive. Once you give written notice of the failure, they must repair it within a reasonable time." },
  { q: "How quickly must my landlord fix the boiler?", a: "A complete boiler failure leaving a property without heating or hot water is an emergency requiring urgent action. In cold weather (typically October to April), or where vulnerable people — children, elderly, those with health conditions — are present, the standard is 24 to 48 hours. In milder conditions, 48 to 72 hours. If your landlord has not responded within 24 hours of your written notice in winter, contact environmental health immediately." },
  { q: "What if my landlord says the boiler is too old to fix?", a: "Your landlord's obligation under s.11 is to keep the heating installation in repair and proper working order — this means it must actually work. If the boiler is beyond economic repair, your landlord must replace it. The age of the boiler is not a defence. A landlord who refuses to replace a failed boiler because it is too old is in breach of s.11." },
  { q: "Can I contact environmental health about a broken boiler?", a: "Yes. A broken boiler in cold weather is classified as an Excess Cold hazard under the HHSRS — potentially a Category 1 hazard requiring council enforcement action. Contact your local council's environmental health department immediately. They can require your landlord to carry out emergency repairs and, if necessary, arrange for the works themselves and recover the cost from the landlord." },
  { q: "Can I claim compensation if my landlord won't fix the boiler?", a: "Yes. If your landlord fails to repair the boiler within a reasonable time after written notice, you can claim compensation for: inconvenience and discomfort; costs of alternative heating (electric heaters, fan heaters); costs of alternative hot water (electric shower, kettles); any health impact caused by cold; costs of alternative accommodation if the property became uninhabitable. Keep all receipts and records of the period without heating." },
  { q: "Can I get a repair done myself and deduct the cost from rent?", a: "Repair and deduct is legally available in some circumstances but carries significant risk. You must first give your landlord written notice and a reasonable time to act. The repair must fall within s.11 obligations. You must notify your landlord before deducting and provide evidence of the cost. Without following the correct procedure, deducting rent exposes you to eviction proceedings for rent arrears. Seek advice from Citizens Advice first." },
  { q: "What should I include in a letter about a broken boiler?", a: "Your letter should include: date the boiler failed; whether there is no heating, no hot water, or both; any vulnerable occupants — children, elderly, those with health conditions; the temperature in the property if you can measure it; a demand for repair within 24 to 48 hours citing s.11(1)(c) LTA 1985 and the HHSRS Excess Cold hazard; a statement that you will contact environmental health if not responded to within the deadline. RepairLetter generates this automatically." },
  { q: "What is the HHSRS Excess Cold hazard?", a: "Excess Cold is Hazard Category 2 under the HHSRS — the inability of a property to maintain a safe indoor temperature due to inadequate heating or insulation. A complete boiler failure in winter creates an Excess Cold hazard. If environmental health classifies it as Category 1, they have a statutory duty to take enforcement action against your landlord." },
  { q: "Can my landlord evict me for complaining about the boiler?", a: "From 1 May 2026, Section 21 no-fault evictions are abolished. Your landlord cannot evict you for requesting boiler repairs. Before that date, the Deregulation Act 2015 provides some protection against retaliatory eviction within six months of a formal repair complaint." },
  { q: "What if my boiler breaks over Christmas or a bank holiday?", a: "Your landlord's obligation exists 365 days a year. A boiler breakdown over Christmas does not give your landlord a longer repair window — if anything, winter breakdowns are treated as more urgent. Document the date of failure, send your repair notice immediately (email is sufficient for speed), and contact emergency environmental health services if no response within 24 hours." },
  { q: "Does my landlord have to provide alternative heating while the boiler is being fixed?", a: "There is no absolute legal duty to provide alternative heating, but failing to do so while your property is cold and repairs are delayed strengthens your discomfort and inconvenience claim. You can purchase portable heaters and claim the cost from your landlord. Some councils' environmental health departments will require landlords to provide temporary heating as part of enforcement action." },
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

export function LandlordWontFixBoilerPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Landlord Won't Fix Boiler? Your Rights UK 2026 | RepairLetter</title>
        <meta name="description" content="Landlord won't fix your boiler? Under s.11 LTA 1985, they must act within 24–48 hours in winter. Legal letter with HHSRS Excess Cold citation in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/landlord-wont-fix-boiler" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/landlord-wont-fix-boiler" />
        <meta property="og:title" content="Landlord Won't Fix Boiler? Your Rights UK 2026 | RepairLetter" />
        <meta property="og:description" content="Landlord won't fix the boiler? They must act within 24–48 hours in winter under s.11 LTA 1985. Legal letter in 60 seconds." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Landlord Won't Fix Boiler? Your Rights UK 2026" />
        <meta name="twitter:description" content="Landlord ignoring broken boiler? 24–48 hour legal obligation. Send your notice now." />
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
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <p id="quick-answer" className="text-amber-400 text-xs uppercase tracking-widest font-semibold">Emergency — Act Within 24 Hours</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Landlord Won't Fix the Boiler?
          <br />
          <span className="text-shield-mid">They Have 24–48 Hours.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Under s.11(1)(c) of the Landlord and Tenant Act 1985, your landlord must keep the boiler and central heating in repair and proper working order. A complete failure in winter is an HHSRS Excess Cold emergency. Give formal written notice now — your landlord's clock starts the moment they receive it.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send your boiler repair notice — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>s.11(1)(c) LTA 1985</span><span className="text-white/15">·</span>
        <span>HHSRS Excess Cold</span><span className="text-white/15">·</span>
        <span>24–48 hour obligation</span><span className="text-white/15">·</span>
        <span>Compensation rights</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <div className="bg-white border border-amber-200 bg-amber-50 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">This Is a Legal Emergency — Act Now</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                A complete boiler failure leaving a property without heating or hot water is one of the most time-critical housing emergencies. In cold weather, particularly where children, elderly people, or those with respiratory or cardiovascular conditions are present, the HHSRS classifies this as an Excess Cold hazard — potentially Category 1, triggering a council duty to act.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Your landlord's obligation under s.11(1)(c) LTA 1985 is clear: they must keep the installations for space heating and hot water in repair and proper working order. A boiler that does not work is not in proper working order. Once you give written notice, they must act.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                {[
                  { time: '24 hrs', label: 'Emergency repairs must begin (winter, vulnerable occupants)' },
                  { time: '48 hrs', label: 'Standard emergency — any boiler failure without heating or hot water' },
                  { time: '14 days', label: 'Maximum for non-emergency heating defects' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-shield mb-1">{item.time}</p>
                    <p className="text-xs text-slate leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Your Rights — The Full Legal Picture</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  law: 's.11(1)(c) LTA 1985',
                  title: 'Landlord must keep heating in repair and working order',
                  desc: 'The primary obligation. Covers the boiler, central heating system, radiators, pipework, and controls. The landlord cannot argue age, cost, or fault. If it is broken, they must repair or replace it within a reasonable time after notice.',
                },
                {
                  law: 'HHSRS — Excess Cold',
                  title: 'No heating is a Category 1 hazard in winter',
                  desc: 'A property without heating in cold weather qualifies as an Excess Cold hazard under the HHSRS. If classified as Category 1, your council has a statutory duty to take enforcement action against your landlord — including emergency remedial works.',
                },
                {
                  law: 'Decent Homes Standard',
                  title: 'Thermal comfort is a minimum legal requirement from May 2026',
                  desc: 'From 1 May 2026, the Decent Homes Standard requires private rental properties to have effective heating capable of maintaining safe indoor temperatures. A broken boiler is a direct failure of this standard.',
                },
                {
                  law: 'Homes Act 2018',
                  title: 'A cold home may not be fit for human habitation',
                  desc: 'Under s.9A LTA 1985 (Homes Act 2018), a property without working heating during cold weather may not be fit for human habitation — particularly with young children, elderly occupants, or anyone with health conditions present.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest bg-shield/10 text-shield font-bold px-2 py-0.5 rounded-full">{item.law}</span>
                  </div>
                  <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What to Do Right Now — Step by Step</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', time: 'Immediately', title: 'Send a formal written notice', desc: 'A formal repair letter citing s.11(1)(c) LTA 1985, HHSRS Excess Cold, and the Homes Act 2018. State the date the boiler failed, that there is no heating or hot water, and demand repair within 24 to 48 hours. RepairLetter generates this in 60 seconds.', urgent: true },
                { step: '2', time: 'Same day if no response', title: 'Contact environmental health', desc: 'A broken boiler in winter is an emergency. Contact your local council\'s environmental health department the same day if your landlord has not responded. They can require emergency action.', urgent: true },
                { step: '3', time: 'Ongoing', title: 'Keep records of costs and health impact', desc: 'Note the temperature in your home. Keep receipts for electric heaters, hot water bottles, extra blankets, hotel accommodation if you had to leave. Note any health effects — GP visits, medication. All of this supports your compensation claim.', urgent: false },
                { step: '4', time: 'After repairs', title: 'Claim compensation', desc: 'Your landlord owes you compensation for every day the boiler was broken after you gave notice. This includes inconvenience, discomfort, costs incurred, and any health impact. Apply to the First-tier Tribunal or county court with your evidence pack.', urgent: false },
              ].map((item) => (
                <div key={item.step} className={`bg-white border rounded-xl p-5 ${item.urgent ? 'border-amber-200' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${item.urgent ? 'bg-amber-500' : 'bg-shield'}`}>{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                        <span className="text-[10px] uppercase tracking-widest bg-navy text-white/60 px-2 py-0.5 rounded-full">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/no-heating-rental-property-rights', title: 'No Heating in Rental Property', desc: 'Full guide to heating failure rights — boiler, radiators, and the HHSRS Excess Cold hazard.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'The formal notice your landlord\'s repair obligation depends on.' },
                { to: '/how-to-report-landlord-to-council', title: 'Report to the Council', desc: 'Environmental health emergency action for boiler failures.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide from letter to tribunal to court.' },
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
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-4">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">24–48 hour emergency obligation in winter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Send the Notice. Start the Clock.</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Your landlord's 24–48 hour obligation begins when they receive written notice. RepairLetter generates the correct legal notice in 60 seconds — citing s.11(1)(c) LTA 1985, HHSRS Excess Cold, and the Homes Act 2018.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send your boiler notice — £4.99 <ArrowRight className="h-4 w-4" />
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
