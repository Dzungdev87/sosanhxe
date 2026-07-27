import { createHash } from "crypto";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { prisma } from "../lib/db";
import { slugify } from "../lib/slug";

type CsvRow = Record<string, string>;

const TARGET_URL = "https://bonbanh.com/chi-tiet-thong-so-ky-thuat-xe-vinfast-vf2-eco-2026-19313";
const IMAGE_DIR = path.join(process.cwd(), ".carspicture");
const CSV_PATH = path.join(process.cwd(), "scripts", "sample-cars.csv");
const DEFAULT_CLOUDINARY_FOLDER = "cars";

loadDotEnv();

async function main() {
  console.log(`Starting crawl & update for VinFast VF2 Eco 2026...`);
  await mkdir(IMAGE_DIR, { recursive: true });

  // 1. Fetch & parse HTML from Bonbanh
  const res = await fetch(TARGET_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Bonbanh URL ${res.status}: ${res.statusText}`);
  }
  const html = await res.text();
  const specs = parseBonbanhSpecs(html);

  const carName = "VinFast VF2 Eco 2026";
  const carSlug = slugify(carName);
  const imageKey = "vinfast-vf2-eco-2026.jpg";
  const imagePath = path.join(IMAGE_DIR, imageKey);

  // 2. Ensure image exists locally & Upload to Cloudinary
  await ensureCarImage(imagePath);
  console.log(`Image saved at: ${imagePath}`);

  const publicId = imageKey.replace(/\.[^.]+$/, "");
  const uploadRes = await uploadToCloudinary(imagePath, publicId);
  console.log(`Cloudinary upload successful! Public ID: ${uploadRes.public_id}`);

  // 3. Build CSV / Prisma Row
  const rowData = buildCarRow(carName, imageKey, specs);

  // 4. Update CSV
  const csvUpdated = await upsertRowIntoCsv(rowData);
  console.log(`CSV updated. Total rows processed: ${csvUpdated}`);

  // 5. Update Database via Prisma
  const dbCar = await upsertRowIntoPrisma(rowData);
  console.log(`Database updated successfully! Car ID: ${dbCar.id}, Slug: ${dbCar.slug}`);
}

function parseBonbanhSpecs(html: string) {
  const featureChildren = [...html.matchAll(/<div class=['"]feature_child['"]>([\s\S]*?)(?=<div class=['"]feature_child['"]>|<div class=['"]group_feature['"]>|$)/gi)];
  const specs: Record<string, string> = {};

  for (const fc of featureChildren) {
    const block = fc[1];
    const labelMatch = block.match(/<div class=['"]label_name['"]>([\s\S]*?)<\/div>/i);
    const valMatch = block.match(/<div class=['"]label_val['"]>([\s\S]*?)(?:<\/div>|$)/i);

    if (labelMatch) {
      const label = labelMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      let val = valMatch ? valMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

      if (block.includes("icon_check") || block.includes("ico_check") || block.includes("check_active") || block.includes("tick")) {
        val = val || "Có";
      } else if (block.includes("icon_uncheck") || block.includes("ico_uncheck")) {
        val = val || "Không";
      }

      specs[label] = val;
    }
  }

  return specs;
}

async function ensureCarImage(imagePath: string) {
  try {
    const stat = await readFile(imagePath);
    if (stat.length > 5000) {
      console.log(`Using existing local image (${stat.length} bytes)`);
      return;
    }
  } catch {
    // File doesn't exist, download fallback image from bonbanh listing
  }

  const bonbanhImageUrls = [
    "https://s.bonbanh.com/uploads/users/871159/car/6905307/l_1784708421.414.jpg",
    "https://s.bonbanh.com/uploads/users/860078/car/6881853/l_1784082506.295.jpg"
  ];

  for (const url of bonbanhImageUrls) {
    try {
      const imgRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        await writeFile(imagePath, buf);
        return;
      }
    } catch {
      // Continue
    }
  }

  throw new Error(`Could not fetch a valid car image for VinFast VF2`);
}

function buildCarRow(name: string, imageKey: string, specs: Record<string, string>): CsvRow {
  return {
    name,
    image_key: imageKey,
    brand: "VinFast",
    segment: "Ôtô điện",
    origin: specs["Xuất xứ"] || "Lắp ráp Việt Nam",
    release_year: "2026",
    platform: "VinFast EV Platform",
    drivetrain: specs["Dẫn động"]?.includes("RWD") ? "RWD" : "FWD",
    front_suspension: specs["Hệ thống treo trước"] || "MacPherson",
    rear_suspension: specs["Hệ thống treo sau"] || "MacPherson",
    engine: "Motor điện 30 kW",
    engine_hp: "40",
    torque: "65",
    transmission: "Tự động 1 cấp",
    fuel_consumption: "0",
    battery_type: "LFP",
    battery_capacity: "18.3",
    acceleration_0_100: "0",
    price: "188000000",
    base_price: "180000000",
    top_price: "188000000",
    seats: specs["Số chỗ"] || "4",
    ground_clearance: "165",
    length: specs["Chiều Dài (mm)"] || "3090",
    width: specs["Chiều Rộng (mm)"] || "1496",
    height: specs["Chiều Cao (mm)"] || "1663",
    wheelbase: specs["Chiều dài cơ sở (mm)"] || "2065",
    curb_weight: "0",
    gross_weight: "0",
    turning_radius: "0",
    cargo_volume: "0",
    fuel_tank_capacity: "0",
    front_brake: "Đĩa",
    rear_brake: "Tang trống",
    tire_wheel: specs["Kích thước lốp/lazang"] || "13 inch",
    led_headlights: String(specs["Cụm đèn trước"] === "LED"),
    auto_headlights: "false",
    electric_mirrors: "false",
    sunroof: "false",
    screen_size: "7",
    apple_carplay: "false",
    android_auto: "false",
    bluetooth: "true",
    usb: "true",
    speakers: specs["Hệ thống loa"] || "2",
    wireless_charging: "false",
    leather_seats: "false",
    cabin_space: "Tiêu chuẩn",
    electric_parking_brake: "false",
    auto_hold: "false",
    hud: "false",
    drive_modes: "true",
    paddle_shifters: "false",
    cruise_control: "false",
    adaptive_cruise_control: "false",
    airbags: specs["Số túi khí"] || "1",
    abs_ebd: "true",
    brake_assist: "false",
    esp: "false",
    traction_control: "true",
    hill_start_assist: "false",
    blind_spot_warning: "false",
    rear_camera: "false",
    camera_360: "false",
    lane_assist: "false",
    aeb: "false",
    rear_cross_traffic_alert: "false",
    tire_pressure_monitoring: "false",
    parking_sensors: "false",
    isofix: "true",
    safety: "Hệ thống phanh ABS, EBD, Kiểm soát lực kéo TCS, 1 túi khí người lái"
  };
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

async function upsertRowIntoCsv(newRow: CsvRow) {
  const csv = await readFile(CSV_PATH, "utf8");
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) throw new Error(`CSV parse error: ${JSON.stringify(parsed.errors)}`);

  const fields = parsed.meta.fields ?? Object.keys(newRow);
  const byName = new Map(parsed.data.map((row) => [row.name, row]));
  byName.set(newRow.name, newRow);

  const output = Papa.unparse([...byName.values()], { columns: fields });
  await writeFile(CSV_PATH, `${output}\n`, "utf8");
  return byName.size;
}

async function upsertRowIntoPrisma(row: CsvRow) {
  const carSlug = slugify(row.name);
  const data = {
    name: row.name,
    imageKey: row.image_key,
    brand: row.brand,
    segment: row.segment,
    origin: row.origin,
    releaseYear: Number(row.release_year),
    platform: row.platform,
    drivetrain: row.drivetrain,
    frontSuspension: row.front_suspension,
    rearSuspension: row.rear_suspension,
    engine: row.engine,
    engineHp: Number(row.engine_hp),
    torque: Number(row.torque),
    transmission: row.transmission,
    fuelConsumption: Number(row.fuel_consumption),
    energyConsumption: 0,
    batteryType: row.battery_type,
    batteryCapacity: Number(row.battery_capacity),
    acceleration0100: Number(row.acceleration_0_100),
    price: BigInt(row.price),
    basePrice: BigInt(row.base_price),
    topPrice: BigInt(row.top_price),
    seats: Number(row.seats),
    groundClearance: Number(row.ground_clearance),
    length: Number(row.length),
    width: Number(row.width),
    height: Number(row.height),
    wheelbase: Number(row.wheelbase),
    curbWeight: Number(row.curb_weight),
    grossWeight: Number(row.gross_weight),
    turningRadius: Number(row.turning_radius),
    cargoVolume: Number(row.cargo_volume),
    fuelTankCapacity: Number(row.fuel_tank_capacity),
    frontBrake: row.front_brake,
    rearBrake: row.rear_brake,
    tireWheel: row.tire_wheel,
    ledHeadlights: parseBoolean(row.led_headlights),
    autoHeadlights: parseBoolean(row.auto_headlights),
    electricMirrors: parseBoolean(row.electric_mirrors),
    sunroof: parseBoolean(row.sunroof),
    screenSize: Number(row.screen_size),
    appleCarplay: parseBoolean(row.apple_carplay),
    androidAuto: parseBoolean(row.android_auto),
    bluetooth: parseBoolean(row.bluetooth),
    usb: parseBoolean(row.usb),
    speakers: Number(row.speakers),
    wirelessCharging: parseBoolean(row.wireless_charging),
    leatherSeats: parseBoolean(row.leather_seats),
    cabinSpace: row.cabin_space,
    electricParkingBrake: parseBoolean(row.electric_parking_brake),
    autoHold: parseBoolean(row.auto_hold),
    hud: parseBoolean(row.hud),
    driveModes: parseBoolean(row.drive_modes),
    paddleShifters: parseBoolean(row.paddle_shifters),
    cruiseControl: parseBoolean(row.cruise_control),
    adaptiveCruiseControl: parseBoolean(row.adaptive_cruise_control),
    airbags: Number(row.airbags),
    absEbd: parseBoolean(row.abs_ebd),
    brakeAssist: parseBoolean(row.brake_assist),
    esp: parseBoolean(row.esp),
    tractionControl: parseBoolean(row.traction_control),
    hillStartAssist: parseBoolean(row.hill_start_assist),
    blindSpotWarning: parseBoolean(row.blind_spot_warning),
    rearCamera: parseBoolean(row.rear_camera),
    camera360: parseBoolean(row.camera_360),
    laneAssist: parseBoolean(row.lane_assist),
    aeb: parseBoolean(row.aeb),
    rearCrossTrafficAlert: parseBoolean(row.rear_cross_traffic_alert),
    tirePressureMonitoring: parseBoolean(row.tire_pressure_monitoring),
    parkingSensors: parseBoolean(row.parking_sensors),
    isofix: parseBoolean(row.isofix),
    safety: row.safety
  };

  return prisma.car.upsert({
    where: { slug: carSlug },
    update: data,
    create: {
      slug: carSlug,
      ...data
    }
  });
}

function parseBoolean(val: string) {
  return val === "true";
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
  if (!value) throw new Error(`Missing ${key} in .env`);
  return value;
}

function loadDotEnv() {
  try {
    const env = require("fs").readFileSync(path.join(process.cwd(), ".env"), "utf8") as string;
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Environment values validated at runtime
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
