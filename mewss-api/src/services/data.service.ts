import * as dataRepo from "../repositories/data.repository.js";
import type {StarredArticleRow} from "../repositories/data.repository.js";

// Generates a valid OPML 2.0 document from the user's feeds.
export async function buildOpmlForUser(userId: string): Promise<string> {
    const feeds = await dataRepo.getFeedsForExport(userId);

    const outlines = feeds
        .map((f) => {
            const title = escapeXml(f.title ?? new URL(f.url).hostname);
            const url = escapeXml(f.url);
            const desc = f.description ? ` description="${escapeXml(f.description)}"` : "";
            return `        <outline type="rss" text="${title}" title="${title}" xmlUrl="${url}"${desc}/>`;
        })
        .join("\n");

    const now = new Date().toUTCString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>mewss subscriptions</title>
        <dateCreated>${now}</dateCreated>
    </head>
    <body>
${outlines}
    </body>
</opml>`;
}

// Parses all <outline xmlUrl="..."> entries from an OPML string.
// Folder nesting is flattened — only leaf nodes with an xmlUrl are returned.
export function parseOpmlUrls(opml: string): Array<{ url: string; title?: string }> {
    const results: Array<{ url: string; title?: string }> = [];
    const outlineRe = /<outline\s([^>]+)>/gi;
    let match: RegExpExecArray | null;

    while ((match = outlineRe.exec(opml)) !== null) {
        const attrs = match[1];
        const xmlUrl = attrValue(attrs, "xmlUrl");
        if (!xmlUrl) continue;

        try {
            new URL(xmlUrl); // discard malformed URLs
        } catch {
            continue;
        }

        const title = attrValue(attrs, "title") ?? attrValue(attrs, "text");
        results.push({url: xmlUrl, title});
    }

    return results;
}

// Orchestrates an OPML import: parse → dedup → insert.
// Returns { imported, skipped, errors }.
export async function importOpmlForUser(
    opmlText: string,
    userId: string,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const entries = parseOpmlUrls(opmlText);

    if (entries.length === 0) {
        return {imported: 0, skipped: 0, errors: []};
    }

    const seen = new Set(await dataRepo.getFeedUrlsByUser(userId));

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
        if (seen.has(entry.url)) {
            skipped++;
            continue;
        }
        seen.add(entry.url);

        const result = await dataRepo.insertImportedFeed(userId, entry);
        if (result) {
            imported++;
        } else {
            errors.push(entry.url);
        }
    }

    return {imported, skipped, errors};
}

// ─── Starred export ───────────────────────────────────────────────────────────

export async function getStarredArticles(userId: string): Promise<StarredArticleRow[]> {
    return dataRepo.getStarredArticlesByUser(userId);
}

export function buildStarredCsv(rows: StarredArticleRow[]): string {
    const header = "id,title,url,author,publishedAt,content,summary,feedId,starredAt";
    const csvRows = rows.map((r) =>
        [
            csvCell(r.id),
            csvCell(r.title),
            csvCell(r.url),
            csvCell(r.author ?? ""),
            csvCell(r.publishedAt ?? ""),
            csvCell(r.content ?? ""),
            csvCell(r.summary ?? ""),
            csvCell(r.feedId),
            csvCell(r.starredAt ?? ""),
        ].join(","),
    );
    return [header, ...csvRows].join("\r\n");
}

function escapeXml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function csvCell(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function attrValue(attrs: string, name: string): string | undefined {
    const re = new RegExp(`${name}=["']([^"']*)["']`, "i");
    return re.exec(attrs)?.[1];
}