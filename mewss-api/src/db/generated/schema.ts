import { pgTable, unique, text, boolean, timestamp, foreignKey, uuid, varchar, uniqueIndex, index, bigint, integer, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true, mode: 'string' }),
	scope: text(),
	idToken: text("id_token"),
	password: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
});

export const article = pgTable("article", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	feedId: varchar("feed_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	guid: text(),
	title: text().notNull(),
	url: text().notNull(),
	author: text(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	summary: text(),
	identityHash: varchar("identity_hash", { length: 64 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	content: text(),
}, (table) => [
	foreignKey({
			columns: [table.feedId],
			foreignColumns: [feed.id],
			name: "article_feed_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "article_user_id_fkey"
		}).onDelete("cascade"),
	unique("article_identity_hash_key").on(table.identityHash),
]);

export const feed = pgTable("feed", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	url: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	refreshInterval: bigint("refresh_interval", { mode: "number" }).notNull(),
	errorCount: integer("error_count").default(0),
	status: varchar({ length: 50 }).default('active'),
	nextFetchAfter: timestamp("next_fetch_after", { withTimezone: true, mode: 'string' }).defaultNow(),
	forceRefresh: boolean("force_refresh").default(false),
	fetchingAt: timestamp("fetching_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	etag: text(),
	lastModifiedHeader: text("last_modified_header"),
	title: text(),
	description: text(),
}, (table) => [
	uniqueIndex("feed_user_id_url_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.url.asc().nullsLast().op("text_ops")),
	index("idx_feed_next_fetch").using("btree", table.nextFetchAfter.asc().nullsLast().op("timestamptz_ops"), table.status.asc().nullsLast().op("timestamptz_ops"), table.fetchingAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "feed_user_id_fkey"
		}).onDelete("cascade"),
]);

export const schemaMigrations = pgTable("schema_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	version: bigint({ mode: "number" }).primaryKey().notNull(),
	dirty: boolean().notNull(),
});

export const userArticleStates = pgTable("user_article_states", {
	userId: text("user_id").notNull(),
	articleId: uuid("article_id").notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	isStarred: boolean("is_starred").default(false).notNull(),
	starredAt: timestamp("starred_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_user_article_states_starred").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.isStarred.asc().nullsLast().op("bool_ops")).where(sql`(is_starred = true)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_article_states_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.articleId],
			foreignColumns: [article.id],
			name: "user_article_states_article_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.articleId], name: "user_article_states_pkey"}),
]);
