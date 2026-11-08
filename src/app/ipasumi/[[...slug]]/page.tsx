import { landingRoute } from "@/lib/landing-page";
import { resolveProperty } from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = landingRoute(resolveProperty);
export const generateMetadata = route.generateMetadata;
export default route.Page;
