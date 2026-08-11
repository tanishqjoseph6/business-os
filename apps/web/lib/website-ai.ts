import { createGateway } from "@repo/ai";
import {
  websiteBlueprintSchema,
  type WebsiteBlueprint,
  type WebsiteProjectType,
} from "@repo/types";

const SYSTEM_DESIGNER = `You are VanderBase Website Architect — an elite AI that designs premium, conversion-ready websites.

Return ONLY valid JSON matching the schema. Infer project type, audience, pages, sections, navigation, CTA, typography direction, color palette, and visual style from the brief.

Rules:
- Prefer 3–6 pages for full websites; 1–2 for landing pages.
- Every page needs coherent sections with realistic, specific copy (not lorem ipsum).
- Block types: hero, features, testimonials, pricing, faq, cta, text, gallery, team, contact, footer.
- Block props should include the fields needed to render (headline, subheadline, body, ctaLabel, ctaHref, items[], etc.).
- Color palette: hex colors that feel premium and cohesive.
- Typography: concrete font direction names (e.g. "Editorial serif", "Modern grotesque").
- Give each block a short unique id like "home-hero".
- Keep JSON concise but visually complete.`;

function ensureBlockIds(blueprint: WebsiteBlueprint): WebsiteBlueprint {
  return {
    ...blueprint,
    pages: blueprint.pages.map((page, pageIndex) => ({
      ...page,
      blocks: page.blocks.map((block, blockIndex) => ({
        ...block,
        id:
          block.id?.trim() ||
          `${page.slug || `page-${pageIndex}`}-${block.type}-${blockIndex}`,
        props: block.props ?? {},
      })),
    })),
  };
}

export async function generateWebsiteBlueprint(input: {
  name?: string;
  projectType?: WebsiteProjectType;
  prompt: string;
  template: string;
}): Promise<WebsiteBlueprint> {
  const gateway = createGateway();
  const response = await gateway.completeJson({
    maxTokens: 3500,
    schema: websiteBlueprintSchema,
    messages: [
      { role: "system", content: SYSTEM_DESIGNER },
      {
        role: "user",
        content: [
          input.name ? `Suggested name: ${input.name}` : "Infer a sharp project name.",
          `Preferred type (override if the brief clearly differs): ${input.projectType ?? "website"}`,
          `Template hint: ${input.template}`,
          `Brief:\n${input.prompt}`,
          "Design a complete premium website blueprint.",
        ].join("\n"),
      },
    ],
  });
  return ensureBlockIds(response.data);
}

export async function refineWebsiteBlueprint(input: {
  blueprint: WebsiteBlueprint;
  instruction: string;
}): Promise<WebsiteBlueprint> {
  const gateway = createGateway();
  const response = await gateway.completeJson({
    maxTokens: 3800,
    schema: websiteBlueprintSchema,
    messages: [
      {
        role: "system",
        content: `${SYSTEM_DESIGNER}

You are editing an EXISTING website blueprint. Apply the user's instruction surgically.
- Preserve pages/sections that are still relevant.
- Do not rebuild from scratch unless the instruction requires it.
- Keep brand voice consistent unless asked to change it.
- Return the full updated blueprint.`,
      },
      {
        role: "user",
        content: `Current blueprint JSON:\n${JSON.stringify(input.blueprint)}\n\nEdit instruction:\n${input.instruction}`,
      },
    ],
  });
  return ensureBlockIds(response.data);
}

export async function improveWebsiteBlueprint(input: {
  blueprint: WebsiteBlueprint;
}): Promise<WebsiteBlueprint> {
  const gateway = createGateway();
  const response = await gateway.completeJson({
    maxTokens: 3800,
    schema: websiteBlueprintSchema,
    messages: [
      {
        role: "system",
        content: `${SYSTEM_DESIGNER}

Improve the existing website for premium polish:
- Stronger visual hierarchy and spacing intent
- Sharper typography and color cohesion
- Clearer CTAs and conversion paths
- Better mobile-friendly section structure
- Improved copy without erasing core messaging
Return the full improved blueprint.`,
      },
      {
        role: "user",
        content: `Improve this blueprint:\n${JSON.stringify(input.blueprint)}`,
      },
    ],
  });
  return ensureBlockIds(response.data);
}
