import { Suspense } from "react";
import { Package, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Sign in · Goods Return System",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f1e] flex items-center justify-center p-4">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob aurora-1 -left-40 -top-40 h-[36rem] w-[36rem] bg-[#4f46e5]" />
        <div className="aurora-blob aurora-2 -right-32 -top-24 h-[32rem] w-[32rem] bg-[#7c3aed]" />
        <div className="aurora-blob aurora-3 left-1/3 -bottom-40 h-[34rem] w-[34rem] bg-[#2563eb]" />
        <div className="aurora-blob aurora-2 right-1/4 bottom-0 h-[24rem] w-[24rem] bg-[#db2777] opacity-40" />
        {/* subtle grid + darkening vignette */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/20 via-transparent to-[#0a0f1e]/70" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md animate-rise-in">
        <div className="rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/30">
              <Package className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">LD SILK MILLS</h1>
            <p className="text-sm text-muted-foreground">Goods Return System</p>
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
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Authorized staff access only · © LD Silk Mills
        </p>
      </div>
    </main>
  );
}
