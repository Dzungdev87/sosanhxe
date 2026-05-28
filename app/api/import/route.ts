import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

const numberFromCsv = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    return normalized === "" ? undefined : Number(normalized);
  }

  return value;
}, z.number().finite());

const booleanFromCsv = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "co", "có"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "khong", "không"].includes(normalized)) return false;
    if (normalized === "") return undefined;
  }

  return value;
}, z.boolean());

const csvCarSchema = z.object({
  name: z.string().min(1),
  image_key: z.string().trim().optional(),
  brand: z.string().min(1),
  segment: z.string().min(1),
  origin: z.string().min(1).optional(),
  release_year: numberFromCsv.pipe(z.number().int().positive()).optional(),
  platform: z.string().min(1).optional(),
  drivetrain: z.string().min(1).optional(),
  front_suspension: z.string().min(1).optional(),
  rear_suspension: z.string().min(1).optional(),
  engine: z.string().min(1).optional(),
  engine_hp: numberFromCsv.pipe(z.number().int().nonnegative()),
  torque: numberFromCsv.pipe(z.number().int().nonnegative()),
  transmission: z.string().min(1).optional(),
  fuel_consumption: numberFromCsv.pipe(z.number().positive()),
  battery_type: z.string().min(1).optional(),
  battery_capacity: numberFromCsv.pipe(z.number().nonnegative()).optional(),
  acceleration_0_100: numberFromCsv.pipe(z.number().nonnegative()).optional(),
  price: numberFromCsv.pipe(z.number().int().nonnegative()).transform(BigInt),
  base_price: numberFromCsv.pipe(z.number().int().nonnegative()).transform(BigInt).optional(),
  top_price: numberFromCsv.pipe(z.number().int().nonnegative()).transform(BigInt).optional(),
  seats: numberFromCsv.pipe(z.number().int().positive()),
  ground_clearance: numberFromCsv.pipe(z.number().int().nonnegative()),
  length: numberFromCsv.pipe(z.number().int().positive()),
  width: numberFromCsv.pipe(z.number().int().positive()),
  height: numberFromCsv.pipe(z.number().int().positive()),
  wheelbase: numberFromCsv.pipe(z.number().int().positive()),
  curb_weight: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  gross_weight: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  turning_radius: numberFromCsv.pipe(z.number().nonnegative()).optional(),
  cargo_volume: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  fuel_tank_capacity: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  front_brake: z.string().min(1).optional(),
  rear_brake: z.string().min(1).optional(),
  tire_wheel: z.string().min(1).optional(),
  led_headlights: booleanFromCsv.optional(),
  auto_headlights: booleanFromCsv.optional(),
  electric_mirrors: booleanFromCsv.optional(),
  sunroof: booleanFromCsv.optional(),
  screen_size: numberFromCsv.pipe(z.number().positive()).optional(),
  apple_carplay: booleanFromCsv.optional(),
  android_auto: booleanFromCsv.optional(),
  bluetooth: booleanFromCsv.optional(),
  usb: booleanFromCsv.optional(),
  speakers: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  wireless_charging: booleanFromCsv.optional(),
  leather_seats: booleanFromCsv.optional(),
  cabin_space: z.string().min(1).optional(),
  electric_parking_brake: booleanFromCsv.optional(),
  auto_hold: booleanFromCsv.optional(),
  hud: booleanFromCsv.optional(),
  drive_modes: booleanFromCsv.optional(),
  paddle_shifters: booleanFromCsv.optional(),
  cruise_control: booleanFromCsv.optional(),
  adaptive_cruise_control: booleanFromCsv.optional(),
  airbags: numberFromCsv.pipe(z.number().int().nonnegative()).optional(),
  abs_ebd: booleanFromCsv.optional(),
  brake_assist: booleanFromCsv.optional(),
  esp: booleanFromCsv.optional(),
  traction_control: booleanFromCsv.optional(),
  hill_start_assist: booleanFromCsv.optional(),
  blind_spot_warning: booleanFromCsv.optional(),
  rear_camera: booleanFromCsv.optional(),
  camera_360: booleanFromCsv.optional(),
  lane_assist: booleanFromCsv.optional(),
  aeb: booleanFromCsv.optional(),
  rear_cross_traffic_alert: booleanFromCsv.optional(),
  tire_pressure_monitoring: booleanFromCsv.optional(),
  parking_sensors: booleanFromCsv.optional(),
  isofix: booleanFromCsv.optional(),
  safety: z.string().min(1).optional()
});

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV file in a multipart field named file" }, { status: 400 });
  }

  const csv = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: parsed.errors }, { status: 400 });
  }

  const errors: Array<{ row: number; issues: unknown }> = [];
  let imported = 0;

  for (const [index, row] of parsed.data.entries()) {
    const result = csvCarSchema.safeParse(row);

    if (!result.success) {
      errors.push({ row: index + 2, issues: result.error.flatten().fieldErrors });
      continue;
    }

    const car = result.data;
    const optionalData = {
      origin: car.origin,
      imageKey: car.image_key || undefined,
      releaseYear: car.release_year,
      platform: car.platform,
      drivetrain: car.drivetrain,
      frontSuspension: car.front_suspension,
      rearSuspension: car.rear_suspension,
      engine: car.engine,
      transmission: car.transmission,
      batteryType: car.battery_type,
      batteryCapacity: car.battery_capacity,
      acceleration0100: car.acceleration_0_100,
      basePrice: car.base_price,
      topPrice: car.top_price,
      curbWeight: car.curb_weight,
      grossWeight: car.gross_weight,
      turningRadius: car.turning_radius,
      cargoVolume: car.cargo_volume,
      fuelTankCapacity: car.fuel_tank_capacity,
      frontBrake: car.front_brake,
      rearBrake: car.rear_brake,
      tireWheel: car.tire_wheel,
      ledHeadlights: car.led_headlights,
      autoHeadlights: car.auto_headlights,
      electricMirrors: car.electric_mirrors,
      sunroof: car.sunroof,
      screenSize: car.screen_size,
      appleCarplay: car.apple_carplay,
      androidAuto: car.android_auto,
      bluetooth: car.bluetooth,
      usb: car.usb,
      speakers: car.speakers,
      wirelessCharging: car.wireless_charging,
      leatherSeats: car.leather_seats,
      cabinSpace: car.cabin_space,
      electricParkingBrake: car.electric_parking_brake,
      autoHold: car.auto_hold,
      hud: car.hud,
      driveModes: car.drive_modes,
      paddleShifters: car.paddle_shifters,
      cruiseControl: car.cruise_control,
      adaptiveCruiseControl: car.adaptive_cruise_control,
      airbags: car.airbags,
      absEbd: car.abs_ebd,
      brakeAssist: car.brake_assist,
      esp: car.esp,
      tractionControl: car.traction_control,
      hillStartAssist: car.hill_start_assist,
      blindSpotWarning: car.blind_spot_warning,
      rearCamera: car.rear_camera,
      camera360: car.camera_360,
      laneAssist: car.lane_assist,
      aeb: car.aeb,
      rearCrossTrafficAlert: car.rear_cross_traffic_alert,
      tirePressureMonitoring: car.tire_pressure_monitoring,
      parkingSensors: car.parking_sensors,
      isofix: car.isofix,
      safety: car.safety
    };
    const cleanOptionalData = Object.fromEntries(Object.entries(optionalData).filter(([, value]) => value !== undefined));

    await prisma.car.upsert({
      where: { slug: slugify(car.name) },
      update: {
        name: car.name,
        brand: car.brand,
        segment: car.segment,
        ...cleanOptionalData,
        engineHp: car.engine_hp,
        torque: car.torque,
        fuelConsumption: car.fuel_consumption,
        price: car.price,
        seats: car.seats,
        groundClearance: car.ground_clearance,
        length: car.length,
        width: car.width,
        height: car.height,
        wheelbase: car.wheelbase
      },
      create: {
        slug: slugify(car.name),
        name: car.name,
        brand: car.brand,
        segment: car.segment,
        ...cleanOptionalData,
        engineHp: car.engine_hp,
        torque: car.torque,
        fuelConsumption: car.fuel_consumption,
        price: car.price,
        seats: car.seats,
        groundClearance: car.ground_clearance,
        length: car.length,
        width: car.width,
        height: car.height,
        wheelbase: car.wheelbase
      }
    });

    imported += 1;
  }

  return NextResponse.json({
    imported,
    failed: errors.length,
    errors
  });
}
