import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import type { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

interface Profile {
  uid: string;
  email?: string;
  displayName?: string;
  plan?: "free" | "pro";
  subscription_expires_at?: string | Timestamp | null;
  createdAt?: Timestamp | null;
}

interface Order {
  id: string;
  uid?: string;
  plan?: "monthly" | "yearly";
  status?: "pending" | "paid";
  amount?: number;
  createdAt?: Timestamp | null;
  paidAt?: Timestamp | null;
}

interface Metrics {
  totalUsers: number;
  proUsers: number;
  totalOrdersPaid: number;
  revenueThisMonth: number;
  error: string | null;
}

async function authGuard() {
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  if (!expected) {
    // If no token configured, lock down completely
    notFound();
  }
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (token !== expected) {
    notFound();
  }
}

function toDate(v: string | Timestamp | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate();
  }
  return null;
}

function formatDate(v: string | Timestamp | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(s: string | undefined, len = 10): string {
  if (!s) return "—";
  return s.length > len ? `${s.slice(0, len)}…` : s;
}

async function fetchMetrics(): Promise<Metrics> {
  if (!adminDb) {
    return {
      totalUsers: 0,
      proUsers: 0,
      totalOrdersPaid: 0,
      revenueThisMonth: 0,
      error: "adminDb not initialized",
    };
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const profilesSnap = await adminDb.collection("profile").get();
    let proUsers = 0;
    profilesSnap.forEach((doc) => {
      const data = doc.data() as Profile;
      if (data.plan === "pro") {
        const exp = toDate(data.subscription_expires_at);
        if (exp && exp > now) proUsers++;
      }
    });

    const ordersSnap = await adminDb
      .collection("orders")
      .where("status", "==", "paid")
      .get();

    let totalOrdersPaid = 0;
    let revenueThisMonth = 0;
    ordersSnap.forEach((doc) => {
      const data = doc.data() as Order;
      totalOrdersPaid++;
      const paidAt = toDate(data.paidAt);
      if (paidAt && paidAt >= monthStart) {
        revenueThisMonth += data.amount || 0;
      }
    });

    return {
      totalUsers: profilesSnap.size,
      proUsers,
      totalOrdersPaid,
      revenueThisMonth,
      error: null,
    };
  } catch (err) {
    console.error("[admin] fetchMetrics:", err);
    return {
      totalUsers: 0,
      proUsers: 0,
      totalOrdersPaid: 0,
      revenueThisMonth: 0,
      error: String(err),
    };
  }
}

async function fetchRecentUsers(): Promise<Profile[]> {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection("profile")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();
    return snap.docs.map((d) => ({ ...(d.data() as Profile), uid: d.id }));
  } catch (err) {
    console.error("[admin] fetchRecentUsers:", err);
    return [];
  }
}

async function fetchRecentOrders(): Promise<Order[]> {
  if (!adminDb) return [];
  try {
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    return snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
  } catch (err) {
    console.error("[admin] fetchRecentOrders:", err);
    return [];
  }
}

export default async function AdminPage() {
  await authGuard();

  if (!adminDb) {
    return (
      <div className="mx-auto max-w-5xl px-6 md:px-8 py-12">
        <div
          style={{ background: "#EDE8DF" }}
          className="rounded-2xl p-6"
        >
          <h2 className="font-serif text-lg font-semibold text-stone-900">
            Firebase Admin not configured
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Set FIREBASE_SERVICE_ACCOUNT_KEY in the Vercel environment and
            redeploy.
          </p>
        </div>
      </div>
    );
  }

  const [metrics, users, orders] = await Promise.all([
    fetchMetrics(),
    fetchRecentUsers(),
    fetchRecentOrders(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-8 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Admin
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
          AFA Dashboard
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Access, users &amp; revenue — live from Firestore.
        </p>
      </div>

      {metrics.error && (
        <div
          style={{ background: "#EDE8DF" }}
          className="mb-6 rounded-2xl p-4 text-sm text-stone-600"
        >
          Error: {metrics.error}
        </div>
      )}

      {/* Metrics strip */}
      <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total users" value={metrics.totalUsers.toLocaleString()} />
        <MetricCard label="Pro (active)" value={metrics.proUsers.toLocaleString()} />
        <MetricCard label="Paid orders (all-time)" value={metrics.totalOrdersPaid.toLocaleString()} />
        <MetricCard
          label="Revenue this month"
          value={`${metrics.revenueThisMonth.toLocaleString("vi-VN")} đ`}
        />
      </div>

      {/* Users */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg font-bold text-stone-900">
          Recent users
        </h2>
        <div
          style={{ background: "#EDE8DF" }}
          className="overflow-hidden rounded-2xl"
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ background: "#2d2419" }}
                className="text-left text-xs uppercase tracking-wide text-stone-300"
              >
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Plan</th>
                <th className="px-4 py-2 font-semibold">Expires</th>
                <th className="px-4 py-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-stone-400">
                    No users.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="border-t border-stone-300/70">
                    <td className="px-4 py-2 font-mono text-xs text-stone-700">
                      {u.email || "—"}
                    </td>
                    <td className="px-4 py-2 text-stone-700">
                      {u.displayName || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        style={{
                          background: u.plan === "pro" ? "#C4634E" : "#d6d3cd",
                          color: u.plan === "pro" ? "white" : "#44403c",
                        }}
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {u.plan || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600">
                      {formatDate(u.subscription_expires_at)}
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-bold text-stone-900">
          Recent orders
        </h2>
        <div
          style={{ background: "#EDE8DF" }}
          className="overflow-hidden rounded-2xl"
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ background: "#2d2419" }}
                className="text-left text-xs uppercase tracking-wide text-stone-300"
              >
                <th className="px-4 py-2 font-semibold">Order</th>
                <th className="px-4 py-2 font-semibold">UID</th>
                <th className="px-4 py-2 font-semibold">Plan</th>
                <th className="px-4 py-2 font-semibold">Amount</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-stone-400">
                    No orders.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-stone-300/70">
                    <td className="px-4 py-2 font-mono text-xs text-stone-700">
                      {truncate(o.id, 14)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-stone-700">
                      {truncate(o.uid, 10)}
                    </td>
                    <td className="px-4 py-2 text-stone-700">{o.plan || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs text-stone-700">
                      {o.amount ? `${o.amount.toLocaleString("vi-VN")} đ` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        style={{
                          background: o.status === "paid" ? "#16a34a" : "#d97706",
                          color: "white",
                        }}
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {o.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600">
                      {formatDate(o.paidAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{ background: "#EDE8DF" }}
      className="rounded-2xl px-4 py-4"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-bold text-stone-900">
        {value}
      </p>
    </div>
  );
}
