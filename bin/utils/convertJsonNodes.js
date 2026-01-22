"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertNodeToMarkdown = convertNodeToMarkdown;
exports.convertDocumentToMarkdown = convertDocumentToMarkdown;
function convertNodeToMarkdown(node, ctx = { depth: 0 }) {
    if (!node)
        return "";
    const indent = "  ".repeat(ctx.depth);
    switch (node.type) {
        case "doc":
            return node.content ? node.content.map((n) => convertNodeToMarkdown(n, ctx)).join("") : "";
        case "paragraph": {
            const text = node.content?.map((n) => convertNodeToMarkdown(n, ctx)).join("") || "";
            // Inside list items, don't add extra newlines
            if (ctx.listType)
                return text;
            return text + "\n\n";
        }
        case "heading": {
            const level = node.attrs?.level || 1;
            const text = node.content?.map((n) => convertNodeToMarkdown(n, ctx)).join("") || "";
            return `${"#".repeat(level)} ${text}\n\n`;
        }
        case "bulletList": {
            const items = node.content || [];
            const result = items
                .map((item, i) => convertNodeToMarkdown(item, {
                depth: ctx.depth,
                listType: "bullet",
                itemIndex: i,
            }))
                .join("");
            // Add trailing newline only at top level
            return ctx.depth === 0 ? result + "\n" : result;
        }
        case "orderedList": {
            const items = node.content || [];
            const result = items
                .map((item, i) => convertNodeToMarkdown(item, {
                depth: ctx.depth,
                listType: "ordered",
                itemIndex: i,
            }))
                .join("");
            return ctx.depth === 0 ? result + "\n" : result;
        }
        case "listItem": {
            const prefix = ctx.listType === "ordered" ? `${(ctx.itemIndex || 0) + 1}. ` : "- ";
            const childContent = [];
            for (const child of node.content || []) {
                if (child.type === "bulletList" || child.type === "orderedList") {
                    // Nested list: increase depth
                    childContent.push("\n" +
                        convertNodeToMarkdown(child, {
                            depth: ctx.depth + 1,
                            listType: child.type === "orderedList" ? "ordered" : "bullet",
                        }));
                }
                else {
                    // Inline content (paragraph, text)
                    childContent.push(convertNodeToMarkdown(child, ctx));
                }
            }
            return `${indent}${prefix}${childContent.join("")}\n`;
        }
        case "text":
            return node.text || "";
        case "horizontalRule":
            return "---\n\n";
        default:
            return "";
    }
}
function convertDocumentToMarkdown(content) {
    if (!content)
        return "";
    // Handle the new document structure
    if (content.type === "doc") {
        return convertNodeToMarkdown(content);
    }
    // Fallback for the old structure with attachments
    if (Array.isArray(content.attachments)) {
        return content.attachments
            .map((attachment) => {
            const parsedContent = JSON.parse(attachment.content);
            return convertNodeToMarkdown(parsedContent);
        })
            .join(" \n\n ");
    }
    return "";
}
