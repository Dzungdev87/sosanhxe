import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { slugify } from "../lib/slug";

type CarImageItem = {
  name: string;
  slug: string;
  imageKey: string;
  sourceUrl: string;
  localPath: string;
  uploaded: boolean;
  cloudinaryPublicId?: string;
};

const DEFAULT_SOURCE_URL = "https://vnexpress.net/oto-xe-may/v-car/hang-xe/toyota-32";
const DEFAULT_OUTPUT_DIR = "D:\\1. Pictures\\1SosanhCar";
const DEFAULT_CLOUDINARY_FOLDER = "cars";
const USER_AGENT = "Mozilla/5.0 (compatible; SosanhCarImageFetcher/1.0; +https://localhost)";
const ALLOWED_IMAGE_HOSTS = new Set(["i1-vnexpress.vnecdn.net", "i2-vnexpress.vnecdn.net", "i-vnexpress.vnecdn.net"]);

loadDotEnv();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceUrl = args.url ?? DEFAULT_SOURCE_URL;
  const outputDir = args.out ?? DEFAULT_OUTPUT_DIR;
  const shouldUpload = args.upload === "true" || args.upload === "1";
  const maxPages = Number(args.pages ?? "0");

  await mkdir(outputDir, { recursive: true });

  const firstPageHtml = await fetchText(sourceUrl);
  const pageCount = maxPages > 0 ? maxPages : extractPageCount(firstPageHtml);
  const blocks = parseCarBlocks(firstPageHtml);

  for (let page = 2; page <= pageCount; page += 1) {
    const pageHtml = await fetchVCarPage(page);
    blocks.push(...parseCarBlocks(pageHtml));
    await sleep(800);
  }

  const uniqueCars = dedupeBySlug(blocks);
  const results: CarImageItem[] = [];

  for (const car of uniqueCars) {
    if (!isAllowedImageUrl(car.sourceUrl)) {
      console.warn(`Skip non-VnExpress image: ${car.sourceUrl}`);
      continue;
    }

    const imageKey = `${car.slug}.jpg`;
    const localPath = path.join(outputDir, imageKey);
    const imageBuffer = await fetchBytes(normalizeImageUrl(car.sourceUrl));
    await writeFile(localPath, imageBuffer);

    const item: CarImageItem = {
      ...car,
      imageKey,
      localPath,
      uploaded: false
    };

    if (shouldUpload) {
      const uploadResult = await uploadToCloudinary(localPath, car.slug);
      item.uploaded = true;
      item.cloudinaryPublicId = uploadResult.public_id;
      await sleep(500);
    }

    results.push(item);
    console.log(`${shouldUpload ? "Uploaded" : "Saved"} ${car.name} -> ${localPath}`);
    await sleep(500);
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  const csvPath = path.join(outputDir, "image-keys.csv");
  const csv = ["name,slug,image_key,source_url,local_path,cloudinary_public_id"]
    .concat(results.map((item) => [item.name, item.slug, item.imageKey, item.sourceUrl, item.localPath, item.cloudinaryPublicId ?? ""].map(csvCell).join(",")))
    .join("\n");
  await writeFile(csvPath, `${csv}\n`, "utf8");

  console.log(`Done. ${results.length} images. Manifest: ${manifestPath}`);
}

function parseArgs(args: string[]) {
  const result: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      result[match[1]] = match[2];
    } else if (arg === "--upload") {
      result.upload = "true";
    }
  }

  return result;
}

function loadDotEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const env = require("fs").readFileSync(envPath, "utf8") as string;

    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env is optional for download-only mode.
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }

  return response.text();
}

async function fetchBytes(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Image fetch failed ${response.status}: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchVCarPage(page: number) {
  const url = `https://vnexpress.net/v-car/load-item/page_type/car_company/object_id/32/active_id/0/sort/asc/page_number/${page}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`V-Car page fetch failed ${response.status}: ${url}`);
  }

  const data = (await response.json()) as { error?: number; html?: string };
  if (data.error !== 0 || !data.html) {
    throw new Error(`V-Car page ${page} returned no html`);
  }

  return data.html;
}

function extractPageCount(html: string) {
  const matches = [...html.matchAll(/data-page-number=["'](\d+)["']/g)].map((match) => Number(match[1]));
  return Math.max(1, ...matches.filter(Number.isFinite));
}

function parseCarBlocks(html: string) {
  const items: Array<{ name: string; slug: string; sourceUrl: string }> = [];
  const listHtml = extractCarListHtml(html);
  const blocks = listHtml.match(/<div class=["']article-item full["'][\s\S]*?(?=<div class=["']article-item full["']|$)/g) ?? [];

  for (const block of blocks) {
    const title = extractAttribute(block, "title");
    const img = extractImageUrl(block);

    if (!title || !img) {
      continue;
    }

    const name = decodeHtml(title).trim();
    const slug = slugify(name);

    if (!slug) {
      continue;
    }

    items.push({ name, slug, sourceUrl: img });
  }

  return items;
}

function extractCarListHtml(html: string) {
  const listStart = html.indexOf('id="list-page-car"');

  if (listStart < 0) {
    return html;
  }

  const paginationStart = html.indexOf('id="pagination"', listStart);
  const sectionEnd = paginationStart > listStart ? paginationStart : html.length;
  return html.slice(listStart, sectionEnd);
}

function extractAttribute(block: string, attribute: string) {
  const match = block.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function extractImageUrl(block: string) {
  const srcset = block.match(/<source[^>]+srcset=["']([^"']+)["']/i)?.[1];
  if (srcset) {
    return srcset.split(/\s+/)[0];
  }

  return block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeImageUrl(url: string) {
  return url;
}

function isAllowedImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function dedupeBySlug(items: Array<{ name: string; slug: string; sourceUrl: string }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

async function uploadToCloudinary(filePath: string, slug: string) {
  const cloudName = requiredEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER ?? DEFAULT_CLOUDINARY_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `${folder}/${slug}`;
  const signature = signCloudinaryParams({ folder, public_id: publicId, timestamp }, apiSecret);
  const file = new Blob([await readFile(filePath)], { type: "image/jpeg" });
  const form = new FormData();

  form.append("file", file, path.basename(filePath));
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form
  });

  const data = (await response.json()) as { public_id?: string; error?: { message?: string } };
  if (!response.ok || !data.public_id) {
    throw new Error(`Cloudinary upload failed: ${data.error?.message ?? response.statusText}`);
  }

  return { public_id: data.public_id };
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env`);
  }

  return value;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
