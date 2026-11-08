import { landingRoute } from "@/lib/landing-page";
import { resolveVehicle } from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = landingRoute((parts, tr) => resolveVehicle("moto", parts, tr));
export const generateMetadata = route.generateMetadata;
export default route.Page;
