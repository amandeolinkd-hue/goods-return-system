import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Sign in · Goods Return System",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">LD SILK MILLS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Goods Return System</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Authorized staff only.
        </p>
      </div>
    </main>
  );
}
