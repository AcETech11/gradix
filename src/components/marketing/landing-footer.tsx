import Link from "next/link";

const links = [
  ["Features", "#features"],
  ["Workflow", "#workflow"],
  ["Pricing", "#pricing"],
  ["Demo", "/demo"],
  ["Login", "/login"],
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070D1A] px-4 py-10 text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-extrabold text-white">Gradix<span className="text-[#F97316]">.ng</span></p>
          <p className="mt-2 max-w-xl text-sm leading-6">Result management software for Nigerian schools: Excel upload, official report cards, parent result checker, and secure publishing.</p>
          <p className="mt-3 text-xs">Copyright {new Date().getFullYear()} Gradix. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-semibold">
          {links.map(([label, href]) => (
            <Link className="transition hover:text-white" href={href} key={href}>{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
