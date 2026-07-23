#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function inventoryCarouselHtml(html) {
  const starts = [...html.matchAll(/<div\b[^>]*\bclass=["'][^"']*\binfographic\b[^"']*["'][^>]*\bid=["']([^"']+)["'][^>]*>/gi)];
  const slides = starts.map((match, index) => {
    const start = match.index;
    const end = index + 1 < starts.length ? starts[index + 1].index : html.length;
    const fragment = html.slice(start, end);
    const svgs = [...fragment.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)].map((svg, svgIndex) => ({
      index: svgIndex + 1,
      labels: [...svg[1].matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map((text) => stripTags(text[1])).filter(Boolean),
    }));
    return { id: match[1], authored_svg_count: svgs.length, svgs };
  });
  return {
    slide_count: slides.length,
    authored_svg_count: slides.reduce((count, slide) => count + slide.authored_svg_count, 0),
    slides,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const htmlPath = process.argv[2];
  if (!htmlPath) {
    console.error('Usage: node inventory-carousel-visuals.mjs <carousel.html>');
    process.exit(1);
  }
  const resolved = path.resolve(htmlPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Carousel HTML not found: ${resolved}`);
    process.exit(1);
  }
  console.log(JSON.stringify(inventoryCarouselHtml(fs.readFileSync(resolved, 'utf8')), null, 2));
}
