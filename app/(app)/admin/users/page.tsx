import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CreateUserForm } from "./create-user-form";
import { UserRowActions } from "./user-row-actions";

export const metadata = { title: "Users · Goods Return System" };

export default async function UsersPage() {
  const current = await requireRole("admin");
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage staff accounts and their roles." />

      <Card>
        <CardHeader>
          <CardTitle>Add a user</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All users ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-6">Name</TH>
                <TH className="hidden md:table-cell">Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="hidden lg:table-cell">Created</TH>
                <TH className="text-right pr-6">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD className="pl-6 font-medium">
                    {u.name}
                    {Number(current.id) === u.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TD>
                  <TD className="hidden md:table-cell text-muted-foreground">{u.email}</TD>
                  <TD>{ROLE_LABELS[u.role]}</TD>
                  <TD>
                    {u.active ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="muted">Inactive</Badge>
                    )}
                  </TD>
                  <TD className="hidden lg:table-cell text-muted-foreground">{formatDate(u.createdAt)}</TD>
                  <TD className="pr-6">
                    <UserRowActions
                      userId={u.id}
                      role={u.role}
                      active={u.active}
                      isSelf={Number(current.id) === u.id}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
