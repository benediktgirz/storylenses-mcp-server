/**
 * StoryLenses API Client
 *
 * Wraps the StoryLenses REST API for use by the MCP server.
 * All tool calls go through this client.
 *
 * NOTE: Some endpoints currently require session auth (not API keys).
 * Until the public API layer is built, these return realistic mock data
 * that demonstrates the full workflow. The analyze_job endpoint is live.
 */

interface AnalyzeJobParams {
  job_url?: string;
  job_text?: string;
  locale?: string;
}

interface MatchProfileParams {
  job_analysis: Record<string, unknown>;
  candidate_cv: string;
  locale?: string;
}

interface GenerateLetterParams {
  job_analysis: Record<string, unknown>;
  match_data: Record<string, unknown>;
  candidate_name: string;
  archetype?: string;
  tone?: string;
  length?: string;
  locale?: string;
}

interface QualityCheckParams {
  letter_text: string;
  job_analysis: Record<string, unknown>;
  locale?: string;
}

interface ListArchetypesParams {
  locale?: string;
}

export class StoryLensesClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request(path: string, body: Record<string, unknown>, isFormData = false): Promise<unknown> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    let requestBody: BodyInit;
    if (isFormData) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      requestBody = formData;
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`API error ${response.status}: ${(errorBody as Record<string, string>).error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Analyze a job posting. This endpoint is PUBLIC (no auth required).
   * Calls the live /api/analyze-job-description endpoint.
   */
  async analyzeJob(params: AnalyzeJobParams): Promise<unknown> {
    const body: Record<string, unknown> = {
      locale: params.locale || "en",
    };
    if (params.job_url) body.jobUrl = params.job_url;
    if (params.job_text) body.jobText = params.job_text;

    const result = await this.request("/api/analyze-job-description", body, true);
    return (result as Record<string, unknown>).data || result;
  }

  /**
   * Match candidate profile to job.
   *
   * TODO: Currently returns mock data. The live endpoint requires
   * session auth + stored user profile. The public API will accept
   * CV text directly and create a temporary profile for matching.
   */
  async matchProfile(params: MatchProfileParams): Promise<unknown> {
    // TODO: Implement when public API layer is built
    // The live endpoint at /api/match-profile-to-job requires:
    // 1. Authenticated session (not API key)
    // 2. Profile stored in database (not passed directly)
    // For now, return realistic mock data that demonstrates the workflow

    const jobTitle = (params.job_analysis.jobTitle as string) || "Software Engineer";
    const skills = (params.job_analysis.keySkillsRequired as string[]) || ["JavaScript", "React", "Node.js"];

    return {
      matchingSkills: skills.slice(0, Math.ceil(skills.length * 0.7)),
      missingSkills: skills.slice(Math.ceil(skills.length * 0.7)),
      matchPercentage: 72,
      keyAchievements: "Led migration of legacy system to modern stack, reducing load times by 60%. Mentored 3 junior developers through their first production deployments.",
      whatCanYouDo: `Strong fit for ${jobTitle} role based on demonstrated experience with ${skills.slice(0, 3).join(", ")}. Track record of delivering production systems at scale.`,
      whatNotQualified: "Limited experience with the specific industry vertical. No direct management of teams larger than 5.",
      mitigationStrategy: "Industry-specific knowledge is transferable from adjacent experience. Team leadership demonstrated through mentoring and project coordination.",
      uniqueValue: "Combines deep technical expertise with a proven ability to communicate complex decisions to non-technical stakeholders.",
      applicantArchetype: "problem-solver",
      roleArchetype: "builder",
      archetypeFitScore: 8,
      archetypeFitReasoning: "Candidate's problem-solving orientation aligns well with a role focused on building new systems and solving technical challenges.",
      suggestedArchetype: "dude-with-problem",
      _note: "This is mock data. Live matching requires the public API layer (coming soon).",
    };
  }

  /**
   * Generate a cover letter.
   *
   * TODO: Currently returns mock data. The live endpoint requires
   * session auth + credits. The public API will accept all inputs
   * directly and deduct from API key's credit balance.
   */
  async generateLetter(params: GenerateLetterParams): Promise<unknown> {
    // TODO: Implement when public API layer is built
    // The live endpoint at /api/generate-story requires:
    // 1. Authenticated session
    // 2. Available credits
    // 3. Stored draft with profile + job data
    // For now, return a realistic mock that demonstrates the output structure

    const jobTitle = (params.job_analysis.jobTitle as string) || "Software Engineer";
    const company = (params.job_analysis.companyName as string) || "Acme Corp";
    const name = params.candidate_name || "Alex";
    const archetype = params.archetype || "golden-fleece";

    return {
      letter_text: `Dear Hiring Team at ${company},\n\nThree years ago, I made a deliberate choice that changed the trajectory of my career. I stepped away from a comfortable role at a well-known consultancy to join a startup where nothing worked yet — because I wanted to build systems, not just maintain them.\n\nThat decision taught me something I carry into every role: the most valuable problems are the ones nobody has solved yet. When I read your posting for ${jobTitle}, I recognised the same kind of challenge — a team that needs someone who can see the architecture behind the chaos and build forward from it.\n\nIn my current role, I led the migration of a legacy monolith to a microservices architecture that reduced deployment times from hours to minutes. I mentored three junior engineers through their first production deployments. And I learned that the hardest part of engineering is not writing code — it is making decisions that your future self will thank you for.\n\nI would welcome the opportunity to bring that perspective to ${company}. I am available at your convenience for a conversation about how my experience aligns with what you are building.\n\nBest regards,\n${name}`,
      letter_html: `<p>Dear Hiring Team at ${company},</p><p>Three years ago, I made a deliberate choice that changed the trajectory of my career...</p>`,
      metadata: {
        archetype_used: archetype,
        tone_used: params.tone || "professional",
        word_count: 198,
        locale: params.locale || "en",
        key_themes: ["deliberate growth", "system building", "mentorship"],
      },
      _note: "This is mock data. Live generation requires the public API layer (coming soon).",
    };
  }

  /**
   * Quality-check a cover letter.
   *
   * TODO: Currently returns mock data. The live endpoint at
   * /api/evaluate-letter requires session auth.
   */
  async qualityCheck(params: QualityCheckParams): Promise<unknown> {
    // TODO: Implement when public API layer is built
    const wordCount = params.letter_text.split(/\s+/).length;
    const mentionsCompany = params.letter_text.toLowerCase().includes(
      ((params.job_analysis.companyName as string) || "").toLowerCase()
    );

    return {
      overallScore: mentionsCompany ? 78 : 62,
      verdict: mentionsCompany
        ? "Solid letter with good company-specific context. Narrative structure could be stronger."
        : "Letter lacks specific connection to the target company. Add concrete references to their challenges.",
      pillars: [
        {
          name: "HR Intelligence",
          score: mentionsCompany ? 82 : 58,
          strengths: mentionsCompany
            ? ["Addresses company by name", "References specific role requirements"]
            : ["Professional tone"],
          weaknesses: mentionsCompany
            ? ["Could reference more specific company challenges"]
            : ["No company-specific references", "Generic opening"],
          suggestion: "Reference a specific company initiative or challenge from the job posting.",
        },
        {
          name: "Self-Reflection",
          score: 75,
          strengths: ["Includes concrete achievement", "Shows self-awareness"],
          weaknesses: ["Could better connect experience to role requirements"],
          suggestion: "Draw a clearer line between your past achievements and the role's specific needs.",
        },
        {
          name: "Narrative Craft",
          score: 72,
          strengths: ["Has a clear opening hook", "Logical flow"],
          weaknesses: ["Middle section could be tighter", "Closing is generic"],
          suggestion: "End with a specific, forward-looking statement rather than a generic availability note.",
        },
        {
          name: "Honesty & Precision",
          score: 80,
          strengths: ["Specific metrics included", "Authentic voice"],
          weaknesses: ["One claim could use more specificity"],
          suggestion: "Replace any remaining vague claims with specific outcomes.",
        },
      ],
      topStrengths: ["Concrete achievements with metrics", "Professional and authentic tone"],
      keyWeaknesses: [
        mentionsCompany ? "Narrative arc could be stronger" : "Missing company-specific references",
        "Closing paragraph is generic",
      ],
      wordCount,
      _note: "This is mock data. Live evaluation requires the public API layer (coming soon).",
    };
  }

  /**
   * List available narrative archetypes.
   * This is static data — no API call needed.
   */
  async listArchetypes(_params: ListArchetypesParams): Promise<unknown> {
    return {
      archetypes: [
        { id: "golden-fleece", name: "The Golden Fleece", description: "A purposeful quest for a specific goal that transforms the seeker along the way.", best_for: "Candidates with a clear, deliberate career trajectory" },
        { id: "buddy-love", name: "Buddy Love", description: "Transformation through partnership, collaboration, and unexpected alliances.", best_for: "Roles emphasizing teamwork, cross-functional collaboration" },
        { id: "dude-with-problem", name: "Dude with a Problem", description: "An ordinary person thrust into extraordinary circumstances who rises to the challenge.", best_for: "Career changers, crisis managers, people who thrived under pressure" },
        { id: "fool-triumphant", name: "The Fool Triumphant", description: "The underestimated underdog who proves everyone wrong through ingenuity and persistence.", best_for: "Non-traditional candidates, career changers, self-taught professionals" },
        { id: "institutionalized", name: "Institutionalized", description: "Choosing between the security of a group and the pull of individual purpose.", best_for: "People leaving large organizations for startups, or vice versa" },
        { id: "monster-in-house", name: "Monster in the House", description: "Confronting an internal fear or limitation that has been holding you back.", best_for: "Candidates addressing gaps, pivots, or overcoming major challenges" },
        { id: "out-of-bottle", name: "Out of the Bottle", description: "An unexpected opportunity that changed your entire trajectory.", best_for: "People with non-linear careers, unexpected pivots that worked" },
        { id: "rites-of-passage", name: "Rites of Passage", description: "Initiation, learning, and growth through a defining professional experience.", best_for: "Early-career professionals, recent graduates, people entering new fields" },
        { id: "superhero", name: "The Superhero", description: "Discovering and leveraging a unique power, skill, or perspective.", best_for: "Specialists, experts, people with rare or distinctive capabilities" },
        { id: "whydunit", name: "The Whydunit", description: "Investigation, uncovering patterns, and revealing insights others missed.", best_for: "Analysts, researchers, consultants, problem-solvers" },
      ],
      tones: [
        { id: "professional", name: "Professional", description: "Clear, confident, balanced business tone" },
        { id: "conversational", name: "Conversational", description: "Warm, engaging, like talking to a trusted colleague" },
        { id: "formal", name: "Formal", description: "Traditional business language for conservative industries" },
        { id: "confident", name: "Confident", description: "Direct and assertive for competitive or leadership roles" },
        { id: "analytical", name: "Analytical", description: "Evidence-based, data-driven for technical or research roles" },
        { id: "storytelling", name: "Storytelling", description: "Emotional connection through narrative — maximum engagement" },
        { id: "humble", name: "Humble", description: "Modest and understated, letting achievements speak quietly" },
        { id: "technical", name: "Technical", description: "Precise, specialized terminology for engineering/science" },
        { id: "creative", name: "Creative", description: "Vivid, engaging language for creative/design/marketing roles" },
      ],
      supported_locales: ["en", "de", "es", "pt"],
    };
  }
}
