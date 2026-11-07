import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- uzskaitījumi ----------
export const userRole = pgEnum("user_role", ["user", "moderator", "admin"]);
export const vehicleClass = pgEnum("vehicle_class", ["car", "moto", "camper", "van", "truck"]);
export const listingKind = pgEnum("listing_kind", ["vehicle", "property"]);
export const listingStatus = pgEnum("listing_status", ["active", "pending", "hidden", "sold", "deleted"]);
export const listingSource = pgEnum("listing_source", ["own", "ss.com", "reklama.lv", "mm.lv", "city24.lv", "auto24.lv"]);
export const sellerType = pgEnum("seller_type", ["private", "dealer"]);
export const dealType = pgEnum("deal_type", ["sell", "rent", "day", "buy"]);
export const regionKind = pgEnum("region_kind", ["city", "municipality"]);
export const reportReason = pgEnum("report_reason", ["spam", "fraud", "sold", "wrong", "dup", "bad"]);
export const reportStatus = pgEnum("report_status", ["open", "dismissed", "actioned"]);
export const promotionType = pgEnum("promotion_type", ["bump", "highlight", "top"]);

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- lietotāji un pieteikšanās (Better Auth tabulas) ----------
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  /** Identitāte apstiprināta ar Smart-ID vai eParakstu */
  identityVerifiedAt: timestamp("identity_verified_at", { withTimezone: true }),
  role: userRole("role").notNull().default("user"),
  sellerType: sellerType("seller_type").notNull().default("private"),
  /** Saloniem un aģentūrām: nosaukums, kas redzams sludinājumos */
  companyName: text("company_name"),
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  locale: text("locale").notNull().default("lv"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    token: text("token").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Pieteikšanās veidi: Google, Facebook, Apple u.c. (viens lietotājs var būt piesaistījis vairākus) */
export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId), uniqueIndex("accounts_provider_uq").on(t.providerId, t.accountId)],
);

/** Vienreizējie kodi: e-pasta pieteikšanās saites u.c. */
export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

// ---------- vietas ----------
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  kind: regionKind("kind").notNull(),
});

export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    regionId: integer("region_id").notNull().references(() => regions.id),
    name: text("name").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
  },
  (t) => [uniqueIndex("places_region_name_uq").on(t.regionId, t.name)],
);

// ---------- transporta katalogs ----------
export const makes = pgTable(
  "makes",
  {
    id: serial("id").primaryKey(),
    vehicleClass: vehicleClass("vehicle_class").notNull(),
    name: text("name").notNull(),
    popular: boolean("popular").notNull().default(false),
  },
  (t) => [uniqueIndex("makes_class_name_uq").on(t.vehicleClass, t.name)],
);

export const models = pgTable(
  "models",
  {
    id: serial("id").primaryKey(),
    makeId: integer("make_id").notNull().references(() => makes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("models_make_name_uq").on(t.makeId, t.name)],
);

// ---------- sludinājumi ----------
export const listings = pgTable(
  "listings",
  {
    id: id(),
    kind: listingKind("kind").notNull(),
    status: listingStatus("status").notNull().default("active"),
    source: listingSource("source").notNull().default("own"),
    /** Saite uz oriģinālo sludinājumu citā portālā (ievāktajiem) */
    externalUrl: text("external_url"),
    externalId: text("external_id"),
    /** Vienāda vērtība sludinājumiem, kas apraksta to pašu objektu dažādos portālos */
    groupKey: text("group_key"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    /** Cena veselos eiro */
    price: integer("price").notNull(),
    placeId: integer("place_id").references(() => places.id),
    lat: doublePrecision("lat"),
    lon: doublePrecision("lon"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),

    // transports
    vehicleClass: vehicleClass("vehicle_class"),
    makeId: integer("make_id").references(() => makes.id),
    modelId: integer("model_id").references(() => models.id),
    /** Ja markas vai modeļa nav katalogā */
    makeText: text("make_text"),
    modelText: text("model_text"),
    year: smallint("year"),
    mileageKm: integer("mileage_km"),
    fuel: text("fuel"),
    gearbox: text("gearbox"),
    body: text("body"),
    engineL: numeric("engine_l", { precision: 4, scale: 2 }),
    powerKw: smallint("power_kw"),
    drive: text("drive"),
    color: text("color"),
    vin: text("vin"),

    // nekustamais īpašums
    propertyType: text("property_type"),
    deal: dealType("deal"),
    rooms: smallint("rooms"),
    areaM2: numeric("area_m2", { precision: 10, scale: 1 }),
    landM2: integer("land_m2"),
    floor: smallint("floor"),
    floors: smallint("floors"),
    series: text("series"),
    material: text("material"),
    heating: text("heating"),
    condition: text("condition"),
    builtYear: smallint("built_year"),
    purpose: text("purpose"),
    amenities: text("amenities").array().notNull().default(sql`'{}'::text[]`),

    // izcelšana
    topUntil: timestamp("top_until", { withTimezone: true }),
    highlightUntil: timestamp("highlight_until", { withTimezone: true }),
    bumpedAt: timestamp("bumped_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("listings_feed_idx").on(t.status, t.kind, t.createdAt),
    index("listings_price_idx").on(t.price),
    index("listings_place_idx").on(t.placeId),
    index("listings_vehicle_idx").on(t.vehicleClass, t.makeId, t.modelId, t.year),
    index("listings_property_idx").on(t.propertyType, t.deal),
    index("listings_user_idx").on(t.userId),
    index("listings_group_idx").on(t.groupKey),
    uniqueIndex("listings_external_uq").on(t.source, t.externalId),
  ],
);

export const listingPhotos = pgTable(
  "listing_photos",
  {
    id: id(),
    /** Tukšs, kamēr bilde ir augšupielādēta, bet sludinājums vēl nav saglabāts */
    listingId: text("listing_id").references(() => listings.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** Atslēga failu krātuvē: pilna izmēra bilde (max 1600 px) */
    storageKey: text("storage_key").notNull(),
    /** Sīktēls sarakstiem (max 480 px) */
    thumbKey: text("thumb_key").notNull(),
    position: smallint("position").notNull().default(0),
    width: smallint("width"),
    height: smallint("height"),
    createdAt: createdAt(),
  },
  (t) => [index("photos_listing_idx").on(t.listingId, t.position), index("photos_user_idx").on(t.userId)],
);

export const priceHistory = pgTable(
  "price_history",
  {
    id: serial("id").primaryKey(),
    listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("price_history_listing_idx").on(t.listingId, t.changedAt)],
);

// ---------- lietotāju darbības ----------
export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.listingId] })],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Filtru vērtības tādā pašā formā kā meklēšanas URL parametri */
    filters: jsonb("filters").notNull().$type<Record<string, string | string[]>>(),
    notifyEmail: boolean("notify_email").notNull().default(true),
    notifyPush: boolean("notify_push").notNull().default(false),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("saved_searches_user_idx").on(t.userId)],
);

export const reports = pgTable(
  "reports",
  {
    id: id(),
    listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: reportReason("reason").notNull(),
    note: text("note"),
    status: reportStatus("status").notNull().default("open"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("reports_listing_user_uq").on(t.listingId, t.userId), index("reports_status_idx").on(t.status)],
);

// ---------- ziņas ----------
export const threads = pgTable(
  "threads",
  {
    id: id(),
    listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sellerId: text("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    buyerReadAt: timestamp("buyer_read_at", { withTimezone: true }),
    sellerReadAt: timestamp("seller_read_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("threads_listing_buyer_uq").on(t.listingId, t.buyerId), index("threads_seller_idx").on(t.sellerId)],
);

export const messages = pgTable(
  "messages",
  {
    id: id(),
    threadId: text("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

// ---------- maksas pakalpojumi ----------
export const promotions = pgTable("promotions", {
  id: id(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: promotionType("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  /** Maksājuma ID no maksājumu sistēmas (Stripe, Montonio u.c.) */
  paymentRef: text("payment_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdAt: createdAt(),
});
