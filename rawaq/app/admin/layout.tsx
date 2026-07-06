import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-paper">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
