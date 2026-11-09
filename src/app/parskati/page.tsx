// /parskati → jaunākais mēneša pārskats.
import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { reportMonths } from "@/lib/report";

export const dynamic = "force-dynamic";

export default async function ReportsIndex() {
  const { lp } = await getT();
  const months = await reportMonths().catch(() => []);
  const ym = months[0]?.ym ?? new Date().toISOString().slice(0, 7);
  redirect(lp(`/parskati/${ym}`));
}
