import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const cars = [
  ["Toyota Vios", "Toyota", "B-Sedan", 106, 140, 5.8, 545000000, 5, 133, 4425, 1730, 1475, 2550],
  ["Honda City", "Honda", "B-Sedan", 119, 145, 5.9, 559000000, 5, 134, 4580, 1748, 1467, 2600],
  ["Hyundai Accent", "Hyundai", "B-Sedan", 115, 144, 5.6, 542000000, 5, 150, 4535, 1765, 1485, 2670],
  ["Mazda 2 Sedan", "Mazda", "B-Sedan", 110, 144, 5.3, 534000000, 5, 140, 4340, 1695, 1470, 2570],
  ["Mitsubishi Xpander", "Mitsubishi", "MPV", 104, 141, 6.9, 658000000, 7, 225, 4595, 1750, 1750, 2775],
  ["Toyota Corolla Cross", "Toyota", "C-SUV", 138, 172, 7.0, 820000000, 5, 161, 4460, 1825, 1620, 2640],
  ["Honda HR-V", "Honda", "B-SUV", 119, 145, 6.7, 699000000, 5, 181, 4385, 1790, 1590, 2610],
  ["Mazda CX-5", "Mazda", "C-SUV", 154, 200, 7.3, 759000000, 5, 200, 4550, 1840, 1680, 2700],
  ["Ford Territory", "Ford", "C-SUV", 160, 248, 7.0, 822000000, 5, 190, 4630, 1935, 1706, 2726],
  ["Kia Carnival", "Kia", "MPV", 199, 440, 7.8, 1299000000, 7, 172, 5155, 1995, 1775, 3090]
] as const;

const extras: Record<
  string,
  {
    origin: string;
    releaseYear: number;
    platform: string;
    drivetrain: string;
    frontSuspension: string;
    rearSuspension: string;
    engine: string;
    transmission: string;
    batteryType: string;
    batteryCapacity: number;
    acceleration0100: number;
    basePrice: number;
    topPrice: number;
    curbWeight: number;
    grossWeight: number;
    turningRadius: number;
    cargoVolume: number;
    fuelTankCapacity: number;
    frontBrake: string;
    rearBrake: string;
    tireWheel: string;
    ledHeadlights: boolean;
    autoHeadlights: boolean;
    electricMirrors: boolean;
    sunroof: boolean;
    screenSize: number;
    appleCarplay: boolean;
    androidAuto: boolean;
    bluetooth: boolean;
    usb: boolean;
    speakers: number;
    wirelessCharging: boolean;
    leatherSeats: boolean;
    cabinSpace: string;
    electricParkingBrake: boolean;
    autoHold: boolean;
    hud: boolean;
    driveModes: boolean;
    paddleShifters: boolean;
    cruiseControl: boolean;
    adaptiveCruiseControl: boolean;
    airbags: number;
    absEbd: boolean;
    brakeAssist: boolean;
    esp: boolean;
    tractionControl: boolean;
    hillStartAssist: boolean;
    blindSpotWarning: boolean;
    rearCamera: boolean;
    camera360: boolean;
    laneAssist: boolean;
    aeb: boolean;
    rearCrossTrafficAlert: boolean;
    tirePressureMonitoring: boolean;
    parkingSensors: boolean;
    isofix: boolean;
    safety: string;
  }
> = {
  "Toyota Vios": {
    origin: "Vietnam assembly",
    releaseYear: 2025,
    platform: "DNGA",
    drivetrain: "FWD",
    frontSuspension: "MacPherson",
    rearSuspension: "Torsion beam",
    engine: "1.5L gasoline",
    transmission: "CVT",
    batteryType: "Không áp dụng",
    batteryCapacity: 0,
    acceleration0100: 0,
    basePrice: 458000000,
    topPrice: 545000000,
    curbWeight: 1110,
    grossWeight: 1550,
    turningRadius: 5.1,
    cargoVolume: 475,
    fuelTankCapacity: 42,
    frontBrake: "Đĩa",
    rearBrake: "Đĩa",
    tireWheel: "185/60 R15",
    ledHeadlights: true,
    autoHeadlights: true,
    electricMirrors: true,
    sunroof: false,
    screenSize: 9,
    appleCarplay: true,
    androidAuto: true,
    bluetooth: true,
    usb: true,
    speakers: 6,
    wirelessCharging: false,
    leatherSeats: true,
    cabinSpace: "Trung bình",
    electricParkingBrake: false,
    autoHold: false,
    hud: false,
    driveModes: false,
    paddleShifters: false,
    cruiseControl: true,
    adaptiveCruiseControl: false,
    airbags: 6,
    absEbd: true,
    brakeAssist: true,
    esp: true,
    tractionControl: true,
    hillStartAssist: true,
    blindSpotWarning: false,
    rearCamera: true,
    camera360: false,
    laneAssist: false,
    aeb: false,
    rearCrossTrafficAlert: false,
    tirePressureMonitoring: false,
    parkingSensors: true,
    isofix: true,
    safety: "ABS, EBD, cân bằng điện tử, camera lùi"
  },
  "Honda City": {
    origin: "Lắp ráp Việt Nam",
    releaseYear: 2025,
    platform: "Honda Global Small Car",
    drivetrain: "FWD",
    frontSuspension: "MacPherson",
    rearSuspension: "Torsion beam",
    engine: "1.5L gasoline",
    transmission: "CVT",
    batteryType: "Không áp dụng",
    batteryCapacity: 0,
    acceleration0100: 0,
    basePrice: 499000000,
    topPrice: 569000000,
    curbWeight: 1124,
    grossWeight: 1580,
    turningRadius: 5,
    cargoVolume: 506,
    fuelTankCapacity: 40,
    frontBrake: "Đĩa",
    rearBrake: "Tang trống",
    tireWheel: "185/55 R16",
    ledHeadlights: true,
    autoHeadlights: true,
    electricMirrors: true,
    sunroof: false,
    screenSize: 8,
    appleCarplay: true,
    androidAuto: true,
    bluetooth: true,
    usb: true,
    speakers: 8,
    wirelessCharging: false,
    leatherSeats: true,
    cabinSpace: "Rộng hơn",
    electricParkingBrake: false,
    autoHold: false,
    hud: false,
    driveModes: false,
    paddleShifters: true,
    cruiseControl: true,
    adaptiveCruiseControl: true,
    airbags: 6,
    absEbd: true,
    brakeAssist: true,
    esp: true,
    tractionControl: true,
    hillStartAssist: true,
    blindSpotWarning: false,
    rearCamera: true,
    camera360: false,
    laneAssist: true,
    aeb: true,
    rearCrossTrafficAlert: false,
    tirePressureMonitoring: false,
    parkingSensors: true,
    isofix: true,
    safety: "Honda Sensing, hỗ trợ giữ làn, phanh tự động khẩn cấp"
  }
};

const defaultExtra = {
  origin: "Vietnam assembly",
  releaseYear: 2025,
  platform: "Not specified",
  drivetrain: "FWD",
  frontSuspension: "MacPherson",
  rearSuspension: "Torsion beam",
  engine: "1.5L gasoline",
  transmission: "CVT",
  batteryType: "Không áp dụng",
  batteryCapacity: 0,
  acceleration0100: 0,
  basePrice: 0,
  topPrice: 0,
  curbWeight: 0,
  grossWeight: 0,
  turningRadius: 0,
  cargoVolume: 0,
  fuelTankCapacity: 0,
  frontBrake: "Đĩa",
  rearBrake: "Đĩa",
  tireWheel: "Chưa cập nhật",
  ledHeadlights: false,
  autoHeadlights: false,
  electricMirrors: false,
  sunroof: false,
  screenSize: 8,
  appleCarplay: true,
  androidAuto: true,
  bluetooth: true,
  usb: true,
  speakers: 4,
  wirelessCharging: false,
  leatherSeats: true,
  cabinSpace: "Tiêu chuẩn",
  electricParkingBrake: false,
  autoHold: false,
  hud: false,
  driveModes: false,
  paddleShifters: false,
  cruiseControl: false,
  adaptiveCruiseControl: false,
  airbags: 2,
  absEbd: true,
  brakeAssist: true,
  esp: true,
  tractionControl: true,
  hillStartAssist: false,
  blindSpotWarning: false,
  rearCamera: false,
  camera360: false,
  laneAssist: false,
  aeb: false,
  rearCrossTrafficAlert: false,
  tirePressureMonitoring: false,
  parkingSensors: false,
  isofix: false,
  safety: "Gói an toàn tiêu chuẩn"
};

async function main() {
  for (const car of cars) {
    const [name, brand, segment, engineHp, torque, fuelConsumption, price, seats, groundClearance, length, width, height, wheelbase] = car;
    const extra = extras[name] ?? defaultExtra;

    await prisma.car.upsert({
      where: { slug: slugify(name) },
      update: {
        name,
        imageKey: `${slugify(name)}.jpg`,
        brand,
        segment,
        ...extra,
        engineHp,
        torque,
        fuelConsumption,
        price,
        seats,
        groundClearance,
        length,
        width,
        height,
        wheelbase
      },
      create: {
        slug: slugify(name),
        name,
        imageKey: `${slugify(name)}.jpg`,
        brand,
        segment,
        ...extra,
        engineHp,
        torque,
        fuelConsumption,
        price,
        seats,
        groundClearance,
        length,
        width,
        height,
        wheelbase
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
