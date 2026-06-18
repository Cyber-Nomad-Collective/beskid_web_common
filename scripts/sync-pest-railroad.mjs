#!/usr/bin/env node
/**
 * Parses compiler/crates/beskid_analysis/src/beskid.pest and emits a v2
 * architecture-graph JSON (one astSyntaxNode per rule, contains edges for
 * rule references) to site/spec-content/.spec/architecture/syntax-railroad.json.
 *
 * Pest's operator set is small enough to hand-roll a tokenizer; no JS pest
 * parser exists. Rules become nodes; each reference within a rule body becomes
 * a `contains` edge from the referencing rule to the referenced rule.
 *
 * Modelled on scripts/sync-syntax-ast-kinds.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const pestFile = path.join(
	repoRoot,
	"compiler/crates/beskid_analysis/src/beskid.pest",
);
const outFile = path.join(
	repoRoot,
	"site/spec-content/.spec/architecture/syntax-railroad.json",
);

/** Pest built-ins / implicit terminals that are not user-defined rules. */
const BUILTINS = new Set([
	"SOI",
	"EOI",
	"ANY",
	"NEWLINE",
	"WHITESPACE",
	"ASCII_ALPHA",
	"ASCII_ALPHANUMERIC",
	"ASCII_DIGIT",
	"ASCII_ALPHA_UNDERSCORE",
	"ASCII_NONZERO_DIGIT",
]);

/**
 * Map a pest rule name to an AST syntax family (used by astSyntaxNode props).
 * Returns null for lexical/whitespace rules that don't belong to a syntax family.
 */
function familyForRule(ruleName) {
	// Program structure
	if (
		ruleName === "Program" ||
		ruleName === "ItemList" ||
		ruleName === "ItemWithDocs" ||
		ruleName === "InnerItem"
	) {
		return "Item";
	}
	// Definitions (items)
	const itemRules = new Set([
		"HostDefinition",
		"MacroDefinition",
		"FunctionDefinition",
		"ImplBlock",
		"ExtendTypeDefinition",
		"TypeDefinition",
		"EnumDefinition",
		"ContractDefinition",
		"TestDefinition",
		"AttributeDeclaration",
		"InlineModule",
		"ModuleDeclaration",
		"UseDeclaration",
		"RegistryBlock",
		"ScopeDefinition",
	]);
	if (itemRules.has(ruleName)) return "Item";
	// Statements
	const statementRules = new Set([
		"Block",
		"Statement",
		"LetStatement",
		"TypedLetStatement",
		"InferredLetStatement",
		"ReturnStatement",
		"BreakStatement",
		"ContinueStatement",
		"IfStatement",
		"WhileStatement",
		"ForStatement",
		"WithStatement",
		"LaunchStatement",
		"ExpressionStatement",
		"ElsePart",
	]);
	if (statementRules.has(ruleName)) return "Statement";
	// Expressions
	const expressionRules = new Set([
		"Expression",
		"LambdaExpression",
		"MatchExpression",
		"AssignmentExpression",
		"LogicalOrExpression",
		"LogicalAndExpression",
		"EqualityExpression",
		"ComparisonExpression",
		"AdditionExpression",
		"MultiplicationExpression",
		"UnaryExpression",
		"SpawnUnary",
		"PrefixUnary",
		"PostfixExpression",
		"PostfixOperator",
		"CallOperator",
		"MemberAccess",
		"SubscriptOperator",
		"TryOperator",
		"PrimaryExpression",
		"MacroInvocation",
		"GroupedExpression",
		"BlockExpression",
		"EnumConstructorExpression",
		"StructLiteralExpression",
		"ArrayLiteralExpression",
		"CallExpression",
		"MatchArm",
		"Pattern",
		"EnumPattern",
	]);
	if (expressionRules.has(ruleName)) return "Expression";
	// Types
	const typeRules = new Set([
		"BeskidType",
		"TypeName",
		"ArrayType",
		"FunctionType",
		"ArrowFunctionType",
		"BeskidTypeList",
		"PrimitiveType",
		"GenericParameters",
		"GenericArguments",
	]);
	if (typeRules.has(ruleName)) return "Type";
	return null;
}

/** Map family -> syntaxKind value that exists in SYNTAX_KINDS_BY_FAMILY. */
function syntaxKindForFamily(ruleName) {
	// Expression kinds: ArrayLiteral, Assign, Binary, Block, Call, CodeString, EnumConstructor,
	//   Grouped, Index, Lambda, Literal, MacroInvocation, MacroMetavariable, Match, Member,
	//   Path, Spawn, StructLiteral, Try, Unary
	// Statement kinds: Break, Continue, Expression, For, If, Launch, Let, Return, While, With
	// Item kinds: AttributeDeclaration, ContractDefinition, EnumDefinition, ExtendTypeDefinition,
	//   Function, HostDefinition, InlineModule, MacroDefinition, Method, ModuleDeclaration,
	//   TestDefinition, TypeDefinition, UseDeclaration
	// Type kinds: Array, Complex, Primitive
	const kindMap = {
		// Expression family
		Expression: "Assign",
		LambdaExpression: "Lambda",
		MatchExpression: "Match",
		MatchArm: "Match",
		AssignmentExpression: "Assign",
		AssignmentOperator: "Assign",
		LogicalOrExpression: "Binary",
		LogicalAndExpression: "Binary",
		EqualityExpression: "Binary",
		ComparisonExpression: "Binary",
		AdditionExpression: "Binary",
		MultiplicationExpression: "Binary",
		UnaryExpression: "Unary",
		SpawnUnary: "Spawn",
		PrefixUnary: "Unary",
		PostfixExpression: "Member",
		PostfixOperator: "Member",
		CallOperator: "Call",
		MemberAccess: "Member",
		SubscriptOperator: "Index",
		TryOperator: "Try",
		PrimaryExpression: "Path",
		MacroInvocation: "MacroInvocation",
		MacroMetavariable: "MacroMetavariable",
		GroupedExpression: "Grouped",
		BlockExpression: "Block",
		EnumConstructorExpression: "EnumConstructor",
		enum_constructor_nullary: "EnumConstructor",
		enum_constructor_with_args: "EnumConstructor",
		StructLiteralExpression: "StructLiteral",
		ArrayLiteralExpression: "ArrayLiteral",
		CallExpression: "Call",
		CodeExpression: "CodeString",
		Pattern: "Match",
		EnumPattern: "EnumConstructor",
		Literal: "Literal",
		// Statement family
		Block: "Expression",
		Statement: "Expression",
		LetStatement: "Let",
		TypedLetStatement: "Let",
		InferredLetStatement: "Let",
		ReturnStatement: "Return",
		BreakStatement: "Break",
		ContinueStatement: "Continue",
		IfStatement: "If",
		WhileStatement: "While",
		ForStatement: "For",
		WithStatement: "With",
		LaunchStatement: "Launch",
		ExpressionStatement: "Expression",
		ElsePart: "If",
		// Item family
		Program: "TypeDefinition",
		ItemList: "ModuleDeclaration",
		ItemWithDocs: "ModuleDeclaration",
		InnerItem: "ModuleDeclaration",
		HostDefinition: "HostDefinition",
		MacroDefinition: "MacroDefinition",
		FunctionDefinition: "Function",
		ImplBlock: "TypeDefinition",
		ExtendTypeDefinition: "ExtendTypeDefinition",
		TypeDefinition: "TypeDefinition",
		EnumDefinition: "EnumDefinition",
		ContractDefinition: "ContractDefinition",
		TestDefinition: "TestDefinition",
		AttributeDeclaration: "AttributeDeclaration",
		InlineModule: "InlineModule",
		ModuleDeclaration: "ModuleDeclaration",
		UseDeclaration: "UseDeclaration",
		RegistryBlock: "HostDefinition",
		ScopeDefinition: "HostDefinition",
		// Type family
		BeskidType: "Complex",
		TypeName: "Complex",
		ArrayType: "Array",
		FunctionType: "Complex",
		ArrowFunctionType: "Complex",
		BeskidTypeList: "Complex",
		PrimitiveType: "Primitive",
		GenericParameters: "Complex",
		GenericArguments: "Complex",
	};
	return kindMap[ruleName] ?? null;
}

/**
 * Parse pest file: extract rule names + the references in each rule body.
 * Pest rule definition: `RuleName = ...` or `RuleName = _{ ... }` etc.
 * Rule names are PascalCase or snake_case; references are other rule names.
 */
function parsePest(source) {
	/** Strip comments and string literals so we don't false-match inside them. */
	const cleaned = source
		.replace(/\/\/[^\n]*/g, "")
		.replace(/\/\*[\s\S]*?\*\//g, "");

	const ruleRegex = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([@_!?]?)\{/gm;
	const rules = new Map(); // name -> { silent, atomic, bodyText, refs: Set }
	let match;
	while ((match = ruleRegex.exec(cleaned)) !== null) {
		const name = match[1];
		const modifier = match[2];
		const bodyStart = ruleRegex.lastIndex;
		/** Find the matching closing brace (pest doesn't nest `{}` in bodies except via strings, already stripped). */
		let depth = 1;
		let i = bodyStart;
		while (i < cleaned.length && depth > 0) {
			const ch = cleaned[i];
			if (ch === "{") depth++;
			else if (ch === "}") depth--;
			i++;
		}
		const bodyText = cleaned.slice(bodyStart, i - 1);

		/** Find references: identifiers matching `[A-Z][A-Za-z0-9_]*` that are known rule names. */
		const refs = new Set();
		const refRegex = /\b([A-Z][A-Za-z0-9_]*)\b/g;
		let rm;
		while ((rm = refRegex.exec(bodyText)) !== null) {
			const ref = rm[1];
			if (ref !== name) refs.add(ref);
		}

		rules.set(name, {
			name,
			silent: modifier === "_",
			atomic: modifier === "@",
			bodyText,
			refs,
		});
	}

	return rules;
}

function build() {
	if (!fs.existsSync(pestFile)) {
		console.error(`Pest grammar not found: ${pestFile}`);
		console.error("Ensure the compiler submodule is checked out.");
		process.exit(1);
	}

	const source = fs.readFileSync(pestFile, "utf8");
	const rules = parsePest(source);

	/** Groups for the railroad, matching the pest file's section structure. */
	const groups = [
		{ id: "lexical", label: "Lexical", color: "#60a5fa" },
		{ id: "program", label: "Program", color: "#a78bfa" },
		{ id: "types", label: "Types", color: "#f472b6" },
		{ id: "definitions", label: "Definitions", color: "#4ade80" },
		{ id: "statements", label: "Statements", color: "#fbbf24" },
		{ id: "expressions", label: "Expressions", color: "#34d399" },
	];

	function groupForRule(name) {
		if (familyForRule(name) === "Expression") return "expressions";
		if (familyForRule(name) === "Statement") return "statements";
		if (familyForRule(name) === "Type") return "types";
		if (familyForRule(name) === "Item") return "definitions";
		// Heuristic by section of the grammar
		const ruleNames = [...rules.keys()];
		const idx = ruleNames.indexOf(name);
		if (idx < 0) return "lexical";
		if (name === "Program" || name === "ItemList") return "program";
		if (idx < 40) return "lexical";
		if (idx < 70) return "program";
		if (idx < 90) return "types";
		if (idx < 160) return "definitions";
		if (idx < 190) return "statements";
		return "expressions";
	}

	const nodes = [];
	const edges = [];
	let edgeOrder = 0;

	for (const rule of rules.values()) {
		const family = familyForRule(rule.name);
		/** Only include rules that map to a syntax family AND have a valid syntaxKind. */
		if (!family) continue;
		const syntaxKind = syntaxKindForFamily(rule.name);
		if (!syntaxKind) continue;

		const group = groupForRule(rule.name);
		nodes.push({
			id: rule.name,
			kind: "astSyntaxNode",
			label: rule.name,
			group,
			description: rule.silent
				? `${rule.name} (silent choice — inlines at parse time)`
				: `${rule.name} grammar production`,
			hidden: false,
			props: {
				family,
				syntaxKind,
			},
		});
	}

	/** Edges: feeds (rule references within a body), only between included nodes.
	 * Uses `feeds` (allowed astSyntaxNode -> astSyntaxNode) rather than `contains`
	 * (only allowed from group/workspace/service/specNode). Semantically "A produces B". */
	const nodeIds = new Set(nodes.map((n) => n.id));
	for (const rule of rules.values()) {
		if (!nodeIds.has(rule.name)) continue;
		for (const ref of rule.refs) {
			if (!nodeIds.has(ref)) continue;
			if (BUILTINS.has(ref)) continue;
			edges.push({
				id: `feeds-${rule.name}-${ref}-${edgeOrder++}`,
				kind: "feeds",
				from: rule.name,
				to: ref,
				label: "produces",
				props: {},
			});
		}
	}

	const graph = {
		version: 2,
		title: "Beskid Grammar Railroad",
		description:
			"Grammar production graph derived from compiler/crates/beskid_analysis/src/beskid.pest. Nodes are pest rules; `produces` edges show containment. Entry node: Program.",
		groups,
		nodes,
		edges,
	};

	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	fs.writeFileSync(outFile, `${JSON.stringify(graph, null, 2)}\n`);
	console.log(
		`Wrote ${outFile} (${nodes.length} rules, ${edges.length} contains edges)`,
	);
}

build();
