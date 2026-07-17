import sampleAstJson from "./sample-ast.json";
import sampleFactsJson from "./sample-facts.json";
import sampleRepoJson from "./sample-repo.json";

import type { AstGraphModel, FactsDagModel } from "../types.js";
import type { RepoEntry } from "../../explorer/types.js";

export const sampleAst = sampleAstJson as AstGraphModel;
export const sampleFacts = sampleFactsJson as FactsDagModel;
export const sampleRepo = sampleRepoJson as RepoEntry;

export const SAMPLE_AST = sampleAst;
export const SAMPLE_FACTS_DAG = sampleFacts;
export const SAMPLE_REPO_TREE = sampleRepo;

/** @deprecated Alias of sampleFacts */
export const sampleFactsDag = sampleFacts;
/** @deprecated Alias of sampleRepo */
export const sampleRepoTree = sampleRepo;
