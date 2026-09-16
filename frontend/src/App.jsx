import React, { useState, useMemo } from "react";
import {
  ArrowRight, Search, Package, Truck, CheckCircle2, Circle, Clock, ShieldCheck,
  Globe2, Zap, Building2, Menu, X, ChevronRight, Upload, MapPin, Phone, Mail,
  FileText, MessageSquare, Bell, Settings, LogOut, LayoutGrid, ClipboardList,
  Receipt, CreditCard, Users, Wrench, BarChart3, AlertTriangle, Star, Plus,
  Sparkles, Wallet, ChevronDown, Filter, TrendingDown, Award, ShoppingCart, PackageCheck, HandHeart
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

const CATEGORIES = ["Electronics", "Office Equipment", "Furniture", "Industrial Equipment", "Business Supplies", "Auto Parts", "Home Products", "Specialty Items", "International Products", "And more"];

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
          <button onClick={() => setNav("track")} className="text-sm font-medium text-slate-600 hover:text-[#0F1C2E]">Track My Order</button>
          {session ? (
            <button onClick={() => setNav(session.role === "admin" ? "admin" : "dashboard")}
              className="rounded-lg bg-[#0F8B75] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c6f5d]">
              Go to {session.role === "admin" ? "Admin" : "Dashboard"}
            </button>
          ) : (
            <>
              <button onClick={() => setNav("login")} className="text-sm font-medium text-slate-600 hover:text-[#0F1C2E]">Log in</button>
              <button onClick={() => setNav("register")} className="rounded-lg bg-[#0F1C2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#16283f]">Request an Item</button>
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
          <button onClick={() => { setNav("track"); setOpen(false); }} className="block text-sm text-slate-600">Track My Order</button>
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
            <li><button onClick={() => setNav("register")} className="text-sm text-slate-400 hover:text-white">Request an Item</button></li>
            <li><button onClick={() => setNav("track")} className="text-sm text-slate-400 hover:text-white">Track My Order</button></li>
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
  [Search, "We Source", "We search for suitable suppliers and products that match your request.", "bg-sky-500"],
  [BarChart3, "We Compare", "We compare price, specifications, reliability, delivery and warranty.", "bg-amber-500"],
  [CheckCircle2, "You Approve", "We present our recommendation with full pricing for your approval.", "bg-[#0F8B75]"],
  [ShoppingCart, "We Purchase", "Once approved and paid, YourPlug handles the purchase.", "bg-sky-500"],
  [PackageCheck, "We Deliver", "We coordinate delivery to your specified location.", "bg-amber-500"],
];

const WHY_CARDS = [
  [Clock, "Save time", "Stop spending hours searching through suppliers and websites.", "bg-[#0F8B75]"],
  [TrendingDown, "Compare before you buy", "We compare available options before recommending a purchase.", "bg-sky-500"],
  [Search, "We search for you", "We identify suitable sourcing options that match your requirements.", "bg-amber-500"],
  [PackageCheck, "Purchase to delivery", "We help coordinate the whole process, end to end.", "bg-[#0F8B75]"],
  [Globe2, "Local & international", "Procurement beyond your immediate location, with landed-cost estimates.", "bg-sky-500"],
  [HandHeart, "One procurement partner", "One place to manage every request, instead of ten open conversations.", "bg-amber-500"],
];

function HomePage({ setNav }) {
  return (
    <>
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#0F1C2E] via-[#0F1C2E] to-[#0c3b34]">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <Section className="relative py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-4 tracking-wide">Your Personal Procurement Partner</p>
            <h1 className="text-5xl font-semibold tracking-tight text-white leading-[1.08]">Tell us what you need. We handle the procurement.</h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg">We find it, compare it, buy it, and get it to you — for individuals, entrepreneurs and businesses alike.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryButton onClick={() => setNav("register")} className="!bg-[#0F8B75] hover:!bg-[#0c6f5d]">Request an Item</PrimaryButton>
              <button onClick={() => setNav("track")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">Track My Order</button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-amber-300" /> Verified suppliers</div>
              <div className="flex items-center gap-1.5"><Clock size={16} className="text-amber-300" /> Transparent process</div>
            </div>
          </div>
          <div className="relative h-[420px] hidden sm:block">
            <Photo src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=700&q=70" alt="Procurement professional at work"
              className="absolute top-0 right-0 w-72 h-80 rounded-2xl shadow-2xl rotate-2" />
            <Photo src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=70" alt="Delivery package"
              className="absolute bottom-0 left-0 w-52 h-52 rounded-2xl shadow-2xl -rotate-3" />
            <div className="absolute top-10 left-0 w-64 rounded-xl bg-white p-4 shadow-xl">
              <p className="text-[11px] text-slate-400 mb-2">YPM-202609-00127 · HP EliteBook</p>
              <div className="flex items-center gap-2 text-sm text-[#0F1C2E] font-medium"><Circle size={14} className="text-amber-500 fill-amber-500" /> In transit</div>
            </div>
            <div className="absolute bottom-8 right-6 rounded-xl bg-white px-4 py-3 shadow-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#0F8B75]" /><span className="text-xs font-medium text-[#0F1C2E]">Supplier verified</span>
            </div>
          </div>
        </Section>
      </div>

      <Section className="text-center max-w-3xl">
        <p className="text-xl text-slate-700 leading-relaxed">You have something to buy. Instead of spending hours comparing suppliers yourself, hand it to YourPlug — a managed procurement service, not a marketplace.</p>
      </Section>

      <Section>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-xl">A managed process, start to finish.</h2>
        <div className="mt-14 relative">
          <div className="hidden lg:block absolute top-7 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0F8B75] via-sky-400 to-amber-400" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
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

      <Section className="bg-gradient-to-br from-sky-50 via-white to-[#0F8B75]/5 rounded-3xl">
        <Eyebrow>What do you need?</Eyebrow>
        <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-xl">From everyday essentials to specialized business requirements.</h2>
        <p className="mt-3 text-slate-600 max-w-2xl">Tell us what you're looking for and we'll handle the procurement process. These are examples — not a catalogue to browse.</p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            [CATEGORIES[0], "bg-[#0F8B75]/10 text-[#0F8B75]"], [CATEGORIES[1], "bg-sky-100 text-sky-700"], [CATEGORIES[2], "bg-amber-100 text-amber-700"],
            [CATEGORIES[3], "bg-[#0F8B75]/10 text-[#0F8B75]"], [CATEGORIES[4], "bg-sky-100 text-sky-700"], [CATEGORIES[5], "bg-amber-100 text-amber-700"],
            [CATEGORIES[6], "bg-[#0F8B75]/10 text-[#0F8B75]"], [CATEGORIES[7], "bg-sky-100 text-sky-700"], [CATEGORIES[8], "bg-amber-100 text-amber-700"],
          ].map(([c, tone]) => (
            <button key={c} onClick={() => setNav("register")} className={`rounded-xl px-4 py-5 text-sm font-medium text-left hover:-translate-y-0.5 transition-transform ${tone}`}>{c}</button>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Why YourPlug</Eyebrow>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {WHY_CARDS.map(([Icon, title, body, bg]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg} text-white mb-4`}><Icon size={20} /></div>
              <p className="font-medium text-[#0F1C2E]">{title}</p><p className="text-sm text-slate-600 mt-1">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="grid lg:grid-cols-2 gap-12 items-center">
        <Photo src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70" alt="Team reviewing procurement options" className="rounded-2xl h-96 shadow-lg" />
        <div>
          <Eyebrow color="text-sky-600">One managed process</Eyebrow>
          <h2 className="text-3xl font-semibold text-[#0F1C2E]">We do the searching. You make the decision.</h2>
          <p className="mt-4 text-slate-600">No browsing listings, no chasing suppliers, no juggling multiple deliveries. You tell us once, we bring back one clear recommendation, and you approve before anything is purchased.</p>
          <div className="mt-6"><PrimaryButton onClick={() => setNav("register")}>Start a Request</PrimaryButton></div>
        </div>
      </Section>

      <Section className="bg-gradient-to-br from-[#0F8B75]/10 to-sky-50 rounded-3xl">
        <Eyebrow>Individual & business procurement</Eyebrow>
        <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-xl">One platform, whether you're buying for yourself or your business.</h2>
        <p className="mt-4 text-slate-600 max-w-2xl">Individuals get the same sourcing, comparison and delivery process as businesses — register as an individual or a business, and the procurement engine underneath is the same either way.</p>
        <div className="mt-8"><PrimaryButton onClick={() => setNav("register")}>Get started</PrimaryButton></div>
      </Section>

      <Section className="grid lg:grid-cols-2 gap-6">
        <button onClick={() => setNav("services")} className="group relative text-left rounded-2xl overflow-hidden h-64 shadow-sm hover:shadow-lg transition-shadow">
          <Photo src="https://images.unsplash.com/photo-1553413077-190083ec01fb?auto=format&fit=crop&w=800&q=70" alt="Procurement services" className="absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1C2E]/90 via-[#0F1C2E]/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-7">
            <p className="font-medium text-lg text-white">Services</p>
            <p className="text-sm text-slate-200 mt-1">Personal, business, local and urgent procurement.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-300">See services <ChevronRight size={14} /></span>
          </div>
        </button>
        <button onClick={() => setNav("international")} className="group relative text-left rounded-2xl overflow-hidden h-64 shadow-sm hover:shadow-lg transition-shadow">
          <Photo src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=800&q=70" alt="International shipping" className="absolute inset-0 h-full w-full group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c2d4f]/90 via-[#0c2d4f]/30 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-7">
            <p className="font-medium text-lg text-white">International procurement</p>
            <p className="text-sm text-slate-200 mt-1">Sourcing from overseas with an estimated landed cost.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-300">Estimate a cost <ChevronRight size={14} /></span>
          </div>
        </button>
      </Section>

      <Section className="bg-gradient-to-br from-amber-50 via-white to-slate-50 rounded-3xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow color="text-amber-600">About YourPlug</Eyebrow>
            <h2 className="text-3xl font-semibold text-[#0F1C2E] max-w-lg">Technology powered, human managed.</h2>
            <p className="mt-5 text-slate-600 max-w-xl">Procurement shouldn't be stressful. YourPlug Management exists because sourcing, comparing, negotiating and coordinating delivery takes real expertise and real time — time our customers don't have. We combine trained procurement staff with technology that keeps every request transparent, from the first message to final delivery.</p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[["Verified suppliers", "Scored on price, reliability, delivery and warranty."], ["Real staff", "Every request is handled by a person, not left to an algorithm."], ["Full audit trail", "Every status change is logged and available to you."]].map(([t, b]) => (
                <div key={t}><p className="font-medium text-sm text-[#0F1C2E]">{t}</p><p className="text-xs text-slate-500 mt-1">{b}</p></div>
              ))}
            </div>
          </div>
          <Photo src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=70" alt="YourPlug procurement team" className="rounded-2xl h-96 shadow-lg" />
        </div>
      </Section>

      <Section className="bg-[#0F8B75] rounded-3xl text-white">
        <Eyebrow color="text-amber-200">Contact</Eyebrow>
        <h2 className="text-3xl font-semibold">Talk to YourPlug directly.</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <a href="#" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><MessageSquare size={18} /><span className="text-sm font-medium">WhatsApp</span></a>
          <a href="tel:" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><Phone size={18} /><span className="text-sm font-medium">Call us</span></a>
          <a href="mailto:" className="rounded-xl bg-white/10 hover:bg-white/20 p-5 flex items-center gap-3 transition-colors"><Mail size={18} /><span className="text-sm font-medium">Email</span></a>
        </div>
        <p className="mt-4 text-xs text-emerald-100">Contact details shown here are placeholders until YourPlug's real business contact information is configured.</p>
        <button onClick={() => setNav("contact")} className="mt-4 text-sm font-medium text-white underline">Full contact page →</button>
      </Section>

      <Section className="text-center bg-[#0F1C2E] rounded-3xl text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <h2 className="relative text-3xl font-semibold">Stop searching. Start requesting.</h2>
        <div className="relative mt-8 flex justify-center gap-4">
          <PrimaryButton onClick={() => setNav("register")} className="!bg-[#0F8B75] hover:!bg-[#0c6f5d]">Request an Item</PrimaryButton>
          <button onClick={() => setNav("track")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors">Track My Order</button>
        </div>
      </Section>
    </>
  );
}

function ServicesPage({ setNav }) {
  const cards = [
    [Package, "Personal procurement", "Everyday purchases sourced and delivered without the legwork.", "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=70"],
    [Building2, "Business procurement", "Multi-user accounts, spending visibility and monthly statements for organizations.", "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=700&q=70"],
    [Search, "Supplier sourcing", "We identify suitable suppliers based on your requirements.", "https://images.unsplash.com/photo-1553413077-190083ec01fb?auto=format&fit=crop&w=700&q=70"],
    [Globe2, "International procurement", "Sourcing overseas with transparent landed-cost estimates.", "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=700&q=70"],
    [Zap, "Urgent procurement", "Priority handling for time-sensitive requirements.", "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=700&q=70"],
    [PackageCheck, "Delivery coordination", "We coordinate delivery after the purchase is made.", "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=700&q=70"],
  ];
  return (
    <Section>
      <Eyebrow>Services</Eyebrow>
      <h1 className="text-4xl font-semibold text-[#0F1C2E] max-w-2xl">Procurement services for every kind of buyer.</h1>
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
      <div className="mt-12"><PrimaryButton onClick={() => setNav("register")}>Request an Item</PrimaryButton></div>
    </Section>
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
          <Photo src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=800&q=70" alt="Shipping containers at port" className="rounded-2xl h-80 shadow-2xl" />
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
        });
        setNotice("Account created. Check the API server logs for your demo verification codes, then log in below.");
        setLoading(false);
        return;
      }
      const data = await api.login(form.email, form.password);
      const role = data.user.role === "ADMIN" ? "admin" : "customer";
      onAuth(role, { name: data.user.name, token: data.accessToken, role, userId: data.user.id });
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
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setAccountType("INDIVIDUAL")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium text-left ${accountType === "INDIVIDUAL" ? "border-[#0F8B75] bg-[#0F8B75]/5 text-[#0F1C2E]" : "border-slate-200 text-slate-500"}`}>
            Individual
          </button>
          <button type="button" onClick={() => setAccountType("BUSINESS")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium text-left ${accountType === "BUSINESS" ? "border-[#0F8B75] bg-[#0F8B75]/5 text-[#0F1C2E]" : "border-slate-200 text-slate-500"}`}>
            Business
          </button>
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={submit}>
        {isRegister && <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder={accountType === "BUSINESS" ? "Contact person full name" : "Full name"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />}
        <input required type={isRegister ? "email" : "text"} value={form.email} onChange={e => set("email", e.target.value)}
          placeholder={isRegister ? "Email address" : "Email address (seeded demo: james.mwangi@example.com)"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
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

        <input required type="password" value={form.password} onChange={e => set("password", e.target.value)}
          placeholder={isRegister ? "Password (min 8 characters)" : "Password (demo: Password123!)"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
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
      <p className="mt-6 text-xs text-slate-400 leading-relaxed">This calls the real API at <code>{import.meta.env.VITE_API_URL || "http://localhost:4000/api"}</code>. If the backend isn't running, use demo mode instead.</p>
      <button onClick={() => onAuth("customer", { name: "James Mwangi", token: null, role: "customer" })} className="mt-2 text-xs font-medium text-[#0F1C2E] underline block">Continue in demo mode (no backend needed) →</button>
      <button onClick={() => onAuth("admin", { name: "Admin", token: null, role: "admin" })} className="mt-2 text-xs font-medium text-[#0F1C2E] underline block">Preview as admin (demo mode) →</button>
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

function DashTopbar({ title, name }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <h1 className="text-lg font-medium text-[#0F1C2E]">{title}</h1>
      <div className="flex items-center gap-4">
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
          <p className="font-medium text-[#0F1C2E]">Recent activity</p>
          <button onClick={() => setTab("requests")} className="text-sm text-[#0F8B75] font-medium">View all</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {myRequests.map(r => (
            <button key={r.id} onClick={() => { setSelected(r.id); setTab("detail"); }} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-[#0F1C2E]">{r.item}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.id} · {r.created}</p>
              </div>
              <div className="flex items-center gap-3"><UrgencyTag urgency={r.urgency} /><StatusBadge status={r.status} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RequestDetail({ req, setTab }) {
  if (!req) return null;
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <button onClick={() => setTab("requests")} className="text-sm text-slate-500">← Back to My Requests</button>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{req.id}</p>
          <h2 className="text-2xl font-semibold text-[#0F1C2E] mt-1">{req.item}</h2>
        </div>
        <div className="flex items-center gap-2"><UrgencyTag urgency={req.urgency} /><StatusBadge status={req.status} /></div>
      </div>

      {req.quotes.length > 0 && req.status === "Awaiting Approval" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <p className="font-medium text-[#0F1C2E]">Recommended: {req.recommended}</p>
          <p className="text-sm text-slate-600 mt-1">Best overall value based on price, reliability, specifications, delivery and warranty.</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Item price</span><Money value={req.value} /></div>
              <div className="flex justify-between"><span className="text-slate-500">YourPlug fee</span><span>KSh {Math.round(req.value * 0.06).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery fee</span><span>KSh 800</span></div>
              <div className="flex justify-between font-medium pt-2 border-t border-slate-100 mt-2"><span>Total</span><Money value={req.value + Math.round(req.value * 0.06) + 800} /></div>
            </div>
            <div className="flex flex-col gap-2">
              <PrimaryButton icon={CheckCircle2}>Approve & Pay</PrimaryButton>
              <SecondaryButton>Request Another Option</SecondaryButton>
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

      {req.quotes.length > 0 && (
        <div>
          <p className="font-medium text-[#0F1C2E] mb-3">Supplier comparison</p>
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
  const [form, setForm] = useState({ item: "", desc: "", qty: 1, budget: "", urgency: "Normal", delivery: "", scope: "Local" });
  const [aiRun, setAiRun] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdRef, setCreatedRef] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!session.token) {
      // Demo mode — no backend session, so there's nothing real to write to.
      setCreatedRef("YPM-202609-00142");
      setStep(5);
      return;
    }
    setSubmitting(true); setError("");
    try {
      const payload = {
        item: form.item || form.desc.slice(0, 60) || "Untitled request",
        description: form.desc || undefined,
        quantity: Number(form.qty) || 1,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: "KES",
        urgency: form.urgency.toUpperCase(),
        scope: form.scope.toUpperCase(),
        deliveryAddress: form.delivery || undefined,
      };
      const created = await api.createRequest(session.token, payload);
      setCreatedRef(created.ref);
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
        <SecondaryButton className="mt-6" onClick={() => { setStep(1); setForm({ item: "", desc: "", qty: 1, budget: "", urgency: "Normal", delivery: "", scope: "Local" }); setAiRun(false); setCreatedRef(""); }}>Submit another request</SecondaryButton>
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
          <PrimaryButton className="!inline-flex" onClick={() => setAiRun(true)} icon={Sparkles}>Let AI structure this</PrimaryButton>

          {aiRun && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 space-y-2 text-sm">
              <p className="font-medium text-[#0F1C2E] flex items-center gap-2"><Sparkles size={14} className="text-sky-600" /> AI-assisted specification — please review before submitting</p>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <div><span className="text-slate-500">Item</span><p className="font-medium text-[#0F1C2E]">Commercial Display Refrigerator <span className="text-[10px] text-emerald-700 bg-emerald-100 rounded px-1">from your description</span></p></div>
                <div><span className="text-slate-500">Estimated capacity</span><p className="font-medium text-[#0F1C2E]">300–500L <span className="text-[10px] text-emerald-700 bg-emerald-100 rounded px-1">from your description</span></p></div>
                <div><span className="text-slate-500">Purpose</span><p className="font-medium text-[#0F1C2E]">Retail shop <span className="text-[10px] text-sky-700 bg-sky-100 rounded px-1">AI-inferred</span></p></div>
                <div><span className="text-slate-500">Condition</span><p className="font-medium text-[#0F1C2E]">New <span className="text-[10px] text-sky-700 bg-sky-100 rounded px-1">AI-inferred</span></p></div>
              </div>
              <div className="mt-3 rounded-lg bg-white border border-amber-200 px-3 py-2 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> Missing — please confirm: dimensions, voltage, preferred brand
              </div>
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
            <div><label className="text-xs text-slate-500">Procurement scope</label>
              <select value={form.scope} onChange={e => set("scope", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                <option>Local</option><option>International</option>
              </select>
            </div>
          </div>
          <PrimaryButton onClick={() => setStep(2)}>Continue</PrimaryButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-xl font-medium text-[#0F1C2E]">Add supporting information</h2>
          <p className="text-sm text-slate-500">Photos, screenshots, product links, catalogues or existing quotations — anything that helps us find the right match.</p>
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-400">
            <Upload className="mx-auto mb-2" size={22} />
            <p className="text-sm">Drag and drop files, or click to browse</p>
          </div>
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
            {[["Item", form.item || form.desc.slice(0, 60) || "Not specified"], ["Quantity", form.qty], ["Budget", form.budget || "Not specified"], ["Urgency", form.urgency], ["Scope", form.scope], ["Delivery to", form.delivery || "Not specified"]].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3"><span className="text-slate-500">{k}</span><span className="font-medium text-[#0F1C2E]">{v}</span></div>
            ))}
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {!session.token && <p className="text-xs text-amber-700">Demo mode — this will show a success screen but won't actually be saved.</p>}
          <div className="flex justify-between"><SecondaryButton onClick={() => setStep(3)}>Back</SecondaryButton>
            <PrimaryButton onClick={submit} disabled={submitting} icon={CheckCircle2}>{submitting ? "Submitting…" : "Submit request"}</PrimaryButton>
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

  return (
    <div className="flex h-screen">
      <DashSidebar tab={tab} setTab={setTab} setSession={setSession} setNav={setNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} />
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
          {tab === "tracking" && (
            <div className="p-8 space-y-4">
              {myRequests.filter(r => ["In Transit", "Dispatched", "Delivered"].includes(r.status)).map(r => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between mb-4"><p className="font-medium text-[#0F1C2E]">{r.item}</p><StatusBadge status={r.status} /></div>
                  <div className="flex flex-wrap gap-4">
                    {r.steps.map(([label, s], i) => (
                      <div key={i} className="flex items-center gap-2">
                        {s === true ? <CheckCircle2 size={16} className="text-[#0F8B75]" /> : s === "active" ? <Circle size={16} className="text-amber-500 fill-amber-500" /> : <Circle size={16} className="text-slate-300" />}
                        <span className={`text-xs ${s ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "messages" && <MessagesPanel session={session} requests={myRequests} />}
          {tab === "documents" && (
            <div className="p-8">
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {["Purchase order — YPM-202609-00127.pdf", "Supplier invoice — ABC Electronics.pdf", "Proof of delivery — YPM-202608-00098.pdf"].map(d => (
                  <div key={d} className="flex items-center justify-between px-5 py-3.5 text-sm"><span className="flex items-center gap-2 text-slate-700"><FileText size={15} className="text-slate-400" /> {d}</span><button className="text-[#0F8B75] font-medium">Download</button></div>
                ))}
              </div>
            </div>
          )}
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
    ["agents", "Agents", Users], ["invoices", "Invoices", Receipt], ["reports", "Reports", BarChart3],
    ["audit", "Audit Logs", ShieldCheck],
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
  const liveMode = Boolean(session?.token) && Boolean(req?.dbId);

  React.useEffect(() => {
    if (!liveMode) return;
    api.getMessages(session.token, req.dbId).then(setMessages).catch(() => {});
    api.getSuppliers(session.token).then(setSuppliers).catch(() => {});
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

  const actions = ["Find Suppliers", "Compare Suppliers", "Negotiate", "Request Customer Approval", "Create Purchase Order", "Mark Purchased", "Book Delivery", "Send Update"];

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

function AdminAgents() {
  return (
    <div className="p-8">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-3">Agent</th><th className="text-left px-4 py-3">Active orders</th><th className="text-left px-4 py-3">Completed</th><th className="text-left px-4 py-3">Rating</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {AGENTS.map(a => (
              <tr key={a.id}><td className="px-4 py-3 font-medium text-[#0F1C2E]">{a.name}</td><td className="px-4 py-3">{a.active}</td><td className="px-4 py-3">{a.completed}</td>
                <td className="px-4 py-3 flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /> {a.rating}</td></tr>
            ))}
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
  const titles = { overview: "Overview", orders: "Orders", workspace: selectedReq?.item || "Workspace", suppliers: "Suppliers", agents: "Agents", invoices: "Invoices", reports: "Reports", audit: "Audit logs" };

  return (
    <div className="flex h-screen">
      <AdminSidebar tab={tab} setTab={setTab} setSession={setSession} setNav={setNav} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopbar title={titles[tab]} name={session.name} />
        {liveMode && (
          <div className={`px-8 py-2 text-xs ${liveError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {liveError ? `Couldn't load live data: ${liveError}` : "Connected to the live API — showing real data from the database."}
          </div>
        )}
        {!liveMode && <div className="px-8 py-2 text-xs bg-amber-50 text-amber-700">Demo mode — showing sample data, not connected to a backend.</div>}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {tab === "overview" && <AdminOverview orders={orders} setTab={setTab} setSelected={setSelected} />}
          {tab === "orders" && <AdminOrders orders={orders} setTab={setTab} setSelected={setSelected} />}
          {tab === "workspace" && <div className="bg-white h-full"><AdminWorkspace req={selectedReq} setTab={setTab} session={session} onChanged={refreshOrders} /></div>}
          {tab === "suppliers" && <AdminSuppliers />}
          {tab === "agents" && <AdminAgents />}
          {tab === "invoices" && <AdminInvoices invoices={invoices} liveMode={liveMode} />}
          {tab === "reports" && <AdminReports />}
          {tab === "audit" && <AdminAudit logs={logs} liveMode={liveMode} />}
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

  const handleAuth = (role, data = {}) => {
    if (role === "admin") { setSession({ role: "admin", name: data.name || "Admin", token: data.token || null, userId: data.userId || null }); setNav("admin"); }
    else { setSession({ role: "customer", name: data.name || "James Mwangi", token: data.token || null, userId: data.userId || null }); setNav("dashboard"); }
  };

  if (session && nav === "dashboard") return <CustomerDashboard setNav={setNav} setSession={setSession} session={session} />;
  if (session && nav === "admin") return <AdminDashboard setNav={setNav} setSession={setSession} session={session} />;

  const pages = {
    home: <HomePage setNav={setNav} />, services: <ServicesPage setNav={setNav} />,
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
