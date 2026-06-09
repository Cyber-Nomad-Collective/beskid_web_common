import { stringify } from "yaml";
import type { NodeContent, ContentBlock } from "./content/schema.js";
import { nodeMetadataToFrontmatter, type NodeMetadata } from "./node/schema.js";

function renderSpecSection(block: Extract<ContentBlock, { type: "specSection" }>): string {
	const titleAttr = block.title ? ` title="${block.title.replace(/"/g, "&quot;")}"` : "";
	const body = block.bodyMd.trim();
	if (!body) {
		return `<SpecSection id="${block.id}"${titleAttr} />\n`;
	}
	return `<SpecSection id="${block.id}"${titleAttr}>\n\n${body}\n\n</SpecSection>\n`;
}

function renderMarkdownProse(
	block: Extract<ContentBlock, { type: "markdownProse" }>,
): string {
	return `${block.bodyMd.trim()}\n\n`;
}

function renderDomainTiles(
	block: Extract<ContentBlock, { type: "domainTiles" }>,
): string {
	const heading = block.props.heading
		? ` heading="${block.props.heading.replace(/"/g, "&quot;")}"`
		: "";
	return `<DomainTiles pathPrefix="${block.props.pathPrefix}"${heading} />\n\n`;
}

function renderTwoColumn(
	block: Extract<ContentBlock, { type: "twoColumn" }>,
): string {
	const left = block.props.left
		.map((w) => {
			if (w.type === "domainTiles") {
				return `<DomainTiles pathPrefix="${w.props.pathPrefix}" heading="${w.props.heading}" />`;
			}
			return "";
		})
		.filter(Boolean)
		.join("\n");
	const right = block.props.right
		.map((w) => {
			if (w.type === "domainTiles") {
				return `<DomainTiles pathPrefix="${w.props.pathPrefix}" heading="${w.props.heading}" />`;
			}
			return "";
		})
		.filter(Boolean)
		.join("\n");
	return `<div class="platform-spec-two-col platform-spec-two-col--gap-${block.props.gap}">\n<div class="platform-spec-two-col__left">\n${left}\n</div>\n<div class="platform-spec-two-col__right">\n${right}\n</div>\n</div>\n\n`;
}

function renderBlock(block: ContentBlock): string {
	switch (block.type) {
		case "specSection":
			return renderSpecSection(block);
		case "markdownProse":
			return renderMarkdownProse(block);
		case "domainTiles":
			return renderDomainTiles(block);
		case "twoColumn":
			return renderTwoColumn(block);
		default: {
			const _x: never = block;
			return _x;
		}
	}
}

export function emitBodyMd(content: NodeContent): string {
	return content.blocks.map(renderBlock).join("").trimEnd();
}

export function emitMdxFile(node: NodeMetadata, content: NodeContent): string {
	const frontmatter = nodeMetadataToFrontmatter(node);
	const yaml = stringify(frontmatter).trimEnd();
	const body = emitBodyMd(content);
	const normalizedBody = body ? `\n${body}\n` : "\n";
	return `---\n${yaml}\n---${normalizedBody}`;
}

export function emitFrontmatterYaml(node: NodeMetadata): string {
	return stringify(nodeMetadataToFrontmatter(node)).trimEnd();
}
