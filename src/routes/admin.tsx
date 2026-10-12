import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMyStaffRole, type StaffRole } from "@/lib/admin";
import { AdminPanel } from "@/components/admin-panel";

export const Route = createFileRoute("/admin")({
  loader: async (): Promise<{ role: StaffRole }> => {
    let role: StaffRole = "user";
    try {
      role = (await getMyStaffRole()).role;
    } catch {
      role = "user";
    }
    if (role === "user") {
      throw redirect({ to: "/" });
    }
    return { role };
  },
  component: AdminRoute,
});

function AdminRoute() {
  const { role } = Route.useLoaderData();
  return <AdminPanel role={role} />;
}
