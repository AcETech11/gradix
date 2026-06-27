import { getPlatformPayments } from "@/actions/super-admin/payment-actions";
import { PaymentQueue } from "@/components/super-admin/PaymentQueue";

export const metadata = {
  title: "Manual Payment Verification",
};

export default async function SuperAdminPaymentsPage() {
  const data = await getPlatformPayments();

  return <PaymentQueue pendingCount={data.pendingCount} payments={data.payments} />;
}
