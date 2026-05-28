import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import Papa from "papaparse";
import { prisma } from "../lib/db";
import { slugify } from "../lib/slug";

type CsvRow = Record<string, string>;
type SpecValue = string | boolean;

type ListingCar = {
  name: string;
  slug: string;
  href: string;
  imageUrl: string;
  imageKey: string;
  priceText: string;
};

const DEFAULT_BRAND_URL = "https://vnexpress.net/oto-xe-may/v-car/hang-xe/hyundai-9";
const BRAND_URL = process.env.VCAR_BRAND_URL ?? process.argv[2] ?? DEFAULT_BRAND_URL;
const BRAND_OBJECT_ID = Number(BRAND_URL.match(/-(\d+)(?:[/?#]|$)/)?.[1] ?? "9");
const BRAND_PATH_SLUG = BRAND_URL.match(/\/hang-xe\/([a-z0-9-]+)-\d+/i)?.[1] ?? "hyundai";
const BRAND = process.env.VCAR_BRAND ?? toBrandName(BRAND_PATH_SLUG);
const LIMIT = Number(process.env.VCAR_LIMIT ?? process.argv[3] ?? "11");
const IMAGE_DIR = path.join(process.cwd(), ".carspicture");
const CSV_PATH = path.join(process.cwd(), "scripts", "sample-cars.csv");
const CLOUDINARY_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_CARS_FOLDER ?? "cars";
const USER_AGENT = "Mozilla/5.0 (compatible; SosanhCarDataFetcher/1.0; +https://localhost)";

loadDotEnv();

async function main() {
  await mkdir(IMAGE_DIR, { recursive: true });

  const cars = await fetchBrandListings();
  console.log(`Found ${BRAND} cars: ${cars.length}`);

  const rows: CsvRow[] = [];

  for (const car of cars) {
    const imagePath = path.join(IMAGE_DIR, car.imageKey);
    await saveImage(car.imageUrl, imagePath);
    await uploadToCloudinary(imagePath, car.imageKey.replace(/\.[^.]+$/, ""));

    const detailHtml = await fetchText(toAbsoluteUrl(car.href));
    const versionUrl = findVersionUrl(detailHtml);
    const versionHtml = versionUrl ? await fetchText(versionUrl) : detailHtml;
    const specs = parseSpecs(versionHtml);
    mergeMissingSpecs(specs, parseBasicSpecs(detailHtml));
    const prices = parsePrices(versionHtml, car.priceText);
    const row = buildCsvRow(car, specs, prices, detailHtml, versionHtml);

    rows.push(row);
    console.log(`Prepared ${row.name} -> ${row.image_key}`);
    await sleep(700);
  }

  const csvUpdated = await upsertRowsIntoCsv(rows);
  const dbUpdated = await upsertRowsIntoSupabase(rows);

  console.log(`Updated CSV rows: ${csvUpdated}`);
  console.log(`Upserted Supabase rows: ${dbUpdated}`);
}

async function fetchBrandListings() {
  const firstPageHtml = await fetchText(BRAND_URL);
  const pageCount = extractPageCount(firstPageHtml);
  const cars = parseListingPage(firstPageHtml);

  for (let page = 2; page <= pageCount; page += 1) {
    const url = `https://vnexpress.net/v-car/load-item/page_type/car_company/object_id/${BRAND_OBJECT_ID}/active_id/0/sort/asc/page_number/${page}`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const data = (await response.json()) as { error?: number; html?: string };

    if (data.error === 0 && data.html) {
      cars.push(...parseListingPage(data.html));
    }
  }

  return dedupeBySlug(cars).slice(0, LIMIT);
}

function parseListingPage(html: string) {
  const listHtml = extractCarListHtml(html);
  const blocks = listHtml.match(/<div class=["']article-item full["'][\s\S]*?(?=<div class=["']article-item full["']|$)/g) ?? [];
  const cars: ListingCar[] = [];

  for (const block of blocks) {
    const title = extractAttribute(block, "title");
    const href = block.match(/<a class=["']thumb_img[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1];
    const imageUrl = extractImageUrl(block);
    const priceText = block.match(/<p><span>Khoảng giá:<\/span>\s*([^<]+)<\/p>/i)?.[1]?.trim() ?? "";

    if (!title || !href || !imageUrl || !href.includes(`/oto-xe-may/v-car/dong-xe/${BRAND_PATH_SLUG}-`)) continue;

    const name = `${BRAND} ${decodeHtml(title).trim()}`;
    const slug = slugify(name);

    cars.push({
      name,
      slug,
      href,
      imageUrl,
      imageKey: `${slug}.jpg`,
      priceText
    });
  }

  return cars;
}

function extractCarListHtml(html: string) {
  const listStart = html.indexOf('id="list-page-car"');
  if (listStart < 0) return html;
  const paginationStart = html.indexOf('id="pagination"', listStart);
  return html.slice(listStart, paginationStart > listStart ? paginationStart : html.length);
}

function extractPageCount(html: string) {
  const matches = [...html.matchAll(/data-page-number=["'](\d+)["']/g)].map((match) => Number(match[1]));
  return Math.max(1, ...matches.filter(Number.isFinite));
}

function findVersionUrl(html: string) {
  const href =
    html.match(/class=["'][^"']*btn-thongso[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    html.match(/href=["']([^"']*\/oto-xe-may\/v-car\/phien-ban-xe\/[^"']+)["']/i)?.[1];

  return href ? toAbsoluteUrl(href) : null;
}

function parseSpecs(html: string) {
  const specs = new Map<string, SpecValue>();
  const itemMatches = html.matchAll(/<li>\s*<div class=["']td1["']><b>([\s\S]*?)<\/b><\/div>\s*<div class=["']td2["']>\s*([\s\S]*?)\s*<\/div>\s*<\/li>/g);

  for (const match of itemMatches) {
    const label = cleanText(match[1]);
    const value = parseSpecValue(match[2]);

    if (label) specs.set(label, value);
  }

  return specs;
}

function parseBasicSpecs(html: string) {
  const specs = new Map<string, SpecValue>();
  const sectionStart = html.indexOf('id="thongsokythuat"');
  const section = sectionStart >= 0 ? html.slice(sectionStart, sectionStart + 8000) : html;
  const itemMatches = section.matchAll(/<div class=["']item["']>\s*<div class=["']name["']>([\s\S]*?)<\/div>\s*<div class=["']des["']>([\s\S]*?)<\/div>\s*<\/div>/g);

  for (const match of itemMatches) {
    const label = cleanText(match[1]);
    const value = parseSpecValue(match[2]);

    if (label) specs.set(label, value);
  }

  return specs;
}

function mergeMissingSpecs(target: Map<string, SpecValue>, source: Map<string, SpecValue>) {
  for (const [key, value] of source.entries()) {
    if (!target.has(key)) {
      target.set(key, value);
    }
  }
}

function parseSpecValue(html: string): SpecValue {
  if (html.includes('xlink:href="#check2"')) return true;
  if (html.includes('xlink:href="#cancel"')) return false;
  return cleanText(html);
}

function buildCsvRow(car: ListingCar, specs: Map<string, SpecValue>, prices: { price: number; basePrice: number; topPrice: number }, detailHtml: string, versionHtml: string): CsvRow {
  const dimensions = parseDimensions(textSpec(specs, "Kích thước dài x rộng x cao (mm)"));
  const releaseYear = Number(detailHtml.match(/Đời xe:\s*(\d{4})/)?.[1] ?? car.name.match(/(\d{4})/)?.[1] ?? "2026");
  const segment = cleanText(detailHtml.match(/<a class=["']tag["'][^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "Ôtô");
  const engine = textSpec(specs, "Kiểu động cơ") || "Chưa cập nhật";
  const fuelConsumption = numberSpec(specs, ["Mức tiêu thụ nhiên liệu đường hỗn hợp (lít/100 km)"], 0);
  const fuelTankCapacity = numberSpec(specs, ["Dung tích bình nhiên liệu (lít)"], 0);
  const tireWheel = textSpec(specs, "Lốp, la-zăng") || "Chưa cập nhật";
  const mirrorText = textSpec(specs, "Gương chiếu hậu");
  const seatMaterial = textSpec(specs, "Chất liệu bọc ghế");

  return {
    name: car.name,
    image_key: car.imageKey,
    brand: BRAND,
    segment,
    origin: parseOrigin(versionHtml),
    release_year: String(releaseYear),
    platform: BRAND,
    drivetrain: normalizeDrivetrain(textSpec(specs, "Hệ dẫn động")),
    front_suspension: textSpec(specs, "Treo trước") || textSpec(specs, "Hệ thống treo trước") || "Chưa cập nhật",
    rear_suspension: textSpec(specs, "Treo sau") || textSpec(specs, "Hệ thống treo sau") || "Chưa cập nhật",
    engine,
    engine_hp: String(powerSpec(specs)),
    torque: String(numberSpec(specs, ["Mô-men xoắn máy xăng/dầu (Nm)/vòng tua (vòng/phút)", "Mô-men xoắn cực đại (Nm)", "Mô-men xoắn môtơ điện (Nm)", "Mô-men xoắn kết hợp (Xăng+Điện) (Nm/rpm)"], 0)),
    transmission: textSpec(specs, "Hộp số") || "Chưa cập nhật",
    fuel_consumption: String(fuelConsumption > 0 ? fuelConsumption : 0.1),
    price: String(prices.price),
    base_price: String(prices.basePrice),
    top_price: String(prices.topPrice),
    seats: String(numberSpec(specs, ["Số chỗ"], 5)),
    ground_clearance: String(numberSpec(specs, ["Khoảng sáng gầm (mm)"], 0)),
    length: String(dimensions.length || 1),
    width: String(dimensions.width || 1),
    height: String(dimensions.height || 1),
    wheelbase: String(numberSpec(specs, ["Chiều dài cơ sở (mm)"], 1)),
    curb_weight: String(numberSpec(specs, ["Trọng lượng bản thân (kg)"], 0)),
    gross_weight: String(numberSpec(specs, ["Trọng lượng toàn tải (kg)"], 0)),
    turning_radius: String(numberSpec(specs, ["Bán kính vòng quay tối thiểu (m)"], 0)),
    cargo_volume: String(numberSpec(specs, ["Dung tích khoang hành lý (lít)"], 0)),
    fuel_tank_capacity: String(fuelTankCapacity),
    front_brake: textSpec(specs, "Phanh trước") || "Đĩa",
    rear_brake: textSpec(specs, "Phanh sau") || "Đĩa",
    tire_wheel: tireWheel,
    led_headlights: String(hasText(specs, "Đèn chiếu gần", "LED") || hasText(specs, "Đèn chiếu xa", "LED")),
    auto_headlights: String(boolSpec(specs, "Đèn pha tự động bật/tắt")),
    electric_mirrors: String(mirrorText.includes("điện") || mirrorText.includes("Điện")),
    sunroof: String(boolSpec(specs, "Cửa sổ trời")),
    screen_size: String(numberSpec(specs, ["Màn hình giải trí"], 8)),
    apple_carplay: String(boolSpec(specs, "Kết nối Apple CarPlay")),
    android_auto: String(boolSpec(specs, "Kết nối Android Auto")),
    bluetooth: String(boolSpec(specs, "Kết nối Bluetooth")),
    usb: String(boolSpec(specs, "Kết nối USB")),
    speakers: String(numberSpec(specs, ["Số loa"], 0)),
    wireless_charging: String(boolSpec(specs, "Sạc không dây")),
    leather_seats: String(seatMaterial.toLowerCase().includes("da")),
    cabin_space: "Chưa cập nhật",
    electric_parking_brake: String(boolSpec(specs, "Phanh tay điện tử")),
    auto_hold: String(boolSpec(specs, "Giữ phanh tự động")),
    hud: String(boolSpec(specs, "Hiển thị thông tin trên kính lái HUD")),
    drive_modes: String(Boolean(textSpec(specs, "Chế độ lái"))),
    paddle_shifters: String(boolSpec(specs, "Lẫy chuyển số trên vô-lăng")),
    cruise_control: String(boolSpec(specs, "Kiểm soát hành trình (Cruise Control)") || boolSpec(specs, "Kiểm soát hành trình")),
    adaptive_cruise_control: String(boolSpec(specs, "Kiểm soát hành trình thích ứng")),
    airbags: String(numberSpec(specs, ["Số túi khí"], 0)),
    abs_ebd: String(boolSpec(specs, "Chống bó cứng phanh (ABS)") || boolSpec(specs, "Phân phối lực phanh điện tử (EBD)")),
    brake_assist: String(boolSpec(specs, "Hỗ trợ lực phanh khẩn cấp (BA)")),
    esp: String(boolSpec(specs, "Cân bằng điện tử (VSC, ESP)")),
    traction_control: String(boolSpec(specs, "Kiểm soát lực kéo (chống trượt, kiểm soát độ bám đường TCS)")),
    hill_start_assist: String(boolSpec(specs, "Hỗ trợ khởi hành ngang dốc")),
    blind_spot_warning: String(boolSpec(specs, "Cảnh báo điểm mù")),
    rear_camera: String(boolSpec(specs, "Camera lùi")),
    camera_360: String(boolSpec(specs, "Camera 360")),
    lane_assist: String(boolSpec(specs, "Hỗ trợ giữ làn") || boolSpec(specs, "Cảnh báo chệch làn đường")),
    aeb: String(boolSpec(specs, "Phanh tự động khẩn cấp") || boolSpec(specs, "Hỗ trợ phanh tự động giảm thiểu va chạm")),
    rear_cross_traffic_alert: String(boolSpec(specs, "Cảnh báo phương tiện cắt ngang khi lùi")),
    tire_pressure_monitoring: String(boolSpec(specs, "Cảm biến áp suất lốp")),
    parking_sensors: String(boolSpec(specs, "Hệ thống cảm biến trước/sau") || boolSpec(specs, "Cảm biến lùi")),
    isofix: String(boolSpec(specs, "Móc ghế an toàn cho trẻ em Isofix")),
    safety: buildSafetySummary(specs)
  };
}

function parsePrices(versionHtml: string, listingPriceText: string) {
  const prices = [...versionHtml.matchAll(/data-car-price=["'](\d+)["']/g)].map((match) => Number(match[1])).filter((value) => value > 0);

  if (prices.length > 0) {
    return {
      price: Math.min(...prices),
      basePrice: Math.min(...prices),
      topPrice: Math.max(...prices)
    };
  }

  const parsed = parseVietnamesePrice(listingPriceText);
  return { price: parsed, basePrice: parsed, topPrice: parsed };
}

function parseOrigin(html: string) {
  const origin = html.match(/data-car-origin=["'](\d+)["']/)?.[1];
  if (origin === "1") return "Nhập khẩu";
  if (origin === "2") return "Nhập khẩu";
  if (origin === "3") return "Sản xuất trong nước";
  return "Lắp ráp Việt Nam";
}

async function saveImage(url: string, outputPath: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Image fetch failed ${response.status}: ${url}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function uploadToCloudinary(filePath: string, publicId: string) {
  const cloudName = requiredEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signCloudinaryParams({ folder: CLOUDINARY_FOLDER, overwrite: "true", public_id: publicId, timestamp }, apiSecret);
  const form = new FormData();
  const file = new Blob([await readFile(filePath)], { type: "image/jpeg" });

  form.append("file", file, path.basename(filePath));
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", CLOUDINARY_FOLDER);
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const data = (await response.json()) as { public_id?: string; error?: { message?: string } };

  if (!response.ok || !data.public_id) {
    throw new Error(`Cloudinary upload failed for ${filePath}: ${data.error?.message ?? response.statusText}`);
  }
}

async function upsertRowsIntoCsv(newRows: CsvRow[]) {
  const csv = await readFile(CSV_PATH, "utf8");
  const parsed = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true, newline: "\n" });
  if (parsed.errors.length > 0) throw new Error(`CSV parse error: ${JSON.stringify(parsed.errors)}`);

  const fields = parsed.meta.fields ?? Object.keys(newRows[0]);
  const byName = new Map(parsed.data.map((row) => [row.name, row]));

  for (const row of newRows) {
    byName.set(row.name, row);
  }

  const output = Papa.unparse([...byName.values()], { columns: fields });
  await writeFile(CSV_PATH, `${output}\n`, "utf8");
  return newRows.length;
}

async function upsertRowsIntoSupabase(rows: CsvRow[]) {
  let count = 0;

  for (const row of rows) {
    await prisma.car.upsert({
      where: { slug: slugify(row.name) },
      update: toPrismaData(row),
      create: {
        slug: slugify(row.name),
        ...toPrismaData(row)
      }
    });
    count += 1;
  }

  return count;
}

function toPrismaData(row: CsvRow) {
  return {
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
}

function parseDimensions(value: string) {
  const values = value.match(/[\d,.]+/g)?.map(parseDimensionToken) ?? [];
  return { length: values[0] ?? 0, width: values[1] ?? 0, height: values[2] ?? 0 };
}

function parseDimensionToken(value: string) {
  const decimalValue = Number(value.replace(",", "."));

  if ((value.includes(".") || value.includes(",")) && decimalValue > 0 && decimalValue < 10) {
    return Math.round(decimalValue * 1000);
  }

  return Number(value.replace(/\./g, "").replace(",", "."));
}

function parseVietnamesePrice(value: string) {
  const first = value.split("-")[0]?.trim() ?? "";
  const number = Number(first.match(/[\d,.]+/)?.[0]?.replace(",", ".") ?? 0);
  if (first.includes("tỷ")) return Math.round(number * 1_000_000_000);
  if (first.includes("triệu")) return Math.round(number * 1_000_000);
  return Math.round(number);
}

function numberSpec(specs: Map<string, SpecValue>, labels: string[], fallback: number) {
  for (const label of labels) {
    const value = specs.get(label);
    if (typeof value === "string") {
      const parsed = Number(value.match(/[\d,.]+/)?.[0]?.replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(parsed)) {
        if (label.includes("(mm)") && parsed > 0 && parsed < 20) {
          return Math.round(parsed * 1000);
        }

        return parsed;
      }
    }
  }

  return fallback;
}

function powerSpec(specs: Map<string, SpecValue>) {
  const hp = numberSpec(specs, [
    "Công suất máy xăng/dầu (Mã lực)/vòng tua (vòng/phút)",
    "Công suất tối đa (mã lực)",
    "Công suất môtơ điện (mã lực)",
    "Công suất kết hợp (Xăng+Điện) (hp/rpm)"
  ], 0);

  if (hp > 0) return Math.round(hp);

  const kw = numberSpec(specs, ["Công suất tối đa (kW)", "Công suất môtơ điện (kW)"], 0);
  return kw > 0 ? Math.round(kw * 1.341) : 0;
}

function textSpec(specs: Map<string, SpecValue>, label: string) {
  const value = specs.get(label);
  return typeof value === "string" ? value : "";
}

function boolSpec(specs: Map<string, SpecValue>, label: string) {
  return specs.get(label) === true;
}

function hasText(specs: Map<string, SpecValue>, label: string, pattern: string) {
  return textSpec(specs, label).toLowerCase().includes(pattern.toLowerCase());
}

function buildSafetySummary(specs: Map<string, SpecValue>) {
  const labels = [
    "Chống bó cứng phanh (ABS)",
    "Hỗ trợ lực phanh khẩn cấp (BA)",
    "Phân phối lực phanh điện tử (EBD)",
    "Cân bằng điện tử (VSC, ESP)",
    "Kiểm soát lực kéo (chống trượt, kiểm soát độ bám đường TCS)",
    "Camera lùi",
    "Camera 360",
    "Cảm biến áp suất lốp",
    "Móc ghế an toàn cho trẻ em Isofix"
  ];
  const enabled = labels.filter((label) => specs.get(label) === true).map((label) => label.replace(/\s*\(.+?\)/g, ""));
  return enabled.length > 0 ? enabled.join(", ") : "Chưa cập nhật";
}

function normalizeDrivetrain(value: string) {
  if (value.includes("RWD") || value.includes("Cầu sau")) return "RWD";
  if (value.includes("AWD") || value.includes("4")) return "AWD";
  return "FWD";
}

function parseBoolean(value: string) {
  return value === "true";
}

function cleanText(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function extractAttribute(block: string, attribute: string) {
  return block.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function extractImageUrl(block: string) {
  const srcset = block.match(/<source[^>]+srcset=["']([^"']+)["']/i)?.[1];
  if (srcset) return srcset.split(/\s+/)[0];
  return block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function toAbsoluteUrl(url: string) {
  return new URL(url, "https://vnexpress.net").toString();
}

function dedupeBySlug(cars: ListingCar[]) {
  const seen = new Set<string>();
  return cars.filter((car) => {
    if (seen.has(car.slug)) return false;
    seen.add(car.slug);
    return true;
  });
}

function toBrandName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.text();
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const payload = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
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
    // Required values are checked before use.
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
