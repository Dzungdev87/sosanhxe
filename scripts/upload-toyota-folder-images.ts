import { createHash } from "crypto";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { prisma } from "../lib/db";
import { slugify } from "../lib/slug";

type CsvRow = Record<string, string>;

const IMAGE_DIR = path.join(process.cwd(), ".carspicture");
const CSV_PATH = path.join(process.cwd(), "scripts", "sample-cars.csv");
const DEFAULT_CLOUDINARY_FOLDER = "cars";

const imageByCarName: Record<string, string> = {
  "Toyota Camry": "camry-2026.jpg",
  "Toyota Corolla Cross 1.8HEV 2026": "corolla-cross-2026.jpg",
  "Toyota Wigo G 2026": "wigo-2026.jpg",
  "Toyota Vios G CVT 2026": "vios-2026.jpg",
  "Toyota Raize 1.0 Turbo 2026": "raize-2026.jpg",
  "Toyota Avanza Premio AT 2026": "avanza-premio-2026.jpg",
  "Toyota Hilux Trailhunter 2.8 4x4 AT 2026": "hilux-2026.jpg",
  "Toyota Veloz Cross CVT Top 2026": "veloz-cross-2026.jpg",
  "Toyota Yaris Cross HEV 2026": "yaris-cross-2026.jpg",
  "Toyota Yaris 1.5G CVT 2026": "yaris-2026.jpg",
  "Toyota Corolla Altis 1.8HEV 2026": "corolla-altis-2026.jpg",
  "Toyota Innova Cross 2.0HEV 2026": "innova-cross-2026.jpg",
  "Toyota Innova 2.0V 2026": "innova-2026.jpg",
  "Toyota Fortuner Legender 2.8 AT 4x4 2026": "fortuner-2026.jpg",
  "Toyota Land Cruiser Prado Panoramic 2026": "land-cruiser-prado-2026.jpg",
  "Toyota Alphard Hybrid 2026": "alphard-2026.jpg",
  "Toyota Granvia 2026": "granvia-2026.jpg",
  "Toyota Land Cruiser 2026": "land-cruiser-lc300-2026.jpg"
};

loadDotEnv();

async function main() {
  const availableImages = new Set(
    (await readdir(IMAGE_DIR, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.jpe?g$/i.test(entry.name))
      .map((entry) => entry.name)
  );
  const missingFiles = Object.values(imageByCarName).filter((fileName) => !availableImages.has(fileName));

  if (missingFiles.length > 0) {
    throw new Error(`Missing images in ${IMAGE_DIR}: ${missingFiles.join(", ")}`);
  }

  const uploadResults = [];

  for (const imageKey of Object.values(imageByCarName)) {
    const filePath = path.join(IMAGE_DIR, imageKey);
    const publicId = imageKey.replace(/\.[^.]+$/, "");
    const uploaded = await uploadToCloudinary(filePath, publicId);
    uploadResults.push({ imageKey, publicId: uploaded.public_id });
    console.log(`Uploaded ${imageKey} -> ${uploaded.public_id}`);
  }

  const csvUpdated = await updateSampleCsv();
  const dbUpdated = await updateSupabase();

  console.log(`Updated CSV rows: ${csvUpdated}`);
  console.log(`Updated Supabase rows: ${dbUpdated}`);
  console.log(`Uploaded images: ${uploadResults.length}`);
}

async function updateSampleCsv() {
  const csv = await readFile(CSV_PATH, "utf8");
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse error: ${JSON.stringify(parsed.errors)}`);
  }

  let updated = 0;
  const rows = parsed.data.map((row) => {
    const imageKey = imageByCarName[row.name];

    if (row.brand === "Toyota" && imageKey && row.image_key !== imageKey) {
      updated += 1;
      return { ...row, image_key: imageKey };
    }

    return row;
  });

  const output = Papa.unparse(rows, {
    columns: parsed.meta.fields
  });
  await writeFile(CSV_PATH, `${output}\n`, "utf8");

  return updated;
}

async function updateSupabase() {
  let updated = 0;

  for (const [name, imageKey] of Object.entries(imageByCarName)) {
    const result = await prisma.car.updateMany({
      where: {
        slug: slugify(name),
        brand: "Toyota"
      },
      data: { imageKey }
    });

    updated += result.count;
  }

  return updated;
}

async function uploadToCloudinary(filePath: string, publicId: string) {
  const cloudName = requiredEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER ?? DEFAULT_CLOUDINARY_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signCloudinaryParams({ folder, overwrite: "true", public_id: publicId, timestamp }, apiSecret);
  const form = new FormData();
  const file = new Blob([await readFile(filePath)], { type: "image/jpeg" });

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
    throw new Error(`Cloudinary upload failed for ${filePath}: ${data.error?.message ?? response.statusText}`);
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
    // The required variables are validated before upload.
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
