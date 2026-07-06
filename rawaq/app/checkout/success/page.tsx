import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <CheckCircle2 className="mx-auto mb-6 text-success" size={48} />
      <h1 className="font-display text-3xl mb-3">Order confirmed</h1>
      {searchParams.order && (
        <p className="text-muted mb-6">
          Order number <span className="font-mono text-navy">{searchParams.order}</span>
        </p>
      )}
      <p className="text-sm text-muted mb-8">
        We've sent a confirmation to your email. You can track this order from your account.
      </p>
      <Link href="/products" className="btn-primary inline-block">Continue Shopping</Link>
    </div>
  );
}
