import type { GetServerSideProps } from "next";
import { isAdminRequest } from "@/lib/admin-auth";
import { Toaster } from "@/components/ui/sonner";
import { AdminLogin } from "@/components/admin/login-form";
import { AdminExplorer } from "@/components/admin/explorer";

interface AdminPageProps {
  authed: boolean;
}

export default function AdminPage({ authed }: AdminPageProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {authed ? <AdminExplorer /> : <AdminLogin />}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async ({
  req,
}) => {
  return { props: { authed: isAdminRequest(req) } };
};
