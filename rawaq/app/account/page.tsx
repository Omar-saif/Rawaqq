import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-2">My Orders</h1>
      <p className="text-muted text-sm mb-8">Signed in as {session.user.email}</p>

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border border-line p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono text-sm">{o.orderNumber}</p>
                <p className="text-xs text-muted">{o.createdAt.toLocaleDateString()}</p>
              </div>
              <span className="text-xs uppercase tracking-wide px-2 py-1 bg-line/50">{o.status.replace(/_/g, " ")}</span>
            </div>
            <div className="text-sm text-muted mb-2">
              {o.items.map((i) => `${i.nameSnapshot} × ${i.quantity}`).join(", ")}
            </div>
            <p className="text-sm font-medium">{formatMoney(o.total)}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-muted text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
