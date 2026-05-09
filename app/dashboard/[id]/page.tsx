import { DashboardView } from "./DashboardView";

export default async function CaregiverDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DashboardView id={id} />;
}
