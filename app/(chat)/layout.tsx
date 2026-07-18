import DashboardLayout from "@/components/dashboard/layout";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
