import { ShieldCheck } from "lucide-react";
import { OfficeLogin } from "@/components/office-login";
import { BrandMark } from "@/components/brand-mark";

export const metadata = {
  title: "Sign in · Goods Return System",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b18] flex items-center justify-center p-4">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob aurora-1 -left-40 -top-40 h-[40rem] w-[40rem] bg-[#4f46e5] opacity-55" />
        <div className="aurora-blob aurora-2 -right-36 -top-28 h-[34rem] w-[34rem] bg-[#7c3aed] opacity-50" />
        <div className="aurora-blob aurora-3 left-1/3 -bottom-44 h-[36rem] w-[36rem] bg-[#2563eb] opacity-50" />
        <div className="aurora-blob aurora-2 right-[18%] bottom-0 h-[22rem] w-[22rem] bg-[#0d9488] opacity-40" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent_40%,rgba(8,11,24,.65)_100%)]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md animate-rise-in">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-[27px] bg-gradient-to-b from-white/70 to-white/5"
          />
          <div className="relative rounded-[26px] border border-white/15 bg-white/[0.96] p-8 shadow-[0_40px_80px_-30px_rgba(4,6,20,.7)] backdrop-blur-xl sm:p-9">
            <div className="mb-7 flex flex-col items-center text-center">
              <BrandMark size={58} chip className="rounded-2xl p-2.5 shadow-md ring-1 ring-black/5" />
              <h1 className="mt-3 text-xl font-bold tracking-tight">LD SILK MILLS</h1>
              <p className="text-sm text-muted-foreground">Goods Return System</p>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select your office to sign in.</p>
            </div>

            <OfficeLogin />
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Authorized staff access only · © LD Silk Mills
        </p>
      </div>
    </main>
  );
}
