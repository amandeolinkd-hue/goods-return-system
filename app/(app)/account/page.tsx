import { requireUser } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "My Account · Goods Return System" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? "-"}</dd>
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Account" description="Your profile and password." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field label="Role" value={ROLE_LABELS[user.role]} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
