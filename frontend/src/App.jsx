import React, { useState, useMemo } from "react";
import {
  ArrowRight, Search, Package, Truck, CheckCircle2, Circle, Clock, ShieldCheck,
  Globe2, Zap, Building2, Menu, X, ChevronRight, Upload, MapPin, Phone, Mail,
  FileText, MessageSquare, Bell, Settings, LogOut, LayoutGrid, ClipboardList,
  Receipt, CreditCard, Users, Wrench, BarChart3, AlertTriangle, Star, Plus,
  Sparkles, Wallet, ChevronDown, Filter, TrendingDown, Award, ShoppingCart, PackageCheck, HandHeart, Layers, Sun, Moon,
  Image as ImageIcon, Palette, Trash2
} from "lucide-react";
import { api } from "./lib/api.js";

/* ---------------------------------------------------------------------- */
/* DEMO DATA                                                              */
/* ---------------------------------------------------------------------- */

const CUSTOMERS = [
  { id: "c1", name: "James Mwangi", email: "james.mwangi@example.com", phone: "+254 712 345 678", type: "Individual" },
  { id: "c2", name: "Aisha Hassan", email: "aisha.hassan@example.com", phone: "+254 733 221 908", type: "Individual" },
  { id: "c3", name: "Brian Otieno", email: "brian.otieno@primeretail.co.ke", phone: "+254 700 556 213", type: "Corporate — Prime Retail Ltd" },
];

const AGENTS = [
  { id: "a1", name: "Collins", active: 6, completed: 41, rating: 4.9 },
  { id: "a2", name: "Brian", active: 4, completed: 33, rating: 4.7 },
  { id: "a3", name: "Mary", active: 5, completed: 52, rating: 4.95 },
];

const SUPPLIERS = [
  { id: "s1", name: "ABC Electronics", category: "Electronics", location: "Nairobi, Nashua Centre", verified: true, reliability: 94, price: 88, delivery: 90, warranty: 92, deals: 118, complaints: 2 },
  { id: "s2", name: "Nairobi Office Solutions", category: "Office Equipment", location: "Nairobi, Westlands", verified: true, reliability: 86, price: 91, delivery: 78, warranty: 80, deals: 76, complaints: 5 },
  { id: "s3", name: "Industrial Supplies Kenya", category: "Industrial Equipment", location: "Nairobi, Industrial Area", verified: true, reliability: 92, price: 83, delivery: 95, warranty: 89, deals: 54, complaints: 1 },
];

const STATUS_META = {
  "Submitted": { color: "grey" }, "Under Review": { color: "blue" }, "Supplier Research": { color: "blue" },
  "Quotation Ready": { color: "orange" }, "Awaiting Approval": { color: "orange" }, "Awaiting Payment": { color: "orange" },
  "Purchased": { color: "blue" }, "Dispatched": { color: "blue" }, "In Transit": { color: "blue" },
  "Delivered": { color: "green" }, "Completed": { color: "green" }, "Cancelled": { color: "grey" }, "Issue Reported": { color: "red" },
};

const REQUESTS = [
  {
    id: "YPM-202609-00127", item: "HP EliteBook 840 G9", customer: "James Mwangi", agent: "Collins",
    status: "In Transit", urgency: "Normal", value: 145000, currency: "KES", created: "2026-09-02",
    steps: [
      ["Request Submitted", true], ["Request Reviewed", true], ["Supplier Research", true],
      ["Quotation Ready", true], ["Customer Approved", true], ["Payment Received", true],
      ["Purchased", true], ["Dispatched", true], ["In Transit", "active"], ["Delivered", false],
    ],
    timeline: [
      ["09:12", "Customer submitted request"], ["09:15", "AI generated procurement specification"],
      ["09:20", "YourPlug reviewed request"], ["09:25", "Agent Collins assigned"],
      ["09:40", "Supplier A contacted"], ["10:05", "Supplier A quotation received"],
      ["10:15", "Supplier B quotation received"], ["10:30", "Supplier comparison completed"],
      ["10:45", "Supplier A recommended"], ["11:00", "Customer approved quotation"],
      ["11:04", "Invoice generated"], ["11:10", "Payment received"], ["11:15", "Purchase order created"],
      ["11:45", "Supplier confirmed order"], ["14:20", "Courier collected package"], ["15:10", "Order in transit"],
    ],
    quotes: [
      { supplier: "ABC Electronics", price: 145000, delivery: "1-day delivery", warranty: "2-year warranty", reliability: 94, score: 91 },
      { supplier: "Nairobi Office Solutions", price: 138500, delivery: "3-day delivery", warranty: "1-year warranty", reliability: 86, score: 79 },
      { supplier: "Industrial Supplies Kenya", price: 151000, delivery: "Same-day delivery", warranty: "2-year warranty", reliability: 92, score: 86 },
    ],
    recommended: "ABC Electronics",
  },
  {
    id: "YPM-202609-00131", item: "Office Chairs (Ergonomic) x12", customer: "Brian Otieno", agent: "Mary",
    status: "Awaiting Approval", urgency: "High", value: 216000, currency: "KES", created: "2026-09-05",
    steps: [
      ["Request Submitted", true], ["Request Reviewed", true], ["Supplier Research", true],
      ["Quotation Ready", true], ["Customer Approved", "active"], ["Payment Received", false],
      ["Purchased", false], ["Dispatched", false], ["In Transit", false], ["Delivered", false],
    ],
    timeline: [
      ["08:40", "Customer submitted request"], ["08:44", "AI generated procurement specification"],
      ["08:50", "Agent Mary assigned"], ["09:30", "3 suppliers contacted"], ["11:15", "Quotations received"],
      ["11:40", "Supplier comparison completed"], ["11:45", "Awaiting customer approval"],
    ],
    quotes: [
      { supplier: "Nairobi Office Solutions", price: 216000, delivery: "4-day delivery", warranty: "2-year warranty", reliability: 86, score: 88 },
    ],
    recommended: "Nairobi Office Solutions",
  },
  {
    id: "YPM-202609-00134", item: "Commercial Display Refrigerator", customer: "Aisha Hassan", agent: "Brian",
    status: "Supplier Research", urgency: "Normal", value: 0, currency: "KES", created: "2026-09-07",
    steps: [
      ["Request Submitted", true], ["Request Reviewed", true], ["Supplier Research", "active"],
      ["Quotation Ready", false], ["Customer Approved", false], ["Payment Received", false],
      ["Purchased", false], ["Dispatched", false], ["In Transit", false], ["Delivered", false],
    ],
    timeline: [
      ["07:55", "Customer submitted request"], ["08:01", "AI generated procurement specification — missing dimensions, voltage, brand preference"],
      ["08:10", "Agent Brian assigned"], ["08:30", "Supplier research started"],
    ],
    quotes: [], recommended: null,
  },
  {
    id: "YPM-202608-00098", item: "Printer Cartridges (HP 305) x20", customer: "James Mwangi", agent: "Collins",
    status: "Completed", urgency: "Normal", value: 42000, currency: "KES", created: "2026-08-14",
    steps: [ ["Request Submitted", true], ["Delivered", true], ["Completed", true] ],
    timeline: [["—", "Delivered and closed. Customer saved KSh 6,000 vs. original quote."]],
    quotes: [], recommended: "ABC Electronics",
  },
  {
    id: "YPM-202609-00140", item: "Industrial Water Pump — 5HP", customer: "Brian Otieno", agent: "Collins",
    status: "Awaiting Payment", urgency: "Emergency", value: 312000, currency: "KES", created: "2026-09-08",
    steps: [
      ["Request Submitted", true], ["Request Reviewed", true], ["Supplier Research", true],
      ["Quotation Ready", true], ["Customer Approved", true], ["Payment Received", "active"],
      ["Purchased", false], ["Dispatched", false], ["In Transit", false], ["Delivered", false],
    ],
    timeline: [
      ["06:10", "Emergency request submitted"], ["06:12", "Flagged for priority handling"],
      ["06:20", "Agent Collins assigned"], ["07:05", "Supplier Industrial Supplies Kenya recommended"],
      ["07:40", "Customer approved"], ["07:42", "Invoice sent — awaiting M-Pesa payment"],
    ],
    quotes: [], recommended: "Industrial Supplies Kenya",
  },
];

const CATEGORIES = ["Office & Business Supplies", "Electronics & Equipment", "Furniture", "Industrial Supplies", "Construction Materials", "Specialized Products", "Professional Services", "Personal Procurement", "Imports on Request"];

/* ---------------------------------------------------------------------- */
/* SHARED UI PRIMITIVES                                                   */
/* ---------------------------------------------------------------------- */

const badgeColors = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  orange: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  grey: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function StatusBadge({ status }) {
  const c = STATUS_META[status]?.color || "grey";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeColors[c]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c === "green" ? "bg-emerald-500" : c === "blue" ? "bg-sky-500" : c === "orange" ? "bg-amber-500" : c === "red" ? "bg-rose-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

function UrgencyTag({ urgency }) {
  if (urgency === "Emergency") return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-rose-600 text-white">EMERGENCY</span>;
  if (urgency === "Urgent") return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-500 text-white">URGENT</span>;
  if (urgency === "High") return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">HIGH</span>;
  return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500">NORMAL</span>;
}

function Money({ value, currency = "KES" }) {
  if (!value) return <span className="text-slate-400">Pending quote</span>;
  return <span>{currency === "KES" ? "KSh " : currency + " "}{value.toLocaleString()}</span>;
}

function PrimaryButton({ children, onClick, className = "", icon: Icon = ArrowRight, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F1C2E] px-5 py-3 text-sm font-medium text-white hover:bg-[#16283f] disabled:opacity-60 transition-colors ${className}`}>
      {children}<Icon size={16} />
    </button>
  );
}
function SecondaryButton({ children, onClick, className = "" }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-[#0F1C2E] hover:bg-slate-50 transition-colors ${className}`}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* PUBLIC SITE                                                            */
/* ---------------------------------------------------------------------- */

function SiteHeader({ nav, setNav, session, setSession }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Home", "home"], ["Services", "services"], ["International", "international"], ["Contact", "contact"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => setNav("home")} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F1C2E] text-white font-semibold text-sm">YP</div>
          <span className="text-[15px] font-semibold tracking-tight text-[#0F1C2E]">YourPlug Management</span>
        </button>
        <nav className="hidden lg:flex items-center gap-6">
          {links.map(([label, key]) => (
            <button key={key} onClick={() => setNav(key)}
              className={`text-sm ${nav === key ? "text-[#0F1C2E] font-medium" : "text-slate-500 hover:text-slate-800"}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => setNav("track")} className="text-sm font-medium text-slate-600 hover:text-[#0F1C2E]">Track My Request</button>
          {session ? (
            <button onClick={() => setNav(session.role === "customer" ? "dashboard" : session.role)}
              className="rounded-lg bg-[#0F8B75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c6f5d]">
              Go to {session.role === "admin" ? "Admin" : session.role === "agent" ? "Agent Portal" : session.role === "supplier" ? "Supplier Portal" : "Dashboard"}
            </button>
          ) : (
            <>
              <button onClick={() => setNav("login")} className="text-sm font-medium text-slate-600 hover:text-[#0F1C2E]">Log in</button>
              <button onClick={() => setNav("register")} className="rounded-lg bg-[#0F1C2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#16283f]">Make a Request</button>
            </>
          )}
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-slate-200 px-6 py-4 space-y-3">
          {links.map(([label, key]) => (
            <button key={key} onClick={() => { setNav(key); setOpen(false); }} className="block text-sm text-slate-600">{label}</button>
          ))}
          <button onClick={() => { setNav("track"); setOpen(false); }} className="block text-sm text-slate-600">Track My Request</button>
          <div className="pt-2 flex gap-3">
            <SecondaryButton onClick={() => { setNav("login"); setOpen(false); }} className="flex-1 py-2">Log in</SecondaryButton>
            <PrimaryButton onClick={() => { setNav("register"); setOpen(false); }} className="flex-1 py-2">Request</PrimaryButton>
          </div>
        </div>
      )}
    </header>
  );
}

/** Renders a real photo with a graceful colored-gradient fallback if the
 *  image URL ever fails to load, so the layout never shows a broken icon. */
function Photo({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-[#0F8B75]/20 via-sky-100 to-amber-100 ${className}`}>
      {!failed && (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}

function SiteFooter({ setNav }) {
  return (
    <footer className="bg-[#0F1C2E] text-slate-300">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0F8B75] via-sky-400 to-amber-400" />
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white font-semibold text-sm">YP</div>
            <span className="text-white font-semibold">YourPlug Management</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xs">Your personal procurement partner. We find it, compare it, buy it, and get it to you.</p>
          <div className="mt-5 flex gap-3">
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-[#0F8B75] transition-colors"><MessageSquare size={15} /></a>
            <a href="tel:" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-[#0F8B75] transition-colors"><Phone size={15} /></a>
            <a href="mailto:" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-[#0F8B75] transition-colors"><Mail size={15} /></a>
          </div>
        </div>
        <div>
          <p className="text-white text-sm font-medium mb-3">Services</p>
          <ul className="space-y-2">
            <li><button onClick={() => setNav("services")} className="text-sm text-slate-400 hover:text-white">Procurement services</button></li>
            <li><button onClick={() => setNav("international")} className="text-sm text-slate-400 hover:text-white">International procurement</button></li>
          </ul>
        </div>
        <div>
          <p className="text-white text-sm font-medium mb-3">Customer</p>
          <ul className="space-y-2">
            <li><button onClick={() => setNav("register")} className="text-sm text-slate-400 hover:text-white">Make a Request</button></li>
            <li><button onClick={() => setNav("track")} className="text-sm text-slate-400 hover:text-white">Track My Request</button></li>
            <li><button onClick={() => setNav("login")} className="text-sm text-slate-400 hover:text-white">Log in</button></li>
            <li><button onClick={() => setNav("contact")} className="text-sm text-slate-400 hover:text-white">Contact</button></li>
          </ul>
        </div>
        <div>
          <p className="text-white text-sm font-medium mb-3">Legal</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Terms & Conditions</li><li>Privacy Policy</li><li>Refund Policy</li><li>Procurement Service Agreement</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">© 2026 YourPlug Management, Nairobi, Kenya. All rights reserved.</div>
    </footer>
  );
}

function Section({ children, className = "" }) {
  return <section className={`mx-auto max-w-7xl px-6 py-20 ${className}`}>{children}</section>;
}
function Eyebrow({ children, color = "text-[#0F8B75]" }) {
  return <p className={`text-sm font-semibold tracking-wide mb-3 ${color}`}>{children}</p>;
}

const HOW_IT_WORKS = [
  [MessageSquare, "Tell Us", "Describe what you need — in plain language, with a photo, or a link.", "bg-[#0F8B75]"],
  [HandHeart, "We Handle It", "We source, compare and arrange everything behind the scenes.", "bg-sky-500"],
  [CheckCircle2, "You Approve", "We check in only when we need your approval or payment.", "bg-amber-500"],
  [PackageCheck, "We Complete It", "We coordinate delivery and follow through until it's done.", "bg-[#0F8B75]"],
];

const WHY_CARDS = [
  [Clock, "Time saved", "Stop spending hours searching through suppliers and websites.", "bg-[#0F8B75]"],
  [TrendingDown, "Supplier comparison", "We compare available options before recommending a purchase.", "bg-sky-500"],
  [Search, "Local supplier sourcing", "We identify suitable local suppliers that match your requirements.", "bg-amber-500"],
  [PackageCheck, "Procurement coordination", "We help coordinate the whole process, end to end.", "bg-[#0F8B75]"],
  [ShieldCheck, "Quality-focused sourcing", "We prioritize suppliers on reliability and quality, not just price.", "bg-sky-500"],
  [HandHeart, "Transparent quotations", "You see the full procurement breakdown before you approve anything.", "bg-amber-500"],
];

function HomePage({ setNav, siteSettings = {} }) {
  return (
    <>
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#0F1C2E] via-[#0F1C2E] to-[#0c3b34]">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <Section className="relative py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-4 tracking-wide">Your Personal Concierge Partner</p>
            <h1 className="text-5xl font-semibold tracking-tight text-white leading-[1.08]">We source, arrange and get things done for you.</h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg">From sourcing quality goods and services to arranging purchases, deliveries and specialized requests, YourPlug handles the details for you.</p>
            <div className="mt-6 rounded-lg bg-white/5 border border-white/10 px-4 py-3 max-w-lg">
              <p className="text-sm text-slate-300">Serving clients across Kenya, with international sourcing and imports available on request.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryButton onClick={() => setNav("register")} className="!bg-[#0F8B75] hover:!bg-[#0c6f5d]">Make a Request</PrimaryButton>
              <button onClick={() => setNav("services")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">Explore Services</button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-amber-300" /> Verified suppliers</div>
              <div className="flex items-center gap-1.5"><Clock size={16} className="text-amber-300" /> Transparent process</div>
            </div>
          </div>
          <div className="relative h-[420px] hidden sm:block">
            <Photo src={siteSettings.hero_image_1 || "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=700&q=70"} alt="Concierge partner at work"
              className="absolute top-0 right-0 w-72 h-80 rounded-2xl shadow-2xl rotate-2" />
            <Photo src={siteSettings.hero_image_2 || "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=500&q=70"} alt="Delivery package"
              className="absolute bottom-0 left-0 w-52 h-52 rounded-2xl shadow-2xl -rotate-3" />
            <div className="absolute top-10 left-0 w-64 rounded-xl bg-white p-4 shadow-xl">
              <p className="text-[11px] text-slate-400 mb-2">YPM-202609-00127 · HP EliteBook</p>
              <div className="flex items-center gap-2 text-sm text-[#0F1C2E] font-medium"><Circle size={14} className="text-amber-500 fill-amber-500" /> On the way</div>
            </div>
            <div className="absolute bottom-8 right-6 rounded-xl bg-white px-4 py-3 shadow-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#0F8B75]" /><span className="text-xs font-medium text-[#0F1C2E]">No action needed</span>
            </div>
          </div>
        </Section>
      </div>

      <Section className="text-center max-w-3xl">
        <p className="text-xl text-slate-700 leading-relaxed">Tell us what you need. We'll handle the rest.</p>
      </Section>

      <Section className="bg-gradient-to-br from-sky-50 via-white to-[#0F8B75]/5 rounded-3xl">
        <Eyebrow>What can we help you with?</Eyebrow>
        <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-xl">Tell us what you need — a product, service, errand, arrangement, or something hard to find.</h2>
        <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">What do you need?</p>
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-slate-400 text-sm mb-3">e.g. "I need 20 office chairs delivered to my office in Nairobi."</div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={() => setNav("register")}>Make a Request</PrimaryButton>
            <SecondaryButton onClick={() => setNav("register")}><Upload size={15} className="inline mr-1" /> Upload a photo or document</SecondaryButton>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-400 uppercase tracking-wide">A few examples — not restrictive categories</p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {["Source a product", "Arrange a service", "Find something hard to source", "Business request", "Personal request", "Import on request"].map((c, i) => (
            <button key={c} onClick={() => setNav("register")} className={`rounded-xl px-4 py-5 text-sm font-medium text-left hover:-translate-y-0.5 transition-transform ${["bg-[#0F8B75]/10 text-[#0F8B75]", "bg-sky-100 text-sky-700", "bg-amber-100 text-amber-700"][i % 3]}`}>{c}</button>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-xl">A managed process, start to finish.</h2>
        <div className="mt-14 relative">
          <div className="hidden lg:block absolute top-7 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F8B75] via-sky-400 to-amber-400" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(([Icon, title, body, bg], i) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full ${bg} text-white shadow-md`}><Icon size={22} /></div>
                <p className="mt-4 text-xs font-medium text-slate-400">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-medium text-[#0F1C2E]">{title}</p>
                <p className="text-xs text-slate-500 mt-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-[#0F1C2E] rounded-3xl">
        <Eyebrow color="text-amber-300">Why YourPlug</Eyebrow>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {WHY_CARDS.map(([Icon, title, body, bg]) => (
            <div key={title} className="rounded-2xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg} text-white mb-4`}><Icon size={20} /></div>
              <p className="font-medium text-white">{title}</p>
              <p className="text-sm mt-1 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center"><PrimaryButton onClick={() => setNav("register")} className="!bg-[#0F8B75] hover:!bg-[#0c6f5d]">Make a Request</PrimaryButton></div>
      </Section>
    </>
  );
}

function ServicesPage({ setNav, publicServices = [] }) {
  const fallbackCards = [
    [Package, "Personal procurement", "Everyday purchases sourced and delivered without the legwork.", "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=70"],
    [Building2, "Business procurement", "Multi-user accounts, spending visibility and monthly statements for organizations.", "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=700&q=70"],
    [Search, "Supplier sourcing", "We identify suitable local suppliers based on your requirements.", "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=70"],
    [Layers, "Bulk procurement", "Sourcing larger quantities for offices, sites and organizations.", "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=700&q=70"],
    [Zap, "Urgent procurement", "Priority handling for time-sensitive requirements.", "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=700&q=70"],
    [PackageCheck, "Logistics & delivery coordination", "We coordinate delivery after the purchase is made.", "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=70"],
  ];
  const cards = publicServices.length > 0
    ? publicServices.map(s => [Package, s.name, s.description, s.imageUrl])
    : fallbackCards;
  return (
    <>
      <Section>
        <Eyebrow>Services</Eyebrow>
        <h1 className="text-4xl font-semibold text-[#0F1C2E] max-w-2xl">Local procurement for goods, equipment and services.</h1>
        <p className="mt-4 text-slate-600 max-w-2xl">Local procurement is our core focus — sourcing quality goods and services from suppliers here in Kenya, compared and coordinated for you.</p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(([Icon, title, body, img]) => (
            <div key={title} className="group relative rounded-2xl overflow-hidden h-56 shadow-sm hover:shadow-lg transition-shadow">
              <Photo src={img} alt={title} className="absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1C2E]/90 via-[#0F1C2E]/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-6">
                <Icon size={18} className="text-amber-300 mb-2" />
                <p className="font-medium text-white">{title}</p>
                <p className="text-xs text-slate-200 mt-1">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-[#0F1C2E] rounded-3xl text-white">
        <Eyebrow color="text-sky-300">International sourcing & imports on request</Eyebrow>
        <h2 className="text-2xl font-semibold max-w-2xl">A secondary service, available when you need it.</h2>
        <p className="mt-4 text-slate-300 max-w-2xl">While our primary focus is local procurement, customers can request products or equipment that need to be sourced internationally. YourPlug can coordinate the sourcing and import process where applicable, including an estimated landed cost before you commit to anything.</p>
        <button onClick={() => setNav("international")} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-amber-300">Learn more about imports <ChevronRight size={14} /></button>
      </Section>

      <Section className="grid lg:grid-cols-3 gap-6">
        {[["Who we serve", "Individuals, entrepreneurs, SMEs and businesses — the same platform and process for everyone."], ["Why YourPlug", "Quality-focused sourcing, transparent quotations, and one procurement partner instead of ten open conversations."], ["About YourPlug", "A Kenyan procurement technology company combining trained staff with technology that keeps every request transparent."]].map(([t, b]) => (
          <div key={t} className="rounded-2xl bg-slate-50 border border-slate-200 p-6"><p className="font-medium text-[#0F1C2E]">{t}</p><p className="text-sm text-slate-600 mt-2">{b}</p></div>
        ))}
      </Section>

      <Section className="grid lg:grid-cols-2 gap-12 items-center">
        <Photo src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=70" alt="YourPlug procurement team" className="rounded-2xl h-80 shadow-lg" />
        <div>
          <Eyebrow color="text-amber-600">About YourPlug</Eyebrow>
          <h2 className="text-2xl font-semibold text-[#0F1C2E] max-w-lg">Technology powered, human managed.</h2>
          <p className="mt-4 text-slate-600 max-w-xl">Procurement shouldn't be stressful. YourPlug Management combines trained procurement staff with technology that keeps every request transparent, from the first message to final delivery. No browsing listings, no chasing suppliers — you tell us once, we bring back one clear recommendation, and you approve before anything is purchased.</p>
        </div>
      </Section>

      <Section className="bg-[#0F8B75] rounded-3xl text-white">
        <Eyebrow color="text-amber-200">Contact</Eyebrow>
        <h2 className="text-2xl font-semibold">Talk to YourPlug directly.</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <a href="#" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><MessageSquare size={18} /><span className="text-sm font-medium">WhatsApp</span></a>
          <a href="tel:" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><Phone size={18} /><span className="text-sm font-medium">Call us</span></a>
          <a href="mailto:" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><Mail size={18} /><span className="text-sm font-medium">Email</span></a>
        </div>
        <p className="mt-4 text-xs text-emerald-100">Contact details shown here are placeholders until YourPlug's real business contact information is configured.</p>
      </Section>

      <Section className="text-center"><PrimaryButton onClick={() => setNav("register")}>Make a Request</PrimaryButton></Section>
    </>
  );
}

function CostEstimatorForm({ session }) {
  const [form, setForm] = useState({ productName: "", originCountry: "", productCost: "", currency: "USD", quantity: 1, freight: "", insurance: "", dutyRatePercent: "", clearance: "", otherCosts: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildPayload = () => ({
    productName: form.productName || "Item",
    originCountry: form.originCountry || "Unknown",
    productCost: Number(form.productCost) || 0,
    currency: form.currency,
    quantity: Number(form.quantity) || 1,
    freight: Number(form.freight) || 0,
    insurance: Number(form.insurance) || 0,
    dutyRatePercent: form.dutyRatePercent ? Number(form.dutyRatePercent) : undefined,
    clearance: Number(form.clearance) || 0,
    otherCosts: Number(form.otherCosts) || 0,
  });

  const calculate = async () => {
    setLoading(true); setError(""); setResult(null); setSaved(false);
    try {
      const data = await api.estimateLandedCost(buildPayload());
      setResult(data);
    } catch (err) {
      setError(err.message || "Couldn't calculate an estimate.");
    } finally {
      setLoading(false);
    }
  };

  const saveEstimate = async () => {
    if (!session?.token) return;
    try {
      await api.saveLandedCostEstimate(session.token, buildPayload());
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <div className="rounded-2xl border border-slate-200 p-6 space-y-3">
        <p className="text-sm font-medium text-[#0F1C2E]">Enter product details</p>
        <input value={form.productName} onChange={e => set("productName", e.target.value)} placeholder="Product name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input value={form.originCountry} onChange={e => set("originCountry", e.target.value)} placeholder="Country of origin (e.g. China)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.productCost} onChange={e => set("productCost", e.target.value)} type="number" placeholder="Product price" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <select value={form.currency} onChange={e => set("currency", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {["USD", "GBP", "EUR", "CNY", "AED", "INR", "ZAR"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input value={form.quantity} onChange={e => set("quantity", e.target.value)} type="number" placeholder="Quantity" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.freight} onChange={e => set("freight", e.target.value)} type="number" placeholder="Freight (KSh, if known)" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input value={form.insurance} onChange={e => set("insurance", e.target.value)} type="number" placeholder="Insurance (KSh)" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
        <input value={form.dutyRatePercent} onChange={e => set("dutyRatePercent", e.target.value)} type="number" placeholder="Import duty rate % (from KRA tariff, if known)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.clearance} onChange={e => set("clearance", e.target.value)} type="number" placeholder="Clearance (KSh)" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input value={form.otherCosts} onChange={e => set("otherCosts", e.target.value)} type="number" placeholder="Other costs (KSh)" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <PrimaryButton className="w-full" disabled={loading} onClick={calculate}>{loading ? "Calculating…" : "Calculate landed cost"}</PrimaryButton>
      </div>

      <div className="rounded-2xl bg-[#0F1C2E] text-white p-6">
        {!result && <p className="text-sm text-slate-300">Fill in the form and calculate to see a live breakdown here, using a real current exchange rate.</p>}
        {result && (
          <>
            <p className="text-xs text-slate-400 mb-1">Your estimated landed cost</p>
            <p className="text-4xl font-semibold text-white mb-6">KSh {result.landedCostKes.toLocaleString()}</p>
            <div className="space-y-2 text-sm border-t border-white/10 pt-4">
              {[["Product cost", result.breakdown.productCostKes], ["Freight", result.breakdown.freightKes], ["Insurance", result.breakdown.insuranceKes],
                ["Import duty", result.breakdown.dutyKes], ["VAT (16%)", result.breakdown.vatKes], ["Clearance", result.breakdown.clearanceKes], ["Other costs", result.breakdown.otherCostsKes]].map(([label, val]) => (
                <div key={label} className="flex justify-between text-slate-300"><span>{label}</span><span className="text-white">{val === null ? "Not provided" : `KSh ${val.toLocaleString()}`}</span></div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400 space-y-1">
              <p>Exchange rate used: 1 {form.currency} = KSh {result.fx.rate.toFixed(2)} (source: {result.fx.source})</p>
              <p>Rate as of: {new Date(result.fx.timestamp).toLocaleString()}</p>
            </div>
            <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200">{result.verification}</div>
            <div className="mt-5 flex gap-3">
              {session?.token ? (
                <SecondaryButton className="flex-1 !py-2 !bg-transparent !text-white !border-white/30" onClick={saveEstimate}>{saved ? "Saved ✓" : "Save Estimate"}</SecondaryButton>
              ) : (
                <p className="text-xs text-slate-400">Log in to save this estimate.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InternationalPage({ setNav, session }) {
  return (
    <>
      <div className="bg-gradient-to-br from-[#0c2d4f] via-[#0c2d4f] to-[#0a1f38] text-white">
        <Section className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Eyebrow color="text-sky-300">International procurement</Eyebrow>
            <h1 className="text-4xl font-semibold">Need something from abroad? We've got it covered.</h1>
            <p className="mt-5 text-slate-300">Estimate your landed cost, understand the import expenses, and let YourPlug manage the procurement.</p>
            <div className="mt-8"><PrimaryButton onClick={() => setNav("register")} className="!bg-amber-500 hover:!bg-amber-600">Request an international item</PrimaryButton></div>
          </div>
          <Photo src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=70" alt="Shipping containers at port" className="rounded-2xl h-80 shadow-2xl" />
        </Section>
      </div>
      <Section>
        <Eyebrow color="text-sky-600">International Cost Estimator</Eyebrow>
        <h2 className="text-2xl font-semibold text-[#0F1C2E] mb-2">Estimate your landed cost</h2>
        <p className="text-sm text-slate-500 mb-8 max-w-2xl">Exchange rates are fetched live. Import duty is never guessed — provide your product's rate from KRA's tariff schedule, or leave it blank to see everything except duty.</p>
        <CostEstimatorForm session={session} />
      </Section>
    </>
  );
}

function ContactPage() {
  return (
    <Section className="grid lg:grid-cols-2 gap-16">
      <div>
        <Eyebrow>Contact</Eyebrow>
        <h1 className="text-4xl font-semibold text-[#0F1C2E]">Talk to a procurement agent.</h1>
        <div className="mt-8 space-y-4 text-sm text-slate-700">
          <div className="flex items-center gap-3"><Phone size={16} className="text-[#0F8B75]" /> +254 700 000 000</div>
          <div className="flex items-center gap-3"><Mail size={16} className="text-[#0F8B75]" /> hello@yourplug.co.ke</div>
          <div className="flex items-center gap-3"><MapPin size={16} className="text-[#0F8B75]" /> Nairobi, Kenya</div>
        </div>
      </div>
      <form className="rounded-2xl border border-slate-200 p-6 space-y-4" onSubmit={e => e.preventDefault()}>
        <input placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <input placeholder="Email address" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <textarea placeholder="How can we help?" rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <PrimaryButton className="w-full">Send message</PrimaryButton>
      </form>
    </Section>
  );
}

function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const doSearch = () => {
    setSearched(true);
    setResult(REQUESTS.find(r => r.id.toLowerCase() === query.trim().toLowerCase()) || null);
  };
  return (
    <Section className="max-w-2xl">
      <Eyebrow>Track order</Eyebrow>
      <h1 className="text-3xl font-semibold text-[#0F1C2E]">Where's my procurement request?</h1>
      <div className="mt-6 flex gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. YPM-202609-00127"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm" onKeyDown={e => e.key === "Enter" && doSearch()} />
        <PrimaryButton onClick={doSearch} icon={Search}>Track</PrimaryButton>
      </div>
      <p className="mt-3 text-xs text-slate-400">Try: YPM-202609-00127</p>
      {searched && !result && <p className="mt-8 text-sm text-slate-500">No request found with that ID. Check the reference on your invoice or confirmation email.</p>}
      {result && (
        <div className="mt-10 rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-400">{result.id}</p>
            <StatusBadge status={result.status} />
          </div>
          <p className="text-lg font-medium text-[#0F1C2E]">{result.item}</p>
          <div className="mt-6 space-y-3">
            {result.steps.map(([label, s], i) => (
              <div key={i} className="flex items-center gap-3">
                {s === true ? <CheckCircle2 size={18} className="text-[#0F8B75]" /> : s === "active" ? <Circle size={18} className="text-amber-500 fill-amber-500" /> : <Circle size={18} className="text-slate-300" />}
                <span className={`text-sm ${s ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function AuthPage({ mode, setNav, onAuth }) {
  const isRegister = mode === "register";
  const [accountType, setAccountType] = useState("INDIVIDUAL");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "", terms: false, privacy: false,
    companyName: "", registrationNumber: "", businessType: "", address: "", contactPerson: "",
    supplierCategory: "", supplierLocation: "", supplierWebsite: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      if (isRegister) {
        if (form.password !== form.confirm) throw new Error("Passwords don't match.");
        await api.register({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          acceptedTerms: form.terms, acceptedPrivacy: form.privacy, accountType,
          organization: accountType === "BUSINESS" ? {
            companyName: form.companyName, registrationNumber: form.registrationNumber || undefined,
            businessType: form.businessType || undefined, address: form.address || undefined,
            contactPerson: form.contactPerson || undefined,
          } : undefined,
          supplierProfile: accountType === "SUPPLIER" ? {
            companyName: form.companyName, category: form.supplierCategory, location: form.supplierLocation,
            website: form.supplierWebsite || undefined,
          } : undefined,
        });
        setNotice("Account created. Check your email/SMS for a verification code, then log in below.");
        setLoading(false);
        return;
      }
      const data = await api.login(form.email, form.password);
      const roleMap = { ADMIN: "admin", AGENT: "agent", SUPPLIER: "supplier", CUSTOMER: "customer" };
      const role = roleMap[data.user.role] || "customer";
      onAuth(role, { name: data.user.name, token: data.accessToken, userId: data.user.id });
    } catch (err) {
      setError(err.message || "Couldn't reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section className="max-w-md">
      <h1 className="text-3xl font-semibold text-[#0F1C2E]">{isRegister ? "Create your account" : "Log in"}</h1>
      <p className="mt-2 text-sm text-slate-500">{isRegister ? "Register to submit and track procurement requests." : "Access your dashboard to track requests and approve quotes."}</p>

      {isRegister && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[["INDIVIDUAL", "Individual"], ["BUSINESS", "Business"], ["SUPPLIER", "Supplier"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setAccountType(key)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium text-center ${accountType === key ? "border-[#0F8B75] bg-[#0F8B75]/5 text-[#0F1C2E]" : "border-slate-200 text-slate-500"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={submit}>
        {isRegister && <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder={accountType === "INDIVIDUAL" ? "Full name" : "Contact person full name"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />}
        <input required type={isRegister ? "email" : "text"} value={form.email} onChange={e => set("email", e.target.value)}
          placeholder="Email address" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        {isRegister && <input required value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone number" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />}

        {isRegister && accountType === "BUSINESS" && (
          <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
            <p className="text-xs font-medium text-slate-500">Business details</p>
            <input required value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Company / business name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} placeholder="Company registration number (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.businessType} onChange={e => set("businessType", e.target.value)} placeholder="Business type (e.g. Retail, SME, Corporate)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Business address" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
        )}

        {isRegister && accountType === "SUPPLIER" && (
          <div className="rounded-lg border border-sky-200 p-4 space-y-3 bg-sky-50">
            <p className="text-xs font-medium text-sky-800">Supplier details — an admin verifies new suppliers before you appear in comparisons</p>
            <input required value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Company name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input required value={form.supplierCategory} onChange={e => set("supplierCategory", e.target.value)} placeholder="Category (e.g. Electronics, Furniture)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input required value={form.supplierLocation} onChange={e => set("supplierLocation", e.target.value)} placeholder="Location" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.supplierWebsite} onChange={e => set("supplierWebsite", e.target.value)} placeholder="Website (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
        )}

        <input required type="password" value={form.password} onChange={e => set("password", e.target.value)}
          placeholder={isRegister ? "Password (min 8 characters)" : "Password"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        {isRegister && <input required type="password" value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Confirm password" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />}
        {isRegister && (
          <div className="space-y-2 text-xs text-slate-500">
            <label className="flex items-start gap-2"><input required type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)} className="mt-0.5" /> I accept the Terms & Conditions</label>
            <label className="flex items-start gap-2"><input required type="checkbox" checked={form.privacy} onChange={e => set("privacy", e.target.checked)} className="mt-0.5" /> I accept the Privacy Policy</label>
          </div>
        )}
        {!isRegister && <button type="button" className="text-xs text-[#0F8B75]">Forgot password?</button>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {notice && <p className="text-xs text-emerald-700">{notice}</p>}
        <PrimaryButton className="w-full" disabled={loading}>{loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}</PrimaryButton>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        {isRegister ? "Already have an account? " : "New to YourPlug? "}
        <button onClick={() => setNav(isRegister ? "login" : "register")} className="text-[#0F8B75] font-medium">{isRegister ? "Log in" : "Register"}</button>
      </p>
    </Section>
  );
}

/* ---------------------------------------------------------------------- */
/* CUSTOMER DASHBOARD                                                     */
/* ---------------------------------------------------------------------- */

function DashSidebar({ tab, setTab, role, setSession, setNav }) {
  const customerNav = [
    ["overview", "Dashboard", LayoutGrid], ["new", "New Request", Plus], ["requests", "My Requests", ClipboardList],
    ["quotes", "Quotes & Approvals", CheckCircle2], ["invoices", "Invoices", Receipt], ["payments", "Payments", CreditCard],
    ["tracking", "Delivery Tracking", Truck], ["messages", "Messages", MessageSquare], ["documents", "Documents", FileText],
    ["profile", "Profile", Settings],
  ];
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white h-full flex flex-col">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0F1C2E] text-white font-semibold text-sm">YP</div>
          <span className="text-sm font-semibold text-[#0F1C2E]">YourPlug</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {customerNav.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === key ? "bg-[#0F1C2E] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <button onClick={() => { setSession(null); setNav("home"); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("yourplug-theme") || "light");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("yourplug-theme", next);
  };
  return [theme, toggle];
}

function DashTopbar({ title, name, theme, onToggleTheme }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <h1 className="text-lg font-medium text-[#0F1C2E]">{title}</h1>
      <div className="flex items-center gap-4">
        {onToggleTheme && (
          <button onClick={onToggleTheme} className="text-slate-400 hover:text-[#0F1C2E]" title="Toggle dark/light mode">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <Bell size={18} className="text-slate-400" />
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">{name.split(" ").map(n => n[0]).join("")}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const tones = { default: "text-[#0F1C2E]", orange: "text-amber-600", green: "text-emerald-600", blue: "text-sky-600" };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

// Plain-language customer-facing status — the internal StatusBadge value stays
// exact for admins/agents, but customers see this instead: "complexity for
// YourPlug, simplicity for the customer."
const CUSTOMER_STATUS_COPY = {
  "Submitted": { message: "We've received your request.", action: null },
  "Under Review": { message: "We're reviewing your request.", action: null },
  "Supplier Research": { message: "We're sourcing options for you.", action: null },
  "Quotation Ready": { message: "We're preparing your recommendation.", action: null },
  "Awaiting Approval": { message: "Your recommendation is ready.", action: "Review and approve your recommended option." },
  "Awaiting Payment": { message: "You're all set — payment is the last step.", action: "Complete payment to proceed." },
  "Purchased": { message: "We've purchased this for you.", action: null },
  "Dispatched": { message: "Your request is on its way.", action: null },
  "In Transit": { message: "Your request is on its way.", action: null },
  "Delivered": { message: "Your request has been delivered.", action: null },
  "Completed": { message: "Your request is complete.", action: null },
  "Cancelled": { message: "This request was cancelled.", action: null },
  "Issue Reported": { message: "We're looking into an issue with this request.", action: null },
};
function customerStatusCopy(status) {
  return CUSTOMER_STATUS_COPY[status] || { message: "We're working on it.", action: null };
}

function CustomerOverview({ myRequests, setTab, setSelected }) {
  const count = s => myRequests.filter(r => r.status === s).length;
  return (
    <div className="p-8 space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active requests" value={myRequests.filter(r => !["Completed", "Cancelled"].includes(r.status)).length} />
        <MetricCard label="Awaiting approval" value={count("Awaiting Approval")} tone="orange" />
        <MetricCard label="Awaiting payment" value={count("Awaiting Payment")} tone="orange" />
        <MetricCard label="In transit" value={count("In Transit")} tone="blue" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-[#0F8B75] font-medium"><Wallet size={18} /> YourPlug has saved you KSh 12,400 across completed procurements.</div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-[#0F1C2E]">What's happening with your requests</p>
          <button onClick={() => setTab("requests")} className="text-sm text-[#0F8B75] font-medium">View all</button>
        </div>
        <div className="space-y-3">
          {myRequests.map(r => {
            const copy = customerStatusCopy(r.status);
            return (
              <button key={r.id} onClick={() => { setSelected(r.id); setTab("detail"); }} className="w-full text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{r.id}</p>
                    <p className="font-medium text-[#0F1C2E]">{r.item}</p>
                    <p className="text-sm text-slate-600 mt-1">{copy.message}</p>
                  </div>
                  {copy.action ? (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-3 py-1.5 whitespace-nowrap">Action required</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">No action needed</span>
                  )}
                </div>
                {copy.action && <p className="text-xs text-amber-700 mt-2">{copy.action}</p>}
              </button>
            );
          })}
          {myRequests.length === 0 && <p className="text-sm text-slate-500 rounded-xl border border-slate-200 bg-white p-6">No requests yet — tell us what you need to get started.</p>}
        </div>
      </div>
    </div>
  );
}

function RequestDetail({ req, setTab }) {
  const [showComparison, setShowComparison] = useState(false);
  if (!req) return null;
  const copy = customerStatusCopy(req.status);
  const fee = Math.round(req.value * 0.06);
  const total = req.value + fee + 800;
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <button onClick={() => setTab("requests")} className="text-sm text-slate-500">← Back to My Requests</button>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{req.id}</p>
          <h2 className="text-2xl font-semibold text-[#0F1C2E] mt-1">{req.item}</h2>
          <p className="text-sm text-slate-600 mt-1">{copy.message}</p>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyTag urgency={req.urgency} />
          {copy.action ? <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-3 py-1.5">Action required</span> : <span className="text-xs font-medium text-slate-400">No action needed</span>}
        </div>
      </div>

      {req.quotes.length > 0 && req.status === "Awaiting Approval" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">YourPlug recommends</p>
          <p className="font-medium text-lg text-[#0F1C2E]">{req.item}</p>
          <p className="text-sm text-slate-600 mt-1">Recommended supplier: <span className="font-medium text-[#0F1C2E]">{req.recommended}</span></p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Price</span><Money value={req.value} /></div>
              <div className="flex justify-between font-medium pt-2 border-t border-slate-100 mt-2"><span>Total</span><Money value={total} /></div>
              <p className="text-xs text-slate-500 pt-2">Why we selected this option:</p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Good specification match</li>
                <li>Suitable delivery timeline</li>
                <li>Competitive quotation</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <PrimaryButton icon={CheckCircle2}>Approve & Proceed</PrimaryButton>
              <SecondaryButton>Ask a Question</SecondaryButton>
              {req.quotes.length > 1 && <button onClick={() => setShowComparison(s => !s)} className="text-xs text-slate-500 underline mt-1">{showComparison ? "Hide comparison" : "View comparison"}</button>}
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="font-medium text-[#0F1C2E] mb-3">Progress</p>
        <div className="flex flex-wrap gap-4">
          {req.steps.map(([label, s], i) => (
            <div key={i} className="flex items-center gap-2">
              {s === true ? <CheckCircle2 size={16} className="text-[#0F8B75]" /> : s === "active" ? <Circle size={16} className="text-amber-500 fill-amber-500" /> : <Circle size={16} className="text-slate-300" />}
              <span className={`text-xs ${s ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {req.quotes.length > 0 && showComparison && (
        <div>
          <p className="font-medium text-[#0F1C2E] mb-3">Comparison</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs"><tr>
                <th className="text-left px-4 py-3">Supplier</th><th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Delivery</th><th className="text-left px-4 py-3">Warranty</th>
                <th className="text-left px-4 py-3">Reliability</th><th className="text-left px-4 py-3">Score</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {req.quotes.map(q => (
                  <tr key={q.supplier} className={q.supplier === req.recommended ? "bg-emerald-50/50" : ""}>
                    <td className="px-4 py-3 font-medium text-[#0F1C2E]">{q.supplier}{q.supplier === req.recommended && <span className="ml-2 text-[10px] font-medium text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">Recommended</span>}</td>
                    <td className="px-4 py-3"><Money value={q.price} /></td>
                    <td className="px-4 py-3">{q.delivery}</td>
                    <td className="px-4 py-3">{q.warranty}</td>
                    <td className="px-4 py-3">{q.reliability}/100</td>
                    <td className="px-4 py-3 font-medium">{q.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <p className="font-medium text-[#0F1C2E] mb-3">Timeline</p>
        <div className="space-y-4">
          {req.timeline.map(([time, event], i) => (
            <div key={i} className="flex gap-4 text-sm">
              <span className="text-slate-400 w-14 shrink-0">{time}</span>
              <span className="text-slate-700">{event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewRequestWizard({ session, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ item: "", desc: "", qty: 1, budget: "", urgency: "Normal", delivery: "", scope: "Local", supplierLink: "", originCountry: "" });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [createdRef, setCreatedRef] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const runAiExtraction = async () => {
    if (!session.token) {
      setAiError("Log in with a real account to use the AI assistant.");
      return;
    }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const result = await api.extractSpecification(session.token, form.desc);
      setAiResult(result);
    } catch (err) {
      setAiError(err.message || "Couldn't reach the AI assistant.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setForm(f => ({
      ...f,
      item: aiResult.item || f.item,
      qty: aiResult.quantity || f.qty,
    }));
  };

  const submit = async () => {
    if (!session.token) {
      // Demo mode — no backend session, so there's nothing real to write to.
      setCreatedRef("YPM-202609-00142");
      setStep(5);
      return;
    }
    setSubmitting(true); setError("");
    try {
      const importNote = form.scope === "International" && (form.supplierLink || form.originCountry)
        ? `\n\nImport details — Supplier/website: ${form.supplierLink || "not provided"}; Country of origin: ${form.originCountry || "not provided"}`
        : "";
      const payload = {
        item: form.item || form.desc.slice(0, 60) || "Untitled request",
        description: (form.desc || "") + importNote || undefined,
        quantity: Number(form.qty) || 1,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: "KES",
        urgency: form.urgency.toUpperCase(),
        scope: form.scope.toUpperCase(),
        deliveryAddress: form.delivery || undefined,
      };
      const created = await api.createRequest(session.token, payload);
      setCreatedRef(created.ref);

      if (files.length > 0) {
        setUploadStatus(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}…`);
        for (const file of files) {
          try {
            await api.uploadDocument(session.token, created.id, file);
          } catch (uploadErr) {
            console.error("File upload failed:", uploadErr.message);
          }
        }
        setUploadStatus("");
      }

      setStep(5);
      onSubmitted?.();
    } catch (err) {
      setError(err.message || "Couldn't submit your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 5) {
    return (
      <div className="p-8 max-w-lg">
        <CheckCircle2 size={40} className="text-[#0F8B75]" />
        <h2 className="text-2xl font-semibold text-[#0F1C2E] mt-4">Request submitted</h2>
        <p className="text-slate-600 mt-2">Reference <span className="font-medium text-[#0F1C2E]">{createdRef}</span>. An agent will review it and begin supplier research shortly. You'll be notified at each step.</p>
        {!session.token && <p className="text-xs text-amber-700 mt-3">Demo mode — this wasn't actually saved. Log in with a real account to submit for real.</p>}
        <SecondaryButton className="mt-6" onClick={() => { setStep(1); setForm({ item: "", desc: "", qty: 1, budget: "", urgency: "Normal", delivery: "", scope: "Local" }); setAiResult(null); setCreatedRef(""); }}>Submit another request</SecondaryButton>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-8">
        {["What you need", "Supporting info", "Delivery", "Review"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${step === i + 1 ? "bg-[#0F1C2E] text-white" : step > i + 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}</div>
            {i < 3 && <div className={`w-8 h-px ${step > i + 1 ? "bg-emerald-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-medium text-[#0F1C2E]">What do you need?</h2>
          <textarea rows={3} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Describe it naturally — e.g. 'I need a commercial display fridge for my shop, around 300–500L'"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <PrimaryButton className="!inline-flex" onClick={runAiExtraction} icon={Sparkles} disabled={aiLoading || !form.desc.trim()}>{aiLoading ? "Analyzing…" : "Let AI structure this"}</PrimaryButton>
          {aiError && <p className="text-xs text-rose-600">{aiError}</p>}

          {aiResult && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 space-y-2 text-sm">
              <p className="font-medium text-[#0F1C2E] flex items-center gap-2"><Sparkles size={14} className="text-sky-600" /> AI-assisted specification — please review before submitting</p>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                {aiResult.item && <div><span className="text-slate-500">Item</span><p className="font-medium text-[#0F1C2E]">{aiResult.item}</p></div>}
                {aiResult.quantity && <div><span className="text-slate-500">Quantity</span><p className="font-medium text-[#0F1C2E]">{aiResult.quantity}</p></div>}
                {aiResult.brand && <div><span className="text-slate-500">Brand</span><p className="font-medium text-[#0F1C2E]">{aiResult.brand}</p></div>}
                {aiResult.specifications.map((s, i) => (
                  <div key={i}><span className="text-slate-500">{s.field}</span><p className="font-medium text-[#0F1C2E]">{s.value} <span className={`text-[10px] rounded px-1 ${s.source === "stated" ? "text-emerald-700 bg-emerald-100" : "text-sky-700 bg-sky-100"}`}>{s.source === "stated" ? "from your description" : "AI-inferred"}</span></p></div>
                ))}
              </div>
              {aiResult.missing.length > 0 && (
                <div className="mt-3 rounded-lg bg-white border border-amber-200 px-3 py-2 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} /> Missing — please confirm: {aiResult.missing.join(", ")}
                </div>
              )}
              <button onClick={applyAiResult} className="mt-2 text-xs font-medium text-sky-700 underline">Use this to fill in the fields below</button>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-slate-500">Item name</label><input value={form.item} onChange={e => set("item", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs text-slate-500">Quantity</label><input type="number" value={form.qty} onChange={e => set("qty", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs text-slate-500">Budget (KES)</label><input value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs text-slate-500">Urgency</label>
              <select value={form.urgency} onChange={e => set("urgency", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                <option>Normal</option><option>High</option><option>Urgent</option><option>Emergency</option>
              </select>
            </div>
            <div><label className="text-xs text-slate-500">Procurement type</label>
              <select value={form.scope} onChange={e => set("scope", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                <option value="Local">Local Procurement</option>
                <option value="International">Import / International Sourcing</option>
              </select>
            </div>
          </div>
          {form.scope === "International" && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 space-y-3">
              <p className="text-xs font-medium text-sky-800">Import details</p>
              <input value={form.supplierLink} onChange={e => set("supplierLink", e.target.value)} placeholder="Supplier or website (if known)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={form.originCountry} onChange={e => set("originCountry", e.target.value)} placeholder="Country of origin" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            </div>
          )}
          <PrimaryButton onClick={() => setStep(2)}>Continue</PrimaryButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-medium text-[#0F1C2E]">Add supporting information</h2>
          <p className="text-sm text-slate-500">Photos, screenshots, product catalogues or existing quotations — anything that helps us find the right match. Images, PDFs, and Word/Excel files, up to 15MB each.</p>
          <label className="block rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-400 cursor-pointer hover:border-[#0F8B75] hover:text-[#0F8B75] transition-colors">
            <Upload className="mx-auto mb-2" size={22} />
            <p className="text-sm">Click to choose files, or drag and drop</p>
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
              onChange={e => setFiles(f => [...f, ...Array.from(e.target.files || [])])} />
          </label>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700 truncate">{f.name} <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span></span>
                  <button onClick={() => setFiles(fs => fs.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {!session.token && files.length > 0 && <p className="text-xs text-amber-700">Demo mode — files are shown here but won't actually upload anywhere.</p>}
          <div className="flex justify-between"><SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton><PrimaryButton onClick={() => setStep(3)}>Continue</PrimaryButton></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-xl font-medium text-[#0F1C2E]">Delivery</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Recipient name" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input placeholder="Phone number" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.delivery} onChange={e => set("delivery", e.target.value)} placeholder="Delivery address" className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input placeholder="Building / estate" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input placeholder="Apartment / office" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </div>
          <div className="flex gap-2 text-xs">
            {["Home", "Office", "Warehouse", "Other"].map(t => <span key={t} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">{t}</span>)}
          </div>
          <div className="flex justify-between"><SecondaryButton onClick={() => setStep(2)}>Back</SecondaryButton><PrimaryButton onClick={() => setStep(4)}>Continue</PrimaryButton></div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-xl font-medium text-[#0F1C2E]">Review request</h2>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
            {[["Item", form.item || form.desc.slice(0, 60) || "Not specified"], ["Quantity", form.qty], ["Budget", form.budget || "Not specified"], ["Urgency", form.urgency], ["Procurement type", form.scope === "International" ? "Import / International Sourcing" : "Local Procurement"], ["Delivery to", form.delivery || "Not specified"]].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3"><span className="text-slate-500">{k}</span><span className="font-medium text-[#0F1C2E]">{v}</span></div>
            ))}
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {!session.token && <p className="text-xs text-amber-700">Demo mode — this will show a success screen but won't actually be saved.</p>}
          <div className="flex justify-between"><SecondaryButton onClick={() => setStep(3)}>Back</SecondaryButton>
            <PrimaryButton onClick={submit} disabled={submitting} icon={CheckCircle2}>{uploadStatus || (submitting ? "Submitting…" : "Submit request")}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsPanel({ session, invoices }) {
  const [phone, setPhone] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | waiting | confirmed | failed
  const [error, setError] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);

  const unpaid = (invoices || []).filter(i => i.status !== "PAID");
  const target = selectedInvoice || unpaid[0];

  React.useEffect(() => {
    if (status !== "waiting" || !checkoutId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.mpesaStatus(session.token, checkoutId);
        if (res.status === "confirmed") { setStatus("confirmed"); clearInterval(interval); }
        else if (res.status === "failed") { setStatus("failed"); setError(res.resultDesc || "Payment failed or was cancelled."); clearInterval(interval); }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [status, checkoutId]);

  const pay = async () => {
    if (!target) return;
    setStatus("sending"); setError("");
    try {
      const res = await api.initiateMpesa(session.token, target.id, phone);
      setCheckoutId(res.checkoutRequestId);
      setStatus("waiting");
    } catch (err) {
      setStatus("failed");
      setError(err.message || "Couldn't reach M-Pesa.");
    }
  };

  if (!session.token) {
    return (
      <div className="p-8 max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="font-medium text-[#0F1C2E] mb-3">Pay via M-Pesa</p>
          <p className="text-sm text-slate-500 mb-4">Demo mode — log in with a real account to trigger an actual M-Pesa STK push.</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span>INV-001829</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Account reference</span><span className="font-medium text-[#0F1C2E]">YPM-001829</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><Money value={312000} /></div>
          </div>
        </div>
      </div>
    );
  }

  if (unpaid.length === 0) {
    return <div className="p-8 max-w-md"><p className="text-sm text-slate-500">No outstanding invoices — nothing to pay right now.</p></div>;
  }

  return (
    <div className="p-8 max-w-md space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="font-medium text-[#0F1C2E] mb-1">Pay via M-Pesa</p>
        <p className="text-sm text-slate-500 mb-4">A real STK push is sent to the phone number you enter below.</p>

        {unpaid.length > 1 && (
          <select value={target?.id} onChange={e => setSelectedInvoice(unpaid.find(i => i.id === e.target.value))}
            className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {unpaid.map(i => <option key={i.id} value={i.id}>{i.number} — {i.item}</option>)}
          </select>
        )}

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span>{target.number}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Item</span><span>{target.item}</span></div>
          <div className="flex justify-between font-medium"><span className="text-slate-500">Amount</span><Money value={target.total} currency={target.currency} /></div>
        </div>

        {status === "idle" || status === "sending" ? (
          <>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="M-Pesa phone number, e.g. 0712345678"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm mb-3" />
            <PrimaryButton className="w-full" disabled={status === "sending" || !phone} onClick={pay}>
              {status === "sending" ? "Sending request…" : "Pay with M-Pesa"}
            </PrimaryButton>
          </>
        ) : status === "waiting" ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            Check your phone and enter your M-Pesa PIN to complete the payment. This updates automatically once confirmed.
          </div>
        ) : status === "confirmed" ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} /> Payment confirmed. Your order is proceeding.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</div>
            <SecondaryButton onClick={() => { setStatus("idle"); setError(""); }}>Try again</SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesPanel({ session, requests }) {
  const [selectedId, setSelectedId] = useState(requests?.[0]?.dbId || null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selected = (requests || []).find(r => r.dbId === selectedId) || requests?.[0];

  React.useEffect(() => {
    if (!session.token || !selected?.dbId) return;
    api.getMessages(session.token, selected.dbId).then(setThread).catch(err => setError(err.message));
  }, [session.token, selected?.dbId]);

  const send = async () => {
    if (!draft.trim() || !selected?.dbId) return;
    setSending(true); setError("");
    try {
      const msg = await api.postMessage(session.token, selected.dbId, draft.trim(), "customer");
      setThread(t => [...t, msg]);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!session.token) {
    return (
      <div className="p-8 max-w-xl">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          {[["Customer", "Can you get the black version?"], ["Agent Collins", "Yes. I am checking availability."], ["Agent Collins", "Black is available from Supplier B for KSh 2,000 more."], ["Customer", "Approved."]].map(([who, msg], i) => (
            <div key={i} className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${who === "Customer" ? "ml-auto bg-[#0F1C2E] text-white" : "bg-slate-100 text-slate-700"}`}>{msg}</div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Demo mode — log in with a real account to message your assigned agent.</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return <div className="p-8 max-w-xl"><p className="text-sm text-slate-500">No requests yet — messages appear here once you have an active request.</p></div>;
  }

  return (
    <div className="p-8 max-w-xl">
      {requests.length > 1 && (
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)} className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
          {requests.map(r => <option key={r.dbId} value={r.dbId}>{r.id} — {r.item}</option>)}
        </select>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 min-h-[120px]">
        {thread.length === 0 && <p className="text-sm text-slate-400">No messages yet on this request.</p>}
        {thread.map(m => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.senderId === session.userId ? "ml-auto bg-[#0F1C2E] text-white" : "bg-slate-100 text-slate-700"}`}>
            <p>{m.body}</p>
            <p className={`text-[10px] mt-1 ${m.senderId === session.userId ? "text-slate-300" : "text-slate-400"}`}>{m.sender?.name || "You"}</p>
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-rose-600 mt-2">{error}</p>}
      <div className="mt-4 flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Write a message" className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        <PrimaryButton className="!px-4" disabled={sending} onClick={send}>Send</PrimaryButton>
      </div>
    </div>
  );
}

function ProfilePanel({ session }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [legal, setLegal] = useState([]);

  React.useEffect(() => {
    if (!session.token) return;
    api.getProfile(session.token).then(p => {
      setProfile(p);
      setForm({ name: p.name, email: p.email, phone: p.phone });
    }).catch(err => setError(err.message));
    api.getLegalAcceptances(session.token).then(setLegal).catch(() => {});
  }, [session.token]);

  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const updated = await api.updateProfile(session.token, form);
      setProfile(updated);
      setEditing(false);
      setNotice("Saved. Any changed email or phone will need re-verifying.");
    } catch (err) {
      setError(err.message || "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!session.token) {
    const demo = CUSTOMERS.find(c => c.name === session.name);
    return (
      <div className="p-8 max-w-md space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-[#0F1C2E]">{session.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{demo?.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{demo?.phone}</span></div>
        </div>
        <p className="text-xs text-amber-700">Demo mode — log in with a real account to edit your profile.</p>
      </div>
    );
  }

  if (!profile) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="p-8 max-w-md space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-sm">
        {editing ? (
          <>
            <div><label className="text-xs text-slate-500">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-slate-500">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-slate-500">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +254712345678" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <PrimaryButton className="flex-1 !py-2" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</PrimaryButton>
              <SecondaryButton className="flex-1 !py-2" onClick={() => { setEditing(false); setForm({ name: profile.name, email: profile.email, phone: profile.phone }); setError(""); }}>Cancel</SecondaryButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-[#0F1C2E]">{profile.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{profile.email} {profile.emailVerified && <CheckCircle2 size={12} className="inline text-emerald-500 ml-1" />}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{profile.phone} {profile.phoneVerified && <CheckCircle2 size={12} className="inline text-emerald-500 ml-1" />}</span></div>
            {notice && <p className="text-xs text-emerald-700">{notice}</p>}
            <SecondaryButton className="w-full !py-2 mt-2" onClick={() => setEditing(true)}>Edit profile</SecondaryButton>
          </>
        )}
      </div>
      {legal.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm">
          <p className="font-medium text-[#0F1C2E] mb-3">Legal acceptance record</p>
          <div className="space-y-2">
            {legal.map(l => (
              <div key={l.id} className="flex justify-between text-xs text-slate-500">
                <span className="capitalize">{l.documentType.replace(/_/g, " ")} v{l.documentVersion}</span>
                <span>{new Date(l.acceptedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryTrackingPanel({ session, requests }) {
  const [deliveries, setDeliveries] = useState({});

  React.useEffect(() => {
    if (!session.token) return;
    const relevant = requests.filter(r => ["Dispatched", "In Transit", "Delivered", "Completed"].includes(r.status));
    relevant.forEach(r => {
      if (!r.dbId) return;
      api.getDelivery(session.token, r.dbId).then(d => setDeliveries(prev => ({ ...prev, [r.dbId]: d }))).catch(() => {});
    });
  }, [session.token, requests]);

  const relevant = requests.filter(r => ["Dispatched", "In Transit", "Delivered", "Completed"].includes(r.status));

  if (relevant.length === 0) {
    return <div className="p-8"><p className="text-sm text-slate-500">No deliveries in progress yet.</p></div>;
  }

  return (
    <div className="p-8 space-y-4">
      {relevant.map(r => {
        const d = session.token ? deliveries[r.dbId] : null;
        return (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4"><p className="font-medium text-[#0F1C2E]">{r.item}</p><StatusBadge status={r.status} /></div>
            {session.token ? (
              d ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Provider</span><span>{d.provider}</span></div>
                  {d.trackingNumber && <div className="flex justify-between"><span className="text-slate-500">Tracking number</span><span>{d.trackingNumber}</span></div>}
                  {d.destination && <div className="flex justify-between"><span className="text-slate-500">Destination</span><span>{d.destination}</span></div>}
                </div>
              ) : <p className="text-xs text-slate-400">Delivery details not yet booked.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {r.steps.map(([label, s], i) => (
                  <div key={i} className="flex items-center gap-2">
                    {s === true ? <CheckCircle2 size={16} className="text-[#0F8B75]" /> : s === "active" ? <Circle size={16} className="text-amber-500 fill-amber-500" /> : <Circle size={16} className="text-slate-300" />}
                    <span className={`text-xs ${s ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DocumentsPanel({ session, requests }) {
  const [selectedId, setSelectedId] = useState(requests?.[0]?.dbId || null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");
  const selected = (requests || []).find(r => r.dbId === selectedId) || requests?.[0];

  React.useEffect(() => {
    if (!session.token || !selected?.dbId) return;
    api.getDocuments(session.token, selected.dbId).then(setDocs).catch(err => setError(err.message));
  }, [session.token, selected?.dbId]);

  const download = async (docId) => {
    try {
      const { url } = await api.getDocumentDownloadUrl(session.token, docId);
      window.open(url, "_blank");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!session.token) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {["Purchase order — YPM-202609-00127.pdf", "Supplier invoice — ABC Electronics.pdf", "Proof of delivery — YPM-202608-00098.pdf"].map(d => (
            <div key={d} className="flex items-center justify-between px-5 py-3.5 text-sm"><span className="flex items-center gap-2 text-slate-700"><FileText size={15} className="text-slate-400" /> {d}</span><button className="text-[#0F8B75] font-medium">Download</button></div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Demo mode — log in with a real account to see documents attached to your actual requests.</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return <div className="p-8"><p className="text-sm text-slate-500">No requests yet — documents appear here once you have one.</p></div>;
  }

  return (
    <div className="p-8">
      {requests.length > 1 && (
        <select value={selectedId || ""} onChange={e => setSelectedId(e.target.value)} className="w-full mb-4 rounded-lg border border-slate-300 px-3 py-2.5 text-sm max-w-md">
          {requests.map(r => <option key={r.dbId} value={r.dbId}>{r.id} — {r.item}</option>)}
        </select>
      )}
      {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {docs.length === 0 && <p className="text-sm text-slate-400 p-5">No documents on this request yet.</p>}
        {docs.map(d => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
            <span className="flex items-center gap-2 text-slate-700"><FileText size={15} className="text-slate-400" /> {d.fileName} <span className="text-xs text-slate-400">({(d.sizeBytes / 1024).toFixed(0)} KB · {d.uploadedBy})</span></span>
            <button onClick={() => download(d.id)} className="text-[#0F8B75] font-medium">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerDashboard({ setNav, setSession, session }) {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [liveRequests, setLiveRequests] = useState(null);
  const [liveInvoices, setLiveInvoices] = useState(null);
  const [liveError, setLiveError] = useState("");

  const refreshRequests = React.useCallback(() => {
    if (!session.token) return;
    api.myRequests(session.token)
      .then(data => setLiveRequests(data.map(r => ({
        dbId: r.id, id: r.ref, item: r.item, customer: session.name, agent: r.agent?.name || "Unassigned",
        status: r.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        urgency: r.urgency.charAt(0) + r.urgency.slice(1).toLowerCase(),
        value: r.quotes?.[0]?.price || 0, currency: r.currency, created: r.createdAt.slice(0, 10),
        steps: [["Request Submitted", true]], timeline: r.events?.map(e => ["", e.label]) || [],
        quotes: [], recommended: null,
      }))))
      .catch(err => setLiveError(err.message));
  }, [session.token, session.name]);

  const refreshInvoices = React.useCallback(() => {
    if (!session.token) return;
    api.myInvoices(session.token)
      .then(data => setLiveInvoices(data.map(inv => ({
        id: inv.id, number: inv.number, item: inv.request.item, total: inv.total,
        currency: inv.currency, status: inv.status,
      }))))
      .catch(() => {});
  }, [session.token]);

  React.useEffect(() => {
    refreshRequests();
    refreshInvoices();
  }, [refreshRequests, refreshInvoices]);

  const demoRequests = REQUESTS.filter(r => r.customer === session.name);
  const myRequests = session.token ? (liveRequests ?? []) : demoRequests;
  const allSource = session.token ? (liveRequests || []) : REQUESTS;
  const selectedReq = allSource.find(r => r.id === selected);

  const titles = { overview: "Dashboard", new: "New Request", requests: "My Requests", quotes: "Quotes & Approvals", invoices: "Invoices", payments: "Payments", tracking: "Delivery Tracking", messages: "Messages", documents: "Documents", profile: "Profile", detail: selectedReq?.item || "Request" };
  const [theme, toggleTheme] = useTheme();

  return (
    <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
      <DashSidebar tab={tab} setTab={setTab} setSession={setSession} setNav={setNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} theme={theme} onToggleTheme={toggleTheme} />
        {session.token && (
          <div className={`px-8 py-2 text-xs ${liveError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {liveError ? `Couldn't load live data: ${liveError}` : "Connected to the live API — showing real data from the database."}
          </div>
        )}
        {!session.token && (
          <div className="px-8 py-2 text-xs bg-amber-50 text-amber-700">Demo mode — showing sample data, not connected to a backend.</div>
        )}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {tab === "overview" && <CustomerOverview myRequests={myRequests} setTab={setTab} setSelected={setSelected} />}
          {tab === "new" && <div className="bg-white h-full"><NewRequestWizard session={session} onSubmitted={refreshRequests} /></div>}
          {tab === "requests" && (
            <div className="p-8">
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {myRequests.map(r => (
                  <button key={r.id} onClick={() => { setSelected(r.id); setTab("detail"); }} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
                    <div><p className="text-sm font-medium text-[#0F1C2E]">{r.item}</p><p className="text-xs text-slate-400 mt-0.5">{r.id} · {r.created}</p></div>
                    <div className="flex items-center gap-3"><Money value={r.value} /><StatusBadge status={r.status} /></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === "detail" && <div className="bg-white h-full"><RequestDetail req={selectedReq} setTab={setTab} /></div>}
          {tab === "quotes" && (
            <div className="p-8 space-y-4">
              {myRequests.filter(r => r.status === "Awaiting Approval").map(r => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-between">
                  <div><p className="font-medium text-[#0F1C2E]">{r.item}</p><p className="text-xs text-slate-400">{r.id}</p></div>
                  <button onClick={() => { setSelected(r.id); setTab("detail"); }} className="text-sm font-medium text-[#0F8B75]">Review & approve →</button>
                </div>
              ))}
              {myRequests.filter(r => r.status === "Awaiting Approval").length === 0 && <p className="text-sm text-slate-500">Nothing awaiting your approval right now.</p>}
            </div>
          )}
          {tab === "invoices" && (
            <div className="p-8">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Invoice</th><th className="text-left px-4 py-3">Request</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {session.token
                      ? (liveInvoices || []).map(inv => (
                          <tr key={inv.number}><td className="px-4 py-3 font-medium text-[#0F1C2E]">{inv.number}</td><td className="px-4 py-3">{inv.item}</td>
                            <td className="px-4 py-3"><Money value={inv.total} currency={inv.currency} /></td>
                            <td className="px-4 py-3"><StatusBadge status={inv.status === "PAID" ? "Completed" : "Awaiting Payment"} /></td></tr>
                        ))
                      : myRequests.filter(r => r.value).map((r, i) => (
                          <tr key={r.id}><td className="px-4 py-3 font-medium text-[#0F1C2E]">INV-{1820 + i}</td><td className="px-4 py-3">{r.item}</td><td className="px-4 py-3"><Money value={r.value} /></td>
                            <td className="px-4 py-3"><StatusBadge status={["Awaiting Payment", "Awaiting Approval"].includes(r.status) ? "Awaiting Payment" : "Completed"} /></td></tr>
                        ))}
                  </tbody>
                </table>
                {session.token && (liveInvoices || []).length === 0 && (
                  <p className="text-sm text-slate-500 p-5">No invoices yet — these are created once a request reaches quotation approval.</p>
                )}
              </div>
            </div>
          )}
          {tab === "payments" && <PaymentsPanel session={session} invoices={liveInvoices} />}
          {tab === "tracking" && <DeliveryTrackingPanel session={session} requests={myRequests} />}
          {tab === "messages" && <MessagesPanel session={session} requests={myRequests} />}
          {tab === "documents" && <DocumentsPanel session={session} requests={myRequests} />}
          {tab === "profile" && <ProfilePanel session={session} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ADMIN DASHBOARD                                                        */
/* ---------------------------------------------------------------------- */

function AdminSidebar({ tab, setTab, setSession, setNav }) {
  const nav = [
    ["overview", "Overview", LayoutGrid], ["orders", "Orders", ClipboardList], ["suppliers", "Suppliers", Package],
    ["agents", "Agents", Users], ["invoices", "Invoices", Receipt], ["documents", "Documents", FileText],
    ["reports", "Reports", BarChart3], ["audit", "Audit Logs", ShieldCheck],
    ["appearance", "Website Appearance", ImageIcon],
  ];
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-[#0F1C2E] text-slate-300 h-full flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white font-semibold text-sm">YP</div><span className="text-sm font-semibold text-white">Operations</span></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === key ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => { setSession(null); setNav("home"); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"><LogOut size={16} /> Log out</button>
      </div>
    </aside>
  );
}

function AdminOverview({ orders, setTab, setSelected }) {
  const total = orders.length;
  const urgent = orders.filter(r => ["Urgent", "Emergency"].includes(r.urgency) && !["Completed", "Cancelled"].includes(r.status)).length;
  const awaitingApproval = orders.filter(r => r.status === "Awaiting Approval").length;
  const awaitingPayment = orders.filter(r => r.status === "Awaiting Payment").length;
  const inTransit = orders.filter(r => r.status === "In Transit").length;
  const completed = orders.filter(r => r.status === "Completed").length;
  const revenue = orders.reduce((s, r) => s + (r.value || 0) * 0.06, 0);

  return (
    <div className="p-8 space-y-8">
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Total orders" value={total} />
        <MetricCard label="Urgent orders" value={urgent} tone="orange" />
        <MetricCard label="Awaiting approval" value={awaitingApproval} tone="orange" />
        <MetricCard label="Awaiting payment" value={awaitingPayment} tone="orange" />
        <MetricCard label="In transit" value={inTransit} tone="blue" />
        <MetricCard label="Completed" value={completed} tone="green" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <MetricCard label="Procurement fees (est.)" value={`KSh ${Math.round(revenue).toLocaleString()}`} tone="green" />
        <MetricCard label="Customer savings tracked" value="KSh 23,000" tone="green" />
        <MetricCard label="Avg. procurement time" value="1.8 days" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-[#0F1C2E]">Priority queue</p>
          <button onClick={() => setTab("orders")} className="text-sm text-[#0F8B75] font-medium">View all orders</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {orders.length === 0 && <p className="text-sm text-slate-500 p-5">No orders yet.</p>}
          {[...orders].sort((a, b) => (["Emergency", "Urgent", "High", "Normal"].indexOf(a.urgency)) - (["Emergency", "Urgent", "High", "Normal"].indexOf(b.urgency))).map(r => (
            <button key={r.id} onClick={() => { setSelected(r.id); setTab("workspace"); }} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <UrgencyTag urgency={r.urgency} />
                <div><p className="text-sm font-medium text-[#0F1C2E]">{r.item}</p><p className="text-xs text-slate-400">{r.id} · {r.customer} · Agent {r.agent}</p></div>
              </div>
              <StatusBadge status={r.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminOrders({ orders, setTab, setSelected }) {
  const [filter, setFilter] = useState("All");
  const statuses = ["All", ...Array.from(new Set(orders.map(r => r.status)))];
  const rows = filter === "All" ? orders : orders.filter(r => r.status === filter);
  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-[#0F1C2E] text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr>
            <th className="text-left px-4 py-3">ID</th><th className="text-left px-4 py-3">Item</th><th className="text-left px-4 py-3">Customer</th>
            <th className="text-left px-4 py-3">Agent</th><th className="text-left px-4 py-3">Urgency</th><th className="text-left px-4 py-3">Value</th><th className="text-left px-4 py-3">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.id} onClick={() => { setSelected(r.id); setTab("workspace"); }} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#0F1C2E]">{r.id}</td><td className="px-4 py-3">{r.item}</td><td className="px-4 py-3">{r.customer}</td>
                <td className="px-4 py-3">{r.agent}</td><td className="px-4 py-3"><UrgencyTag urgency={r.urgency} /></td><td className="px-4 py-3"><Money value={r.value} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No orders match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminWorkspace({ req, setTab, session }) {
  const [messages, setMessages] = useState([]);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [invoiceState, setInvoiceState] = useState("idle"); // idle | creating | done | error
  const [invoiceError, setInvoiceError] = useState("");
  const [manualSubtotal, setManualSubtotal] = useState("");
  const [localQuotes, setLocalQuotes] = useState(req?.quotes || []);
  const [suppliers, setSuppliers] = useState([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ supplierId: "", price: "", deliveryEstimate: "", warrantyTerms: "", recommended: false });
  const [quoteState, setQuoteState] = useState("idle"); // idle | saving | error
  const [quoteError, setQuoteError] = useState("");
  const [poState, setPoState] = useState("idle");
  const [poForm, setPoForm] = useState({ itemDescription: "", quantity: 1, unitPrice: "", expectedDeliveryDate: "" });
  const [poError, setPoError] = useState("");
  const [deliveryState, setDeliveryState] = useState("idle");
  const [deliveryForm, setDeliveryForm] = useState({ provider: "Manual", trackingNumber: "", courierName: "", destination: "" });
  const [delivery, setDelivery] = useState(null);
  const [deliveryError, setDeliveryError] = useState("");
  const liveMode = Boolean(session?.token) && Boolean(req?.dbId);

  React.useEffect(() => {
    if (!liveMode) return;
    api.getMessages(session.token, req.dbId).then(setMessages).catch(() => {});
    api.getSuppliers(session.token).then(setSuppliers).catch(() => {});
    api.getDelivery(session.token, req.dbId).then(setDelivery).catch(() => {});
  }, [liveMode, req?.dbId]);

  React.useEffect(() => { setLocalQuotes(req?.quotes || []); }, [req?.dbId]);

  if (!req) return null;

  const hasQuote = localQuotes.length > 0;
  const localRecommended = localQuotes.find(q => q.recommended)?.supplier || null;

  const generateInvoice = async () => {
    if (!liveMode) return;
    if (!hasQuote && !manualSubtotal) return; // wait for the amount field
    setInvoiceState("creating"); setInvoiceError("");
    try {
      await api.createInvoice(session.token, req.dbId, hasQuote ? undefined : Number(manualSubtotal));
      setInvoiceState("done");
    } catch (err) {
      setInvoiceState("error");
      setInvoiceError(err.message || "Couldn't generate the invoice.");
    }
  };

  const submitQuote = async () => {
    if (!quoteForm.supplierId || !quoteForm.price || !quoteForm.deliveryEstimate || !quoteForm.warrantyTerms) return;
    setQuoteState("saving"); setQuoteError("");
    try {
      const created = await api.addQuote(session.token, req.dbId, {
        supplierId: quoteForm.supplierId,
        price: Number(quoteForm.price),
        deliveryEstimate: quoteForm.deliveryEstimate,
        warrantyTerms: quoteForm.warrantyTerms,
        recommended: quoteForm.recommended,
      });
      const supplier = suppliers.find(s => s.id === quoteForm.supplierId);
      setLocalQuotes(qs => {
        const withoutOldRecommended = quoteForm.recommended ? qs.map(q => ({ ...q, recommended: false })) : qs;
        return [...withoutOldRecommended, {
          supplier: supplier?.name || "Supplier", price: created.price, delivery: created.deliveryEstimate,
          warranty: created.warrantyTerms, reliability: supplier?.reliability || 0, score: created.score, recommended: created.recommended,
        }];
      });
      setShowQuoteForm(false);
      setQuoteForm({ supplierId: "", price: "", deliveryEstimate: "", warrantyTerms: "", recommended: false });
    } catch (err) {
      setQuoteState("error");
      setQuoteError(err.message || "Couldn't add the quote.");
    } finally {
      setQuoteState("idle");
    }
  };

  const postNote = async (text, visibility) => {
    if (!text.trim() || !liveMode) return;
    const msg = await api.postMessage(session.token, req.dbId, text.trim(), visibility);
    setMessages(m => [...m, msg]);
    if (visibility === "internal") setNote(""); else setReply("");
  };

  const createPO = async () => {
    if (!poForm.itemDescription || !poForm.unitPrice) return;
    setPoState("saving"); setPoError("");
    try {
      await api.createPurchaseOrder(session.token, req.dbId, {
        itemDescription: poForm.itemDescription, quantity: Number(poForm.quantity) || 1,
        unitPrice: Number(poForm.unitPrice), expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
      });
      setPoState("done");
    } catch (err) {
      setPoState("error");
      setPoError(err.message || "Couldn't create the purchase order.");
    }
  };

  const bookDelivery = async () => {
    if (!deliveryForm.provider) return;
    setDeliveryState("saving"); setDeliveryError("");
    try {
      const d = await api.bookDelivery(session.token, req.dbId, deliveryForm);
      setDelivery(d);
      setDeliveryState("done");
    } catch (err) {
      setDeliveryState("error");
      setDeliveryError(err.message || "Couldn't book delivery.");
    }
  };

  const advanceDelivery = async (status) => {
    try {
      const d = await api.updateDeliveryStatus(session.token, req.dbId, status);
      setDelivery(d);
    } catch (err) {
      setDeliveryError(err.message);
    }
  };

  const actions = ["Find Suppliers", "Compare Suppliers", "Negotiate", "Request Customer Approval", "Mark Purchased", "Send Update"];

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <button onClick={() => setTab("orders")} className="text-sm text-slate-500">← Back to Orders</button>
      <div className="flex items-start justify-between">
        <div><p className="text-xs text-slate-400">{req.id}</p><h2 className="text-2xl font-semibold text-[#0F1C2E]">{req.item}</h2><p className="text-sm text-slate-500 mt-1">{req.customer} · Agent {req.agent}</p></div>
        <div className="flex items-center gap-2"><UrgencyTag urgency={req.urgency} /><StatusBadge status={req.status} /></div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {liveMode ? (
          <>
            <button onClick={() => setShowQuoteForm(s => !s)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50">
              {showQuoteForm ? "Cancel" : "+ Add Quote"}
            </button>
            {!hasQuote && invoiceState !== "done" && (
              <input value={manualSubtotal} onChange={e => setManualSubtotal(e.target.value)} type="number"
                placeholder="Item subtotal (KSh) — no quote on file"
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs w-56" />
            )}
            <button onClick={generateInvoice} disabled={invoiceState === "creating" || invoiceState === "done" || (!hasQuote && !manualSubtotal)}
              className="rounded-lg border border-[#0F1C2E] bg-[#0F1C2E] px-3 py-2 text-xs font-medium text-white hover:bg-[#16283f] disabled:opacity-60">
              {invoiceState === "creating" ? "Generating…" : invoiceState === "done" ? "Invoice generated ✓" : "Generate Invoice"}
            </button>
          </>
        ) : (
          <>
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50">+ Add Quote</button>
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50">Generate Invoice</button>
          </>
        )}
        {actions.map(a => <button key={a} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50">{a}</button>)}
      </div>
      {invoiceState === "error" && <p className="text-xs text-rose-600">{invoiceError}</p>}
      {invoiceState === "done" && <p className="text-xs text-emerald-700">Invoice created and sent to the customer by email/SMS. Request moved to Awaiting Payment.</p>}
      {!liveMode && <p className="text-xs text-slate-400">Actions are illustrative in demo mode — log in with a real admin account to actually generate an invoice or add a quote.</p>}

      {liveMode && showQuoteForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <p className="font-medium text-[#0F1C2E] text-sm">Add a supplier quote</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={quoteForm.supplierId} onChange={e => setQuoteForm(f => ({ ...f, supplierId: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}
            </select>
            <input value={quoteForm.price} onChange={e => setQuoteForm(f => ({ ...f, price: e.target.value }))} type="number"
              placeholder="Price (KSh)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={quoteForm.deliveryEstimate} onChange={e => setQuoteForm(f => ({ ...f, deliveryEstimate: e.target.value }))}
              placeholder="Delivery estimate — e.g. '2-day delivery'" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={quoteForm.warrantyTerms} onChange={e => setQuoteForm(f => ({ ...f, warrantyTerms: e.target.value }))}
              placeholder="Warranty — e.g. '1-year warranty'" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={quoteForm.recommended} onChange={e => setQuoteForm(f => ({ ...f, recommended: e.target.checked }))} />
            Recommend this to the customer now (moves request to Awaiting Approval and notifies them)
          </label>
          {quoteState === "error" && <p className="text-xs text-rose-600">{quoteError}</p>}
          <PrimaryButton className="!py-2 !px-4 !text-xs" disabled={quoteState === "saving"} onClick={submitQuote}>
            {quoteState === "saving" ? "Saving…" : "Save quote"}
          </PrimaryButton>
        </div>
      )}

      {hasQuote && (
        <div>
          <p className="font-medium text-[#0F1C2E] mb-3">Supplier quotations</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Supplier</th><th className="text-left px-4 py-3">Price</th><th className="text-left px-4 py-3">Delivery</th><th className="text-left px-4 py-3">Warranty</th><th className="text-left px-4 py-3">Reliability</th><th className="text-left px-4 py-3">Best value score</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {localQuotes.map((q, i) => (
                  <tr key={i} className={q.supplier === localRecommended ? "bg-emerald-50/50" : ""}>
                    <td className="px-4 py-3 font-medium text-[#0F1C2E]">{q.supplier}</td><td className="px-4 py-3"><Money value={q.price} /></td>
                    <td className="px-4 py-3">{q.delivery}</td><td className="px-4 py-3">{q.warranty}</td><td className="px-4 py-3">{q.reliability}/100</td>
                    <td className="px-4 py-3 font-medium">{q.score} {q.supplier === localRecommended && <Award size={13} className="inline text-emerald-600 ml-1" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">Score shown reflects the supplier's own reliability, delivery and warranty track record. Full price/spec-match weighting applies once multiple quotes are compared.</p>
        </div>
      )}

      {liveMode && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-[#0F1C2E] mb-3">Purchase order</p>
            {poState === "done" ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">Purchase order created.</p>
            ) : (
              <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                <input value={poForm.itemDescription} onChange={e => setPoForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="Item description" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={poForm.quantity} onChange={e => setPoForm(f => ({ ...f, quantity: e.target.value }))} type="number" placeholder="Qty" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input value={poForm.unitPrice} onChange={e => setPoForm(f => ({ ...f, unitPrice: e.target.value }))} type="number" placeholder="Unit price (KSh)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <input value={poForm.expectedDeliveryDate} onChange={e => setPoForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))} type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                {poError && <p className="text-xs text-rose-600">{poError}</p>}
                <SecondaryButton className="w-full !py-2" disabled={poState === "saving"} onClick={createPO}>{poState === "saving" ? "Creating…" : "Create Purchase Order"}</SecondaryButton>
              </div>
            )}
          </div>

          <div>
            <p className="font-medium text-[#0F1C2E] mb-3">Delivery</p>
            {delivery ? (
              <div className="rounded-lg border border-slate-200 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Provider</span><span className="font-medium text-[#0F1C2E]">{delivery.provider}</span></div>
                {delivery.trackingNumber && <div className="flex justify-between"><span className="text-slate-500">Tracking</span><span>{delivery.trackingNumber}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={delivery.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} /></div>
                {deliveryError && <p className="text-xs text-rose-600">{deliveryError}</p>}
                {delivery.status !== "delivered" && (
                  <div className="flex gap-2 pt-2">
                    {delivery.status === "dispatched" && <SecondaryButton className="flex-1 !py-2" onClick={() => advanceDelivery("in_transit")}>Mark In Transit</SecondaryButton>}
                    {delivery.status === "in_transit" && <SecondaryButton className="flex-1 !py-2" onClick={() => advanceDelivery("delivered")}>Mark Delivered</SecondaryButton>}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                <select value={deliveryForm.provider} onChange={e => setDeliveryForm(f => ({ ...f, provider: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {["Manual", "Uber", "G4S", "Fargo Courier", "DHL", "FedEx"].map(p => <option key={p}>{p}</option>)}
                </select>
                <input value={deliveryForm.trackingNumber} onChange={e => setDeliveryForm(f => ({ ...f, trackingNumber: e.target.value }))} placeholder="Tracking number (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={deliveryForm.courierName} onChange={e => setDeliveryForm(f => ({ ...f, courierName: e.target.value }))} placeholder="Courier name (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={deliveryForm.destination} onChange={e => setDeliveryForm(f => ({ ...f, destination: e.target.value }))} placeholder="Delivery destination" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                {deliveryError && <p className="text-xs text-rose-600">{deliveryError}</p>}
                <SecondaryButton className="w-full !py-2" disabled={deliveryState === "saving"} onClick={bookDelivery}>{deliveryState === "saving" ? "Booking…" : "Book Delivery"}</SecondaryButton>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="font-medium text-[#0F1C2E] mb-3">Timeline (immutable audit trail)</p>
        <div className="space-y-3">
          {req.timeline.length === 0 && <p className="text-sm text-slate-400">No events recorded yet.</p>}
          {req.timeline.map(([time, event], i) => (
            <div key={i} className="flex gap-4 text-sm">{time && <span className="text-slate-400 w-14 shrink-0">{time}</span>}<span className="text-slate-700">{event}</span></div>
          ))}
        </div>
      </div>

      {liveMode ? (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-[#0F1C2E] mb-3">Message customer</p>
            <div className="rounded-lg border border-slate-200 p-3 space-y-2 max-h-48 overflow-y-auto mb-2 bg-white">
              {messages.filter(m => m.visibility === "customer").length === 0 && <p className="text-xs text-slate-400">No messages yet.</p>}
              {messages.filter(m => m.visibility === "customer").map(m => (
                <div key={m.id} className="text-xs"><span className="font-medium text-[#0F1C2E]">{m.sender?.name || "You"}:</span> <span className="text-slate-600">{m.body}</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && postNote(reply, "customer")}
                placeholder="Reply to customer" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <SecondaryButton className="!px-3 !py-2" onClick={() => postNote(reply, "customer")}>Send</SecondaryButton>
            </div>
          </div>
          <div>
            <p className="font-medium text-[#0F1C2E] mb-3">Internal notes <span className="text-xs font-normal text-slate-400">(never visible to customer)</span></p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 max-h-48 overflow-y-auto mb-2">
              {messages.filter(m => m.visibility === "internal").length === 0 && <p className="text-xs text-slate-400">No internal notes yet.</p>}
              {messages.filter(m => m.visibility === "internal").map(m => (
                <div key={m.id} className="text-xs"><span className="font-medium text-[#0F1C2E]">{m.sender?.name || "You"}:</span> <span className="text-slate-700">{m.body}</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && postNote(note, "internal")}
                placeholder="Add an internal note…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <SecondaryButton className="!px-3 !py-2" onClick={() => postNote(note, "internal")}>Add</SecondaryButton>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium text-[#0F1C2E] mb-3">Internal notes <span className="text-xs font-normal text-slate-400">(never visible to customer)</span></p>
          <textarea rows={3} placeholder="Add an internal note… (log in for real to save this)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </div>
      )}
    </div>
  );
}

function AdminSuppliers() {
  return (
    <div className="p-8">
      <div className="grid md:grid-cols-3 gap-5">
        {SUPPLIERS.map(s => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[#0F1C2E]">{s.name}</p>
              {s.verified && <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5 flex items-center gap-1"><ShieldCheck size={11} /> Verified</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">{s.category} · {s.location}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[["Reliability", s.reliability], ["Price competitiveness", s.price], ["Delivery", s.delivery], ["Warranty", s.warranty]].map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-slate-500 mb-1"><span>{k}</span><span>{v}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#0F8B75]" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-500"><span>{s.deals} completed deals</span><span>{s.complaints} complaints</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAgents({ session }) {
  const [agents, setAgents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdCreds, setCreatedCreds] = useState(null);

  const refresh = () => api.getAgents(session.token).then(setAgents).catch(err => setError(err.message));
  React.useEffect(() => { refresh(); }, []);

  const createAgent = async () => {
    if (!form.name || !form.email || !form.phone) return;
    setCreating(true); setError("");
    try {
      const result = await api.createAgent(session.token, form);
      setCreatedCreds(result);
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message || "Couldn't create the agent.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-[#0F1C2E]">Agents</p>
        <SecondaryButton onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ Create Agent"}</SecondaryButton>
      </div>

      {createdCreds && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Agent created: <b>{createdCreds.email}</b> — temporary password <b>{createdCreds.tempPassword}</b> (also sent to them by email/SMS). This won't be shown again.
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 max-w-md">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <PrimaryButton className="w-full" disabled={creating} onClick={createAgent}>{creating ? "Creating…" : "Create agent"}</PrimaryButton>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Agent</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Active orders</th><th className="text-left px-4 py-3">Completed</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {agents.map(a => (
              <tr key={a.id}><td className="px-4 py-3 font-medium text-[#0F1C2E]">{a.name}</td><td className="px-4 py-3">{a.email}</td><td className="px-4 py-3">{a.active}</td><td className="px-4 py-3">{a.completed}</td></tr>
            ))}
            {agents.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No agents yet — create one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDocuments({ session }) {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    api.getAllDocuments(session.token).then(setDocs).catch(err => setError(err.message));
  }, []);

  const download = async (id) => {
    try {
      const { url } = await api.getAdminDocumentDownloadUrl(session.token, id);
      window.open(url, "_blank");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <p className="text-sm text-slate-500 mb-4">Every document uploaded across every request — for audit and review.</p>
      {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">File</th><th className="text-left px-4 py-3">Request</th><th className="text-left px-4 py-3">Uploaded by</th><th className="text-left px-4 py-3">Visibility</th><th className="text-left px-4 py-3">Date</th><th></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(d => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-[#0F1C2E]">{d.fileName}</td>
                <td className="px-4 py-3 text-slate-500">{d.requestRef}</td>
                <td className="px-4 py-3">{d.uploadedBy}</td>
                <td className="px-4 py-3"><span className={`text-[10px] rounded px-1.5 py-0.5 ${d.visibility === "internal" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{d.visibility}</span></td>
                <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><button onClick={() => download(d.id)} className="text-[#0F8B75] font-medium">Download</button></td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No documents uploaded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminInvoices({ invoices, liveMode }) {
  return (
    <div className="p-8">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Invoice</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Reference</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map(inv => (
              <tr key={inv.number}><td className="px-4 py-3 font-medium text-[#0F1C2E]">{inv.number}</td><td className="px-4 py-3">{inv.customer}</td>
                <td className="px-4 py-3 text-slate-500">{inv.reference}</td><td className="px-4 py-3"><Money value={inv.amount} currency={inv.currency} /></td>
                <td className="px-4 py-3"><StatusBadge status={inv.status === "PAID" || inv.status === "Completed" ? "Completed" : "Awaiting Payment"} /></td></tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{liveMode ? "No invoices yet." : "No invoices."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReports() {
  return (
    <div className="p-8 grid md:grid-cols-2 gap-5">
      {[["Orders over time", "Steady week-on-week growth, urgent orders up 12%."], ["Revenue & procurement fees", "Fee revenue tracking ahead of last month by 8%."], ["Supplier performance", "ABC Electronics leads on reliability and delivery speed."], ["Customer savings", "KSh 143,500 saved across completed procurements this quarter."]].map(([t, b]) => (
        <div key={t} className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="font-medium text-[#0F1C2E]">{t}</p>
          <div className="mt-4 h-28 rounded-lg bg-slate-50 flex items-end gap-1 p-2">
            {[40, 55, 35, 70, 60, 90, 75].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#0F8B75]/70" style={{ height: `${h}%` }} />)}
          </div>
          <p className="text-xs text-slate-500 mt-3">{b}</p>
        </div>
      ))}
    </div>
  );
}

function AdminAudit({ logs, liveMode }) {
  return (
    <div className="p-8">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Time</th><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Object</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} className="px-4 py-3 text-slate-700">{c}</td>)}</tr>)}
            {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No audit events yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{liveMode ? "Live from the database — immutable and retained for compliance review." : "Audit events are immutable and retained for compliance review."}</p>
    </div>
  );
}

const DEMO_AUDIT_LOGS = [
  ["09:12", "system", "request.created", "YPM-202609-00142"],
  ["09:25", "admin.collins", "agent.assigned", "YPM-202609-00127"],
  ["11:10", "system", "payment.confirmed", "INV-001829"],
  ["11:15", "admin.collins", "purchase_order.created", "PO-3391"],
  ["07:42", "admin.collins", "invoice.sent", "INV-001842"],
];

function mapLiveOrder(r) {
  const statusLabel = r.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const urgencyLabel = r.urgency.charAt(0) + r.urgency.slice(1).toLowerCase();
  const quotes = (r.quotes || []).map(q => ({
    supplier: q.supplier?.name || "Unknown supplier", price: q.price,
    delivery: q.deliveryEstimate, warranty: q.warrantyTerms,
    reliability: q.supplier?.reliability || 0, score: q.score,
  }));
  const recommended = (r.quotes || []).find(q => q.recommended)?.supplier?.name || null;
  return {
    dbId: r.id, id: r.ref, item: r.item, customer: r.customer?.name || "Unknown", agent: r.agent?.name || "Unassigned",
    status: statusLabel, urgency: urgencyLabel, value: r.quotes?.[0]?.price || 0, currency: r.currency,
    created: r.createdAt.slice(0, 10),
    timeline: (r.events || []).map(e => ["", e.label]),
    quotes, recommended,
  };
}

function AgentSidebar({ tab, setTab, setSession, setNav }) {
  const nav = [["overview", "Assigned Orders", LayoutGrid], ["profile", "Profile", Settings]];
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-[#0F1C2E] text-slate-300 h-full flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white font-semibold text-sm">YP</div><span className="text-sm font-semibold text-white">Agent</span></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === key ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => { setSession(null); setNav("home"); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"><LogOut size={16} /> Log out</button>
      </div>
    </aside>
  );
}

function AgentDashboard({ setNav, setSession, session }) {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [theme, toggleTheme] = useTheme();

  const refresh = () => api.allOrders(session.token).then(data => setOrders(data.map(mapLiveOrder))).catch(err => setError(err.message));
  React.useEffect(() => { refresh(); }, []);

  const selectedReq = orders.find(r => r.id === selected);
  const titles = { overview: "Assigned Orders", workspace: selectedReq?.item || "Workspace", profile: "Profile" };

  const stages = {
    "In progress": orders.filter(r => !["Completed", "Cancelled", "Awaiting Approval", "Awaiting Payment"].includes(r.status)),
    "Awaiting customer": orders.filter(r => ["Awaiting Approval", "Awaiting Payment"].includes(r.status)),
    "Completed": orders.filter(r => r.status === "Completed"),
  };

  return (
    <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
      <AgentSidebar tab={tab} setTab={setTab} setSession={setSession} setNav={setNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} theme={theme} onToggleTheme={toggleTheme} />
        {error && <div className="px-8 py-2 text-xs bg-rose-50 text-rose-700">{error}</div>}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {tab === "overview" && (
            <div className="p-8 space-y-8">
              {Object.entries(stages).map(([label, list]) => (
                <div key={label}>
                  <p className="font-medium text-[#0F1C2E] mb-3">{label} <span className="text-slate-400 font-normal">({list.length})</span></p>
                  <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {list.length === 0 && <p className="text-sm text-slate-400 p-5">Nothing here.</p>}
                    {list.map(r => (
                      <button key={r.id} onClick={() => { setSelected(r.id); setTab("workspace"); }} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
                        <div className="flex items-center gap-3"><UrgencyTag urgency={r.urgency} /><div><p className="text-sm font-medium text-[#0F1C2E]">{r.item}</p><p className="text-xs text-slate-400">{r.id} · {r.customer}</p></div></div>
                        <StatusBadge status={r.status} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "workspace" && <div className="bg-white h-full"><AdminWorkspace req={selectedReq} setTab={setTab} session={session} onChanged={refresh} /></div>}
          {tab === "profile" && <ProfilePanel session={session} />}
        </div>
      </div>
    </div>
  );
}

function SupplierDashboard({ setNav, setSession, session }) {
  const [tab, setTab] = useState("overview");
  const [openRequests, setOpenRequests] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ category: "", location: "", website: "" });
  const [quoteForm, setQuoteForm] = useState({}); // requestId -> {price, deliveryEstimate, warrantyTerms}
  const [quoteState, setQuoteState] = useState({}); // requestId -> "saving" | "done" | error string
  const [error, setError] = useState("");
  const [theme, toggleTheme] = useTheme();

  const refresh = () => {
    api.getOpenRequests(session.token).then(setOpenRequests).catch(err => setError(err.message));
    api.getMySupplierQuotes(session.token).then(setMyQuotes).catch(() => {});
    api.getSupplierProfile(session.token).then(p => { setProfile(p); setProfileForm({ category: p.category, location: p.location, website: p.website || "" }); }).catch(() => {});
  };
  React.useEffect(() => { refresh(); }, []);

  const quotedRequestIds = new Set(myQuotes.map(q => q.requestId));

  const submitQuote = async (requestId) => {
    const f = quoteForm[requestId];
    if (!f?.price || !f?.deliveryEstimate || !f?.warrantyTerms) return;
    setQuoteState(s => ({ ...s, [requestId]: "saving" }));
    try {
      await api.submitSupplierQuote(session.token, requestId, { price: Number(f.price), deliveryEstimate: f.deliveryEstimate, warrantyTerms: f.warrantyTerms });
      setQuoteState(s => ({ ...s, [requestId]: "done" }));
      refresh();
    } catch (err) {
      setQuoteState(s => ({ ...s, [requestId]: err.message || "Failed" }));
    }
  };

  const saveProfile = async () => {
    try {
      await api.updateSupplierProfile(session.token, profileForm);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const titles = { overview: "Open Requests", quotes: "My Quotes", profile: "Company Profile" };
  const nav = [["overview", "Open Requests", ClipboardList], ["quotes", "My Quotes", Receipt], ["profile", "Profile", Settings]];

  return (
    <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-[#0F1C2E] text-slate-300 h-full flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white font-semibold text-sm">YP</div><span className="text-sm font-semibold text-white">Supplier</span></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {nav.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === key ? "bg-white/10 text-white" : "hover:bg-white/5"}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => { setSession(null); setNav("home"); }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} theme={theme} onToggleTheme={toggleTheme} />
        {error && <div className="px-8 py-2 text-xs bg-rose-50 text-rose-700">{error}</div>}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {tab === "overview" && (
            <div className="space-y-4">
              {openRequests.length === 0 && <p className="text-sm text-slate-500">No open requests right now.</p>}
              {openRequests.map(r => {
                const alreadyQuoted = quotedRequestIds.has(r.id);
                const state = quoteState[r.id];
                return (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-2"><p className="font-medium text-[#0F1C2E]">{r.item}</p><UrgencyTag urgency={r.urgency.charAt(0) + r.urgency.slice(1).toLowerCase()} /></div>
                    {r.description && <p className="text-sm text-slate-600 mb-3">{r.description}</p>}
                    <p className="text-xs text-slate-400 mb-3">Qty {r.quantity} · {r.ref}</p>
                    {alreadyQuoted ? (
                      <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1 inline-block">Quote submitted</p>
                    ) : state === "done" ? (
                      <p className="text-xs text-emerald-700">Quote submitted ✓</p>
                    ) : (
                      <div className="grid sm:grid-cols-3 gap-2">
                        <input placeholder="Price (KSh)" type="number" value={quoteForm[r.id]?.price || ""} onChange={e => setQuoteForm(f => ({ ...f, [r.id]: { ...f[r.id], price: e.target.value } }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        <input placeholder="Delivery estimate" value={quoteForm[r.id]?.deliveryEstimate || ""} onChange={e => setQuoteForm(f => ({ ...f, [r.id]: { ...f[r.id], deliveryEstimate: e.target.value } }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        <input placeholder="Warranty terms" value={quoteForm[r.id]?.warrantyTerms || ""} onChange={e => setQuoteForm(f => ({ ...f, [r.id]: { ...f[r.id], warrantyTerms: e.target.value } }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                        {typeof state === "string" && state !== "saving" && <p className="text-xs text-rose-600 sm:col-span-3">{state}</p>}
                        <SecondaryButton className="sm:col-span-3 !py-2" disabled={state === "saving"} onClick={() => submitQuote(r.id)}>{state === "saving" ? "Submitting…" : "Submit quote"}</SecondaryButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {tab === "quotes" && (
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
              {myQuotes.length === 0 && <p className="text-sm text-slate-400 p-5">No quotes submitted yet.</p>}
              {myQuotes.map(q => (
                <div key={q.id} className="flex items-center justify-between px-5 py-4 text-sm">
                  <div><p className="font-medium text-[#0F1C2E]">{q.request.item}</p><p className="text-xs text-slate-400">{q.request.ref}</p></div>
                  <div className="flex items-center gap-3"><Money value={q.price} /><StatusBadge status={q.request.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} /></div>
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && profile && (
            <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Company</span><span className="font-medium text-[#0F1C2E]">{profile.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Verified</span><span>{profile.verified ? <span className="text-emerald-700">Verified ✓</span> : "Pending admin verification"}</span></div>
              <input value={profileForm.category} onChange={e => setProfileForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={profileForm.location} onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))} placeholder="Website" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <SecondaryButton className="w-full !py-2" onClick={saveProfile}>Save</SecondaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageSlotEditor({ session, settingKey, label }) {
  const [currentUrl, setCurrentUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    api.getAdminSiteSettings(session.token).then(async (settings) => {
      const assetId = settings[settingKey];
      if (!assetId) { setCurrentUrl(null); return; }
      const library = await api.getMediaLibrary(session.token);
      const asset = library.find(a => a.id === assetId);
      setCurrentUrl(asset?.url || null);
    }).catch(err => setError(err.message));
  };
  React.useEffect(() => { refresh(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const asset = await api.uploadMedia(session.token, file);
      await api.saveSiteSettings(session.token, { [settingKey]: asset.id });
      refresh();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      await api.saveSiteSettings(session.token, { [settingKey]: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-medium text-[#0F1C2E] mb-3">{label}</p>
      <div className="h-40 rounded-lg bg-slate-100 overflow-hidden mb-3 flex items-center justify-center">
        {currentUrl ? <img src={currentUrl} alt={label} className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">No image set — using default</span>}
      </div>
      {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <label className="flex-1 text-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50 cursor-pointer">
          {uploading ? "Uploading…" : "Upload / Replace"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />
        </label>
        {currentUrl && <button onClick={remove} className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">Remove</button>}
      </div>
    </div>
  );
}

function AdminAppearanceHome({ session }) {
  const slots = [
    ["hero_image_1", "Hero image (primary)"],
    ["hero_image_2", "Hero image (secondary)"],
    ["why_yourplug_image", "Why YourPlug section image"],
    ["contact_image", "Contact section image"],
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {slots.map(([key, label]) => <ImageSlotEditor key={key} session={session} settingKey={key} label={label} />)}
    </div>
  );
}

function AdminAppearanceServices({ session }) {
  const [services, setServices] = useState([]);
  const [library, setLibrary] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", imageAssetId: "", displayOrder: 0, active: true });
  const [error, setError] = useState("");

  const refresh = () => {
    api.getAdminServices(session.token).then(setServices).catch(err => setError(err.message));
    api.getMediaLibrary(session.token).then(setLibrary).catch(() => {});
  };
  React.useEffect(() => { refresh(); }, []);

  const uploadForNewService = async (file) => {
    if (!file) return;
    try {
      const asset = await api.uploadMedia(session.token, file);
      setForm(f => ({ ...f, imageAssetId: asset.id }));
      setLibrary(l => [asset, ...l]);
    } catch (err) {
      setError(err.message);
    }
  };

  const create = async () => {
    if (!form.name || !form.description) return;
    try {
      await api.createService(session.token, { ...form, displayOrder: Number(form.displayOrder) || 0, imageAssetId: form.imageAssetId || undefined });
      setForm({ name: "", description: "", imageAssetId: "", displayOrder: 0, active: true });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (s) => {
    await api.updateService(session.token, s.id, { active: !s.active });
    refresh();
  };
  const remove = async (id) => {
    await api.deleteService(session.token, id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-[#0F1C2E]">Services</p>
        <SecondaryButton onClick={() => setShowForm(s => !s)}>{showForm ? "Cancel" : "+ Add Service"}</SecondaryButton>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 max-w-md">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <input value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} type="number" placeholder="Display order" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <label className="block text-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-[#0F1C2E] hover:bg-slate-50 cursor-pointer">
            {form.imageAssetId ? "Image selected ✓ — click to replace" : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => uploadForNewService(e.target.files?.[0])} />
          </label>
          <PrimaryButton className="w-full" onClick={create}>Create service</PrimaryButton>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {services.length === 0 && <p className="text-sm text-slate-400 p-5">No services yet — the public Services page is showing built-in defaults until you add some here.</p>}
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between px-5 py-4">
            <div><p className="text-sm font-medium text-[#0F1C2E]">{s.name}</p><p className="text-xs text-slate-400">{s.description}</p></div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleActive(s)} className={`text-[10px] rounded px-2 py-1 font-medium ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.active ? "Active" : "Inactive"}</button>
              <button onClick={() => remove(s.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAppearanceBranding({ session }) {
  const [colors, setColors] = useState({ primary_color: "#0F1C2E", secondary_color: "#0F8B75", accent_color: "#F59E0B" });
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    api.getAdminSiteSettings(session.token).then(s => {
      setColors(c => ({
        primary_color: s.primary_color || c.primary_color,
        secondary_color: s.secondary_color || c.secondary_color,
        accent_color: s.accent_color || c.accent_color,
      }));
    }).catch(() => {});
  }, []);

  const save = async () => {
    await api.saveSiteSettings(session.token, colors);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md space-y-5">
      <p className="text-xs text-slate-500">These are stored and available for future theming — the live site currently uses fixed brand colors; wiring these into every component is the next step once you've picked your palette here.</p>
      {[["primary_color", "Primary"], ["secondary_color", "Secondary"], ["accent_color", "Accent"]].map(([key, label]) => (
        <div key={key} className="flex items-center gap-4">
          <input type="color" value={colors[key]} onChange={e => setColors(c => ({ ...c, [key]: e.target.value }))} className="h-10 w-14 rounded border border-slate-300" />
          <div><p className="text-sm font-medium text-[#0F1C2E]">{label}</p><p className="text-xs text-slate-400">{colors[key]}</p></div>
        </div>
      ))}
      <div className="rounded-xl border border-slate-200 p-4 flex gap-2">
        <div className="h-10 flex-1 rounded" style={{ background: colors.primary_color }} />
        <div className="h-10 flex-1 rounded" style={{ background: colors.secondary_color }} />
        <div className="h-10 flex-1 rounded" style={{ background: colors.accent_color }} />
      </div>
      <PrimaryButton onClick={save}>{saved ? "Saved ✓" : "Save branding"}</PrimaryButton>
    </div>
  );
}

function AdminMediaLibrary({ session }) {
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");

  const refresh = () => api.getMediaLibrary(session.token).then(setAssets).catch(err => setError(err.message));
  React.useEffect(() => { refresh(); }, []);

  const remove = async (id) => {
    try {
      await api.deleteMedia(session.token, id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {assets.map(a => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="h-32 bg-slate-100">{a.url && <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />}</div>
            <div className="p-3 text-xs">
              <p className="font-medium text-[#0F1C2E] truncate">{a.fileName}</p>
              <p className="text-slate-400">{a.mimeType} · {(a.sizeBytes / 1024).toFixed(0)} KB</p>
              <p className="text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</p>
              <button onClick={() => remove(a.id)} className="mt-2 text-rose-500 hover:text-rose-700">Delete</button>
            </div>
          </div>
        ))}
        {assets.length === 0 && <p className="text-sm text-slate-400 col-span-full">No images uploaded yet.</p>}
      </div>
    </div>
  );
}

function AdminAppearance({ session }) {
  const [sub, setSub] = useState("home");
  const subs = [["home", "Home"], ["services", "Services"], ["branding", "Branding"], ["media", "Media Library"]];
  return (
    <div className="p-8">
      <div className="flex gap-2 mb-6">
        {subs.map(([key, label]) => (
          <button key={key} onClick={() => setSub(key)} className={`rounded-full px-4 py-1.5 text-sm ${sub === key ? "bg-[#0F1C2E] text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>
        ))}
      </div>
      {sub === "home" && <AdminAppearanceHome session={session} />}
      {sub === "services" && <AdminAppearanceServices session={session} />}
      {sub === "branding" && <AdminAppearanceBranding session={session} />}
      {sub === "media" && <AdminMediaLibrary session={session} />}
    </div>
  );
}

function AdminDashboard({ setNav, setSession, session }) {
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [liveOrders, setLiveOrders] = useState(null);
  const [liveInvoices, setLiveInvoices] = useState(null);
  const [liveLogs, setLiveLogs] = useState(null);
  const [liveError, setLiveError] = useState("");

  const refreshOrders = React.useCallback(() => {
    if (!session.token) return;
    api.allOrders(session.token).then(data => setLiveOrders(data.map(mapLiveOrder))).catch(err => setLiveError(err.message));
    api.allInvoices(session.token).then(data => setLiveInvoices(data.map(inv => ({
      number: inv.number, customer: inv.request.customer?.name || "Unknown", reference: inv.paymentReference,
      amount: inv.total, currency: inv.currency, status: inv.status,
    })))).catch(() => {});
    api.auditLogs(session.token).then(data => setLiveLogs(data.map(l => [
      new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      l.actor?.name || "system", l.action, l.objectId,
    ]))).catch(() => {});
  }, [session.token]);

  React.useEffect(() => { refreshOrders(); }, [refreshOrders]);

  const liveMode = Boolean(session.token);
  const orders = liveMode ? (liveOrders || []) : REQUESTS;
  const invoices = liveMode
    ? (liveInvoices || [])
    : REQUESTS.filter(r => r.value).map((r, i) => ({ number: `INV-${1820 + i}`, customer: r.customer, reference: `YPM-${1820 + i}`, amount: r.value, currency: r.currency, status: ["Awaiting Payment", "Awaiting Approval"].includes(r.status) ? "Awaiting Payment" : "Completed" }));
  const logs = liveMode ? (liveLogs || []) : DEMO_AUDIT_LOGS;
  const selectedReq = orders.find(r => r.id === selected);
  const titles = { overview: "Overview", orders: "Orders", workspace: selectedReq?.item || "Workspace", suppliers: "Suppliers", agents: "Agents", invoices: "Invoices", reports: "Reports", audit: "Audit logs", documents: "Documents", appearance: "Website Appearance" };
  const [theme, toggleTheme] = useTheme();

  return (
    <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
      <AdminSidebar tab={tab} setTab={setTab} setSession={setSession} setNav={setNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} theme={theme} onToggleTheme={toggleTheme} />
        {liveMode && (
          <div className={`px-8 py-2 text-xs ${liveError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {liveError ? `Couldn't load live data: ${liveError}` : "Connected to the live API — showing real data from the database."}
          </div>
        )}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {tab === "overview" && <AdminOverview orders={orders} setTab={setTab} setSelected={setSelected} />}
          {tab === "orders" && <AdminOrders orders={orders} setTab={setTab} setSelected={setSelected} />}
          {tab === "workspace" && <div className="bg-white h-full"><AdminWorkspace req={selectedReq} setTab={setTab} session={session} onChanged={refreshOrders} /></div>}
          {tab === "suppliers" && <AdminSuppliers />}
          {tab === "agents" && <AdminAgents session={session} />}
          {tab === "invoices" && <AdminInvoices invoices={invoices} liveMode={liveMode} />}
          {tab === "reports" && <AdminReports />}
          {tab === "audit" && <AdminAudit logs={logs} liveMode={liveMode} />}
          {tab === "documents" && <AdminDocuments session={session} />}
          {tab === "appearance" && <AdminAppearance session={session} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ROOT                                                                   */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [nav, setNav] = useState("home");
  const [session, setSession] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});
  const [publicServices, setPublicServices] = useState([]);

  React.useEffect(() => {
    api.getPublicSiteSettings().then(setSiteSettings).catch(() => {});
    api.getPublicServices().then(setPublicServices).catch(() => {});
  }, []);

  const handleAuth = (role, data = {}) => {
    setSession({ role, name: data.name || "", token: data.token || null, userId: data.userId || null });
    setNav(role === "admin" ? "admin" : role === "agent" ? "agent" : role === "supplier" ? "supplier" : "dashboard");
  };

  if (session && nav === "dashboard") return <CustomerDashboard setNav={setNav} setSession={setSession} session={session} />;
  if (session && nav === "admin") return <AdminDashboard setNav={setNav} setSession={setSession} session={session} />;
  if (session && nav === "agent") return <AgentDashboard setNav={setNav} setSession={setSession} session={session} />;
  if (session && nav === "supplier") return <SupplierDashboard setNav={setNav} setSession={setSession} session={session} />;

  const pages = {
    home: <HomePage setNav={setNav} siteSettings={siteSettings} />, services: <ServicesPage setNav={setNav} publicServices={publicServices} />,
    international: <InternationalPage setNav={setNav} session={session} />, contact: <ContactPage />, track: <TrackOrderPage />,
    login: <AuthPage mode="login" setNav={setNav} onAuth={handleAuth} />, register: <AuthPage mode="register" setNav={setNav} onAuth={handleAuth} />,
  };

  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen">
      <SiteHeader nav={nav} setNav={setNav} session={session} setSession={setSession} />
      {pages[nav] || pages.home}
      <SiteFooter setNav={setNav} />
    </div>
  );
}
