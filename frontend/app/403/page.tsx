import { ErrorScreen } from "@/components/ui";
export default function Page() { return <ErrorScreen code="403" title="Access denied" body="You don't have permission to view this page." action={{ href: "/dashboard", label: "Go to dashboard" }} />; }
