import { redirect } from "next/navigation";

// The top-tab navigation starts at "Buy Now" — quick bundle purchase and cart dispatch.
export default function DashboardIndexPage() {
  redirect("/dashboard/buy-now");
}
