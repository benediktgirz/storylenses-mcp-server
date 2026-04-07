#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { StoryLensesClient } from "./client.js";

const API_BASE = process.env.STORYLENSES_API_URL || "https://www.storylenses.app";
const API_KEY = process.env.STORYLENSES_API_KEY || "";

// Security: validate API URL is HTTPS and points to a known domain
const allowedHosts = ["www.storylenses.app", "storylenses.app", "localhost"];
try {
  const parsedUrl = new URL(API_BASE);
  if (!allowedHosts.includes(parsedUrl.hostname) && !parsedUrl.hostname.endsWith(".storylenses.app")) {
    console.error(`[SECURITY] STORYLENSES_API_URL points to untrusted host: ${parsedUrl.hostname}. Only *.storylenses.app and localhost are allowed.`);
    process.exit(1);
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    console.error(`[SECURITY] STORYLENSES_API_URL must use HTTPS (got ${parsedUrl.protocol})`);
    process.exit(1);
  }
} catch {
  console.error(`[SECURITY] Invalid STORYLENSES_API_URL: ${API_BASE}`);
  process.exit(1);
}

const client = new StoryLensesClient(API_BASE, API_KEY);

const server = new McpServer({
  name: "storylenses",
  version: "0.1.1",
});

// Tool 1: Analyze Job Posting
server.tool(
  "storylenses_analyze_job",
  "Extract 15+ structured fields from a job posting — role requirements, company challenges, culture signals, recruiter priorities",
  {
    job_url: z.string().url().optional().describe("URL of the job posting to analyze"),
    job_text: z.string().optional().describe("Raw text of the job posting (use if no URL)"),
    locale: z.enum(["en", "de", "es", "pt"]).default("en").describe("Response language"),
  },
  async ({ job_url, job_text, locale }) => {
    if (!job_url && !job_text) {
      return { content: [{ type: "text", text: "Error: Provide either job_url or job_text" }] };
    }
    try {
      const result = await client.analyzeJob({ job_url, job_text, locale });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
);

// Tool 2: Match Profile to Job
server.tool(
  "storylenses_match_profile",
  "Match a candidate profile/CV against job data — identifies fit score, matching skills, career gaps, and strongest narrative angle",
  {
    job_analysis: z.object({
      jobTitle: z.string(),
      companyName: z.string(),
      keySkillsRequired: z.array(z.string()).optional(),
      experienceLevel: z.string().optional(),
      jobDeliverable: z.string().optional(),
      companyProblem: z.string().optional(),
      industry: z.string().optional(),
    }).describe("Job analysis output from storylenses_analyze_job"),
    candidate_cv: z.string().describe("Candidate's CV or resume as text"),
    locale: z.enum(["en", "de", "es", "pt"]).default("en").describe("Response language"),
  },
  async ({ job_analysis, candidate_cv, locale }) => {
    try {
      const result = await client.matchProfile({ job_analysis, candidate_cv, locale });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
);

// Tool 3: Generate Cover Letter
server.tool(
  "storylenses_generate_letter",
  "Generate a story-driven cover letter using matched data and a narrative archetype. Supports en/de/es/pt.",
  {
    job_analysis: z.object({
      jobTitle: z.string(),
      companyName: z.string(),
    }).passthrough().describe("Job analysis from storylenses_analyze_job"),
    match_data: z.object({
      matchingSkills: z.array(z.string()).optional(),
      matchPercentage: z.number().optional(),
      applicantArchetype: z.string().optional(),
      whatCanYouDo: z.string().optional(),
      whatNotQualified: z.string().optional(),
      mitigationStrategy: z.string().optional(),
    }).passthrough().describe("Match data from storylenses_match_profile"),
    candidate_name: z.string().describe("Candidate's full name"),
    archetype: z.string().default("golden-fleece").describe("Narrative archetype ID (use storylenses_list_archetypes to see options)"),
    tone: z.enum(["professional", "conversational", "formal", "confident", "analytical", "storytelling", "humble", "technical", "creative"]).default("professional").describe("Writing tone"),
    length: z.enum(["short", "medium", "full"]).default("medium").describe("Letter length: short (150-200 words), medium (250-350), full (400-500)"),
    locale: z.enum(["en", "de", "es", "pt"]).default("en").describe("Output language"),
  },
  async ({ job_analysis, match_data, candidate_name, archetype, tone, length, locale }) => {
    try {
      const result = await client.generateLetter({
        job_analysis, match_data, candidate_name, archetype, tone, length, locale,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
);

// Tool 4: Quality Check
server.tool(
  "storylenses_quality_check",
  "Score and evaluate a cover letter for relevance, narrative strength, and completeness. Returns score 0-100 with actionable feedback.",
  {
    letter_text: z.string().min(200).describe("The cover letter text to evaluate (min 200 characters)"),
    job_analysis: z.object({
      jobTitle: z.string(),
      companyName: z.string(),
    }).passthrough().describe("Job analysis from storylenses_analyze_job"),
    locale: z.enum(["en", "de", "es", "pt"]).default("en").describe("Feedback language"),
  },
  async ({ letter_text, job_analysis, locale }) => {
    try {
      const result = await client.qualityCheck({ letter_text, job_analysis, locale });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
);

// Tool 5: List Archetypes
server.tool(
  "storylenses_list_archetypes",
  "Return available narrative archetypes with descriptions so the agent or user can select a style",
  {
    locale: z.enum(["en", "de", "es", "pt"]).default("en").describe("Description language"),
  },
  async ({ locale }) => {
    try {
      const result = await client.listArchetypes({ locale });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("StoryLenses MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
