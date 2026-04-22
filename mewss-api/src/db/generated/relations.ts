import { relations } from "drizzle-orm/relations";
import { user, session, account, feed, article, userArticleStates } from "./schema.js";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	articles: many(article),
	feeds: many(feed),
	userArticleStates: many(userArticleStates),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const articleRelations = relations(article, ({one, many}) => ({
	feed: one(feed, {
		fields: [article.feedId],
		references: [feed.id]
	}),
	user: one(user, {
		fields: [article.userId],
		references: [user.id]
	}),
	userArticleStates: many(userArticleStates),
}));

export const feedRelations = relations(feed, ({one, many}) => ({
	articles: many(article),
	user: one(user, {
		fields: [feed.userId],
		references: [user.id]
	}),
}));

export const userArticleStatesRelations = relations(userArticleStates, ({one}) => ({
	user: one(user, {
		fields: [userArticleStates.userId],
		references: [user.id]
	}),
	article: one(article, {
		fields: [userArticleStates.articleId],
		references: [article.id]
	}),
}));