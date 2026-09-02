import { createServerFn } from "@tanstack/react-start";

export const DEMO_EMAIL = "recruiter@skillmatch.demo";
export const DEMO_PASSWORD = "skillmatch-demo-2026";

type DemoCandidate = {
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  years: number;
  education: string;
  overall: number;
  keyword: number;
  semantic: number;
  matched: string[];
  missing: string[];
  summary: string;
  strengths: string;
  concerns: string;
};

type DemoJob = {
  title: string;
  company: string;
  role_summary: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  education_requirement: string;
  raw_text: string;
  candidates: DemoCandidate[];
};

const DEMO_JOBS: DemoJob[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    role_summary:
      "Own the design-system and product surfaces of a data-heavy SaaS dashboard, working closely with design and platform teams.",
    required_skills: ["React", "TypeScript", "CSS", "Testing", "Accessibility"],
    preferred_skills: ["Next.js", "GraphQL", "Design systems", "Playwright"],
    min_experience_years: 5,
    education_requirement: "Bachelor's degree in Computer Science or equivalent experience",
    raw_text:
      "Northwind Labs is hiring a Senior Frontend Engineer to own our analytics dashboard. You will build accessible, well-tested React + TypeScript interfaces, evolve our design system, and partner with backend teams on GraphQL contracts. 5+ years of frontend experience required. Nice to have: Next.js, Playwright, prior design-system ownership.",
    candidates: [
      {
        full_name: "Priya Raghavan",
        email: "priya.raghavan@example.com",
        phone: "+1 415 555 0142",
        skills: ["React", "TypeScript", "CSS", "Testing", "Accessibility", "Design systems", "Playwright"],
        years: 7,
        education: "B.Tech Computer Science, NIT Trichy",
        overall: 92,
        keyword: 95,
        semantic: 90,
        matched: ["React", "TypeScript", "CSS", "Testing", "Accessibility", "Design systems"],
        missing: ["GraphQL"],
        summary:
          "Seven years of product frontend work with two design systems shipped end-to-end; accessibility and testing show up as habits rather than afterthoughts.",
        strengths: "Deep design-system ownership plus a strong automated-testing track record.",
        concerns: "No hands-on GraphQL; has only consumed REST APIs in the last three roles.",
      },
      {
        full_name: "Daniel Okafor",
        email: "d.okafor@example.com",
        phone: "+44 20 7946 0812",
        skills: ["React", "TypeScript", "Next.js", "GraphQL", "CSS"],
        years: 6,
        education: "MSc Software Engineering, University of Manchester",
        overall: 84,
        keyword: 80,
        semantic: 87,
        matched: ["React", "TypeScript", "CSS", "Next.js", "GraphQL"],
        missing: ["Accessibility", "Testing"],
        summary:
          "Strong Next.js and GraphQL background from two consumer products, with clear ownership of performance work.",
        strengths: "Rare combination of GraphQL depth and measurable performance wins.",
        concerns: "Resume never mentions accessibility or automated testing practice.",
      },
      {
        full_name: "Mei-Ling Chen",
        email: "meiling.chen@example.com",
        phone: "+65 8123 4477",
        skills: ["React", "JavaScript", "CSS", "Figma", "Testing"],
        years: 4,
        education: "B.Sc Information Systems, NUS",
        overall: 67,
        keyword: 70,
        semantic: 65,
        matched: ["React", "CSS", "Testing"],
        missing: ["TypeScript", "Accessibility"],
        summary:
          "Solid mid-level frontend engineer with product-design fluency, one year short of the experience bar.",
        strengths: "Unusually strong design collaboration and prototyping speed.",
        concerns: "JavaScript-only codebases so far; TypeScript is listed as familiar, not used.",
      },
      {
        full_name: "Tomás Ferreira",
        email: "tomas.ferreira@example.com",
        phone: "+351 21 555 0198",
        skills: ["Angular", "TypeScript", "RxJS", "CSS"],
        years: 8,
        education: "Licenciatura em Engenharia Informática, Universidade de Lisboa",
        overall: 48,
        keyword: 42,
        semantic: 52,
        matched: ["TypeScript", "CSS"],
        missing: ["React", "Testing", "Accessibility"],
        summary:
          "Experienced enterprise Angular engineer; senior-level engineering judgement but the framework mismatch is real.",
        strengths: "Eight years of large-app architecture and state-management experience.",
        concerns: "No production React; would need a ramp-up period on the core stack.",
      },
    ],
  },
  {
    title: "Data Engineer, Analytics Platform",
    company: "Helios Retail Group",
    role_summary:
      "Build and operate batch and streaming pipelines that feed the retail analytics warehouse used by merchandising teams.",
    required_skills: ["Python", "SQL", "Airflow", "dbt", "AWS"],
    preferred_skills: ["Spark", "Kafka", "Snowflake", "Terraform"],
    min_experience_years: 3,
    education_requirement: "Bachelor's degree in a quantitative or engineering field",
    raw_text:
      "Helios Retail Group seeks a Data Engineer for our analytics platform. You will design Airflow DAGs, model data with dbt, and maintain Python/SQL pipelines on AWS serving merchandising analytics. 3+ years required. Preferred: Spark, Kafka, Snowflake, Terraform.",
    candidates: [
      {
        full_name: "Arjun Mehta",
        email: "arjun.mehta@example.com",
        phone: "+91 98200 41552",
        skills: ["Python", "SQL", "Airflow", "dbt", "AWS", "Snowflake", "Terraform"],
        years: 5,
        education: "B.E. Information Technology, Mumbai University",
        overall: 95,
        keyword: 100,
        semantic: 92,
        matched: ["Python", "SQL", "Airflow", "dbt", "AWS", "Snowflake", "Terraform"],
        missing: ["Kafka"],
        summary:
          "Covers the full required stack and most preferred tooling, with infrastructure-as-code experience the team currently lacks.",
        strengths: "Owned a Snowflake + dbt migration end-to-end, including cost tuning.",
        concerns: "Streaming exposure is limited to a proof of concept.",
      },
      {
        full_name: "Sofia Nowak",
        email: "sofia.nowak@example.com",
        phone: "+48 22 555 0134",
        skills: ["Python", "SQL", "Spark", "Kafka", "AWS"],
        years: 4,
        education: "M.Sc Data Science, Warsaw University of Technology",
        overall: 78,
        keyword: 72,
        semantic: 82,
        matched: ["Python", "SQL", "AWS", "Spark", "Kafka"],
        missing: ["Airflow", "dbt"],
        summary:
          "Streaming-first engineer with real Kafka and Spark production experience, but no Airflow or dbt on the resume.",
        strengths: "Genuine real-time pipeline ownership at retail-scale volumes.",
        concerns: "Orchestration and transformation tooling would both be new.",
      },
      {
        full_name: "Kwame Boateng",
        email: "kwame.boateng@example.com",
        phone: "+233 30 255 0110",
        skills: ["SQL", "Python", "Power BI", "Excel"],
        years: 3,
        education: "B.Sc Statistics, University of Ghana",
        overall: 55,
        keyword: 50,
        semantic: 58,
        matched: ["Python", "SQL"],
        missing: ["Airflow", "dbt", "AWS"],
        summary:
          "Analyst moving toward engineering: strong SQL, but the pipeline and cloud experience is not there yet.",
        strengths: "Excellent analytical SQL and stakeholder-facing reporting work.",
        concerns: "No orchestration, cloud, or production pipeline ownership.",
      },
    ],
  },
  {
    title: "Product Designer (Design Systems)",
    company: "Aster Health",
    role_summary:
      "Lead the component library and interaction patterns for a clinical workflow product used daily by care teams.",
    required_skills: ["Figma", "Design systems", "Prototyping", "Accessibility", "User research"],
    preferred_skills: ["HTML/CSS", "Motion design", "Healthcare domain"],
    min_experience_years: 4,
    education_requirement: "No formal degree requirement; portfolio required",
    raw_text:
      "Aster Health is looking for a Product Designer to lead our design system for clinical workflows. You will own components in Figma, run usability research with care teams, and hold a high accessibility bar. 4+ years product design experience. Portfolio required.",
    candidates: [
      {
        full_name: "Hannah Lindqvist",
        email: "hannah.l@example.com",
        phone: "+46 8 555 0177",
        skills: ["Figma", "Design systems", "Prototyping", "Accessibility", "User research", "HTML/CSS"],
        years: 6,
        education: "BFA Interaction Design, Konstfack",
        overall: 89,
        keyword: 92,
        semantic: 87,
        matched: ["Figma", "Design systems", "Prototyping", "Accessibility", "User research"],
        missing: ["Healthcare domain"],
        summary:
          "Design-system lead with an accessibility-first portfolio and comfort working directly in code.",
        strengths: "Shipped a WCAG-audited component library adopted by four product teams.",
        concerns: "No prior clinical or regulated-domain experience.",
      },
      {
        full_name: "Rafael Duarte",
        email: "rafael.duarte@example.com",
        phone: "+55 11 95555 0121",
        skills: ["Figma", "Prototyping", "Motion design", "User research"],
        years: 4,
        education: "Bacharelado em Design, USP",
        overall: 72,
        keyword: 68,
        semantic: 75,
        matched: ["Figma", "Prototyping", "User research", "Motion design"],
        missing: ["Design systems", "Accessibility"],
        summary:
          "Strong craft and motion work, but has consumed design systems rather than owned one.",
        strengths: "Best-in-batch prototyping and motion storytelling.",
        concerns: "No systems ownership and accessibility is unaddressed.",
      },
      {
        full_name: "Grace Osei",
        email: "grace.osei@example.com",
        phone: "+1 646 555 0193",
        skills: ["Sketch", "Figma", "User research", "Healthcare domain", "Accessibility"],
        years: 9,
        education: "M.A Human-Computer Interaction, Carnegie Mellon",
        overall: 81,
        keyword: 76,
        semantic: 85,
        matched: ["Figma", "User research", "Accessibility", "Healthcare domain"],
        missing: ["Design systems", "Prototyping"],
        summary:
          "Nine years in clinical software with deep research chops; the systems half of the role is the open question.",
        strengths: "Rare domain depth — has run research inside hospital care teams.",
        concerns: "Component-library work is described at a high level only.",
      },
    ],
  },
];

/**
 * Public: makes sure the shared demo recruiter account exists (email pre-confirmed)
 * and is populated with dummy screening data, so the client can sign in immediately.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let userId: string | null = null;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (created?.user) {
    userId = created.user.id;
  } else {
    // Already exists — find it and reset the known password / confirmation.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
    if (!existing) throw new Error(createError?.message ?? "Could not prepare the demo account");
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  }

  const { count } = await supabaseAdmin
    .from("job_descriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) {
    return { seeded: false as const, email: DEMO_EMAIL, password: DEMO_PASSWORD };
  }

  for (const job of DEMO_JOBS) {
    const { data: jd, error: jdError } = await supabaseAdmin
      .from("job_descriptions")
      .insert({
        user_id: userId,
        title: job.title,
        company: job.company,
        raw_text: job.raw_text,
        role_summary: job.role_summary,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        min_experience_years: job.min_experience_years,
        education_requirement: job.education_requirement,
      })
      .select("id")
      .single();
    if (jdError || !jd) throw new Error(jdError?.message ?? "Failed to seed job description");

    const ranked = [...job.candidates].sort((a, b) => b.overall - a.overall);

    for (let index = 0; index < ranked.length; index += 1) {
      const person = ranked[index]!;
      const { data: candidate, error: candidateError } = await supabaseAdmin
        .from("candidates")
        .insert({
          job_description_id: jd.id,
          user_id: userId,
          full_name: person.full_name,
          email: person.email,
          phone: person.phone,
          file_path: `demo/${jd.id}/${person.full_name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          file_name: `${person.full_name.replace(/\s+/g, "_")}_Resume.pdf`,
          raw_text: `${person.full_name} — ${person.education}. ${person.years} years of experience. Skills: ${person.skills.join(", ")}.`,
          parsed_skills: person.skills,
          parsed_education: [{ degree: person.education }],
          parsed_experience: [
            { title: job.title, years: person.years, summary: person.summary },
          ],
          total_experience_years: person.years,
          status: "analyzed",
        })
        .select("id")
        .single();
      if (candidateError || !candidate) {
        throw new Error(candidateError?.message ?? "Failed to seed candidate");
      }

      const { error: matchError } = await supabaseAdmin.from("match_results").insert({
        candidate_id: candidate.id,
        job_description_id: jd.id,
        user_id: userId,
        overall_score: person.overall,
        keyword_score: person.keyword,
        semantic_score: person.semantic,
        matched_skills: person.matched,
        missing_skills: person.missing,
        ai_summary: person.summary,
        strengths: person.strengths,
        concerns: person.concerns,
        rank: index + 1,
      });
      if (matchError) throw new Error(matchError.message);
    }
  }

  return { seeded: true as const, email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
