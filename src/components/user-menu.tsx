import { moderationCounts } from "@/lib/moderation";
import { getCurrentUser, isModerator } from "@/lib/session";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <a href="/ielogoties" className="btn">
        Ielogoties
      </a>
    );
  }
  // Saloniem rāda uzņēmuma nosaukumu, privātpersonām vārdu
  const label =
    user.sellerType === "dealer" && user.companyName ? user.companyName : (user.name || user.email).split(" ")[0];
  const mod = isModerator(user) ? await moderationCounts().catch(() => null) : null;
  return (
    <>
      {mod && (
        <a href="/moderacija" className="btn" title="Moderācija">
          ⚑ <span className="hide-sm">Moderācija</span>
          {mod.open > 0 && <span className="badge">{mod.open}</span>}
        </a>
      )}
      <a href="/favoriti" className="btn" title="Favorīti">♥ <span className="hide-sm">Favorīti</span></a>
      <a href="/mani-sludinajumi" className="btn">Mani sludinājumi</a>
      <a href="/profils" className="btn user-btn" title="Mans profils">
        👤 <span>{label}</span>
      </a>
    </>
  );
}
