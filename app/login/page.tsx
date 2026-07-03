import { Suspense } from "react";
import { Package, ClipboardCheck, BarChart3, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Sign in · Goods Return System",
};

const FEATURES = [
  { icon: Package, title: "Fast goods-return entry", desc: "Capture returns with party, broker and quality lines in seconds." },
  { icon: ClipboardCheck, title: "Two-office workflow", desc: "Kalbadevi posts, Bhiwandi confirms receipt — fully tracked." },
  { icon: BarChart3, title: "Live reporting", desc: "Totals by party, reason and month, exportable to CSV." },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/25">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight leading-none">LD SILK MILLS</div>
            <div className="text-xs text-white/70 mt-1">Goods Return System</div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Returns, receiving &amp; reporting — in one place.
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              The modern replacement for the spreadsheet: faster entry, a real audit
              trail across both offices, and instant visibility.
            </p>
          </div>
          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-sm text-white/70">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="h-4 w-4" />
          Authorized staff access only
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight leading-none">LD SILK MILLS</div>
              <div className="text-xs text-muted-foreground mt-1">Goods Return System</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © LD Silk Mills · Internal system
          </p>
        </div>
      </div>
    </main>
  );
}
