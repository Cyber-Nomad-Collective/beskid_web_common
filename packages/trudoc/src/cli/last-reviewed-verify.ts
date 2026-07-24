#!/usr/bin/env node
import { runLastReviewedVerify } from "../verify/last-reviewed";
import { resolveTrudocWebsiteRoot } from "./site-root";

runLastReviewedVerify(resolveTrudocWebsiteRoot(process.argv, import.meta.url));
