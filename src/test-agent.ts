#!/usr/bin/env tsx

/**
 * Test script: runs a full MCP workflow
 *
 * Usage:
 *   STORYLENSES_API_KEY=your-key tsx src/test-agent.ts
 *   STORYLENSES_API_KEY=your-key tsx src/test-agent.ts --url "https://linkedin.com/jobs/view/12345"
 */

import { StoryLensesClient } from "./client.js";

const API_BASE = process.env.STORYLENSES_API_URL || "https://www.storylenses.app";
const API_KEY = process.env.STORYLENSES_API_KEY || "test-key";

const jobUrl = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1];
const jobText = jobUrl
  ? undefined
  : `Senior Frontend Engineer — Acme Corp (Berlin, Remote)

We are looking for a Senior Frontend Engineer to join our product team. You will lead the development of our customer-facing dashboard, working closely with design and backend teams.

Requirements:
- 5+ years of experience with React and TypeScript
- Experience with Next.js and server-side rendering
- Strong understanding of web performance and accessibility
- Experience mentoring junior developers
- Fluent English; German is a plus

Nice to have:
- Experience with design systems
- Background in data visualization
- Contributions to open source

We offer competitive compensation, flexible remote work, and the chance to shape a product used by thousands of professionals across Europe.`;

async function main() {
  const client = new StoryLensesClient(API_BASE, API_KEY);

  console.log("\n=== StoryLenses MCP Test Agent ===\n");

  // Step 1: Analyze Job
  console.log("1. Analyzing job posting...");
  const jobAnalysis = (await client.analyzeJob({
    job_url: jobUrl,
    job_text: jobText,
    locale: "en",
  })) as Record<string, unknown>;
  console.log(`   Job: ${jobAnalysis.jobTitle} at ${jobAnalysis.companyName}`);
  console.log(`   Skills: ${(jobAnalysis.keySkillsRequired as string[])?.join(", ")}`);

  // Step 2: Match Profile
  console.log("\n2. Matching candidate profile...");
  const matchData = (await client.matchProfile({
    job_analysis: jobAnalysis,
    candidate_cv:
      "Senior software engineer with 7 years of experience in React, TypeScript, and Node.js. Led frontend architecture at a fintech startup. Mentored 4 junior developers. Built a design system used across 3 products. Open source contributor (react-query, next-intl).",
    locale: "en",
  })) as Record<string, unknown>;
  console.log(`   Match: ${matchData.matchPercentage}%`);
  console.log(`   Archetype: ${matchData.applicantArchetype}`);
  console.log(`   Suggested narrative: ${matchData.suggestedArchetype}`);

  // Step 3: List archetypes (optional — shows available options)
  console.log("\n3. Available archetypes:");
  const archetypes = (await client.listArchetypes({ locale: "en" })) as Record<string, unknown>;
  const archetypeList = (archetypes.archetypes as Array<{ id: string; name: string }>).slice(0, 3);
  for (const a of archetypeList) {
    console.log(`   - ${a.id}: ${a.name}`);
  }
  console.log(`   ... and ${(archetypes.archetypes as unknown[]).length - 3} more`);

  // Step 4: Generate Letter
  console.log("\n4. Generating cover letter...");
  const letter = (await client.generateLetter({
    job_analysis: jobAnalysis,
    match_data: matchData,
    candidate_name: "Alex Chen",
    archetype: (matchData.suggestedArchetype as string) || "golden-fleece",
    tone: "professional",
    length: "medium",
    locale: "en",
  })) as Record<string, unknown>;
  const letterText = letter.letter_text as string;
  console.log(`   Words: ${(letter.metadata as Record<string, unknown>)?.word_count}`);
  console.log(`   Preview: ${letterText.substring(0, 150)}...`);

  // Step 5: Quality Check
  console.log("\n5. Quality checking...");
  const quality = (await client.qualityCheck({
    letter_text: letterText,
    job_analysis: jobAnalysis,
    locale: "en",
  })) as Record<string, unknown>;
  console.log(`   Score: ${quality.overallScore}/100`);
  console.log(`   Verdict: ${quality.verdict}`);
  const strengths = quality.topStrengths as string[];
  if (strengths?.length) {
    console.log(`   Strengths: ${strengths.join("; ")}`);
  }

  console.log("\n=== Full workflow complete ===\n");
  console.log("Generated letter:\n");
  console.log(letterText);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
