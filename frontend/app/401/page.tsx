import { ErrorScreen } from "@/components/ui";
export default function Page() { return <ErrorScreen code="401" title="Please log in" body="You need to be logged in to see this page." action={{ href: "/login", label: "Log in" }} />; }
