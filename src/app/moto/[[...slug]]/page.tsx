import { landingRoute } from "@/lib/landing-page";
import { resolveVehicle } from "@/lib/seo";

export const dynamic = "force-dynamic";

const route = landingRoute((parts) => resolveVehicle("moto", parts));
export const generateMetadata = route.generateMetadata;
export default route.Page;
