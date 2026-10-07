import { ErrorScreen } from "@/components/ui";
export default function Page() { return <ErrorScreen code="429" title="Slow down" body="Too many requests. Please wait a moment and try again." action={{ href: "/", label: "Back home" }} />; }
