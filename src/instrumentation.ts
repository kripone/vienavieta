/** Izpildās vienreiz, kad serveris startē. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { checkStorage } = await import("./lib/storage");
  await checkStorage();
}
