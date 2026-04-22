import fs from 'node:fs/promises';

const HARD_LIMITS = {
  artboard: { width: 1080, height: 1350 },
  safePaddingMin: 80,
  fontScale: {
    headlineMin: 52,
    sectionMin: 34,
    bodyMin: 24,
    captionMin: 24,
  },
  contentBlockMax: 5,
};

const ALLOWED_LAYOUT_PROFILES = new Set([
  'single_idea_infographic',
  'stat_poster',
]);

function extractComplianceJson(html) {
  const match = html.match(
    /<script[^>]+id=["']mobile-linkedin-compliance["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match) {
    return null;
  }

  return JSON.parse(match[1]);
}

function countMarkedBlocks(html) {
  return (html.match(/data-content-block=/g) ?? []).length;
}

function validateRequiredFields(contract, errors) {
  const requiredFields = [
    'layout_profile',
    'artboard',
    'safe_padding',
    'font_scale',
    'content_block_count',
    'cta_present',
    'primary_visual_system',
  ];

  for (const field of requiredFields) {
    if (!(field in contract)) {
      errors.push(`Missing required compliance field: ${field}`);
    }
  }
}

export function validateInfographicHtml(
  html,
  { overrideTokenPresent = false } = {},
) {
  const errors = [];
  let contract;

  try {
    contract = extractComplianceJson(html);
  } catch (error) {
    errors.push(`Compliance block is not valid JSON: ${error.message}`);
  }

  if (!contract) {
    errors.push('Missing mobile-linkedin compliance block.');
    return {
      status: overrideTokenPresent ? 'overridden' : 'fail',
      errors,
      contract: null,
    };
  }

  validateRequiredFields(contract, errors);

  if (!ALLOWED_LAYOUT_PROFILES.has(contract.layout_profile)) {
    errors.push(
      `layout_profile must be one of: ${Array.from(ALLOWED_LAYOUT_PROFILES).join(', ')}`,
    );
  }

  if (
    contract.artboard?.width !== HARD_LIMITS.artboard.width ||
    contract.artboard?.height !== HARD_LIMITS.artboard.height
  ) {
    errors.push(
      `Artboard must be exactly ${HARD_LIMITS.artboard.width}x${HARD_LIMITS.artboard.height}.`,
    );
  }

  for (const side of ['top', 'right', 'bottom', 'left']) {
    if ((contract.safe_padding?.[side] ?? 0) < HARD_LIMITS.safePaddingMin) {
      errors.push(
        `Safe padding on ${side} must be at least ${HARD_LIMITS.safePaddingMin}px.`,
      );
    }
  }

  if ((contract.font_scale?.headline_px ?? 0) < HARD_LIMITS.fontScale.headlineMin) {
    errors.push(`font_scale.headline_px must be at least ${HARD_LIMITS.fontScale.headlineMin}px.`);
  }

  if ((contract.font_scale?.section_px ?? 0) < HARD_LIMITS.fontScale.sectionMin) {
    errors.push(`font_scale.section_px must be at least ${HARD_LIMITS.fontScale.sectionMin}px.`);
  }

  if ((contract.font_scale?.body_px ?? 0) < HARD_LIMITS.fontScale.bodyMin) {
    errors.push(`font_scale.body_px must be at least ${HARD_LIMITS.fontScale.bodyMin}px.`);
  }

  if ((contract.font_scale?.caption_px ?? 0) < HARD_LIMITS.fontScale.captionMin) {
    errors.push(`font_scale.caption_px must be at least ${HARD_LIMITS.fontScale.captionMin}px.`);
  }

  if ((contract.content_block_count ?? 0) > HARD_LIMITS.contentBlockMax) {
    errors.push(
      `content_block_count cannot exceed ${HARD_LIMITS.contentBlockMax}.`,
    );
  }

  const markedBlockCount = countMarkedBlocks(html);
  if (markedBlockCount !== contract.content_block_count) {
    errors.push(
      `Declared content block count (${contract.content_block_count}) does not match marked blocks (${markedBlockCount}).`,
    );
  }

  const status =
    errors.length === 0 ? 'pass' : overrideTokenPresent ? 'overridden' : 'fail';

  return {
    status,
    errors,
    contract,
  };
}

export async function validateInfographicFile(
  filePath,
  { overrideTokenPresent = false } = {},
) {
  const html = await fs.readFile(filePath, 'utf8');
  return validateInfographicHtml(html, { overrideTokenPresent });
}

async function main() {
  const args = process.argv.slice(2);
  const overrideTokenPresent = args.includes('--override-mobile-rules');
  const filePath = args.find((arg) => !arg.startsWith('--'));

  if (!filePath) {
    console.error(
      'Usage: node validate-mobile-linkedin-infographic.mjs <path-to-html> [--override-mobile-rules]',
    );
    process.exit(1);
  }

  const result = await validateInfographicFile(filePath, { overrideTokenPresent });
  const output = JSON.stringify(result, null, 2);

  if (result.status === 'fail') {
    console.error(output);
    process.exit(1);
  }

  console.log(output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
