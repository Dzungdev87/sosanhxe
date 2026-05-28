export type CompareRule = "higher" | "lower" | "true" | "neutral";

export type CompareResult = {
  aBetter: boolean;
  bBetter: boolean;
};

type NumericValue = number | bigint | null | undefined;

export function compareField(a: NumericValue, b: NumericValue, rule: CompareRule): CompareResult {
  if (rule === "neutral" || rule === "true" || a == null || b == null || a === b) {
    return { aBetter: false, bBetter: false };
  }

  if (rule === "higher") {
    return { aBetter: a > b, bBetter: b > a };
  }

  return { aBetter: a < b, bBetter: b < a };
}

export function compareValue(a: unknown, b: unknown, rule: CompareRule): CompareResult {
  if (rule === "true") {
    if (typeof a !== "boolean" || typeof b !== "boolean" || a === b) {
      return { aBetter: false, bBetter: false };
    }

    return { aBetter: a, bBetter: b };
  }

  if ((typeof a === "number" || typeof a === "bigint") && (typeof b === "number" || typeof b === "bigint")) {
    return compareField(a, b, rule);
  }

  return { aBetter: false, bBetter: false };
}

export const compareSections = [
  {
    title: "Tổng quan",
    fields: [
      { key: "brand", label: "Hãng xe", rule: "neutral", unit: "" },
      { key: "segment", label: "Phân khúc", rule: "neutral", unit: "" },
      { key: "origin", label: "Xuất xứ", rule: "neutral", unit: "" },
      { key: "seats", label: "Số chỗ", rule: "higher", unit: "" },
      { key: "releaseYear", label: "Năm ra mắt", rule: "higher", unit: "" }
    ]
  },
  {
    title: "Kích thước / trọng lượng",
    fields: [
      { key: "length", label: "Dài", rule: "higher", unit: "mm" },
      { key: "width", label: "Rộng", rule: "higher", unit: "mm" },
      { key: "height", label: "Cao", rule: "neutral", unit: "mm" },
      { key: "wheelbase", label: "Chiều dài cơ sở", rule: "higher", unit: "mm" },
      { key: "groundClearance", label: "Khoảng sáng gầm", rule: "higher", unit: "mm" },
      { key: "curbWeight", label: "Trọng lượng bản thân", rule: "lower", unit: "kg" },
      { key: "grossWeight", label: "Trọng lượng toàn tải", rule: "neutral", unit: "kg" },
      { key: "turningRadius", label: "Bán kính vòng quay", rule: "lower", unit: "m" },
      { key: "cargoVolume", label: "Dung tích khoang hành lý", rule: "higher", unit: "lít" },
      { key: "fuelTankCapacity", label: "Dung tích bình nhiên liệu", rule: "higher", unit: "lít" }
    ]
  },
  {
    title: "Hệ thống treo / phanh",
    fields: [
      { key: "platform", label: "Nền tảng khung gầm", rule: "neutral", unit: "" },
      { key: "frontSuspension", label: "Treo trước", rule: "neutral", unit: "" },
      { key: "rearSuspension", label: "Treo sau", rule: "neutral", unit: "" },
      { key: "frontBrake", label: "Phanh trước", rule: "neutral", unit: "" },
      { key: "rearBrake", label: "Phanh sau", rule: "neutral", unit: "" },
      { key: "tireWheel", label: "Lốp / la-zăng", rule: "neutral", unit: "" }
    ]
  },
  {
    title: "Động cơ / hộp số",
    fields: [
      { key: "engine", label: "Kiểu động cơ", rule: "neutral", unit: "" },
      { key: "engineHp", label: "Công suất", rule: "higher", unit: "mã lực" },
      { key: "torque", label: "Mô-men xoắn", rule: "higher", unit: "Nm" },
      { key: "acceleration0100", label: "Tăng tốc 0-100 km/h", rule: "lower", unit: "giây" },
      { key: "transmission", label: "Hộp số", rule: "neutral", unit: "" },
      { key: "drivetrain", label: "Hệ dẫn động", rule: "neutral", unit: "" }
    ]
  },
  {
    title: "Tiêu thụ nhiên liệu",
    fields: [{ key: "fuelConsumption", label: "Mức tiêu thụ hỗn hợp", rule: "lower", unit: "lít/100 km" }]
  },
  {
    title: "Pin / hiệu suất điện",
    fields: [
      { key: "batteryType", label: "Loại pin", rule: "neutral", unit: "" },
      { key: "batteryCapacity", label: "Dung lượng pin", rule: "higher", unit: "kWh" }
    ]
  },
  {
    title: "Ngoại thất",
    fields: [
      { key: "ledHeadlights", label: "Đèn chiếu sáng LED", rule: "true", unit: "" },
      { key: "autoHeadlights", label: "Đèn tự động", rule: "true", unit: "" },
      { key: "electricMirrors", label: "Gương gập/chỉnh điện", rule: "true", unit: "" },
      { key: "sunroof", label: "Cửa sổ trời", rule: "true", unit: "" }
    ]
  },
  {
    title: "Nội thất",
    fields: [
      { key: "screenSize", label: "Màn hình giải trí", rule: "higher", unit: "inch" },
      { key: "appleCarplay", label: "Apple CarPlay", rule: "true", unit: "" },
      { key: "androidAuto", label: "Android Auto", rule: "true", unit: "" },
      { key: "bluetooth", label: "Bluetooth", rule: "true", unit: "" },
      { key: "usb", label: "Kết nối USB", rule: "true", unit: "" },
      { key: "speakers", label: "Số loa", rule: "higher", unit: "" },
      { key: "wirelessCharging", label: "Sạc không dây", rule: "true", unit: "" },
      { key: "leatherSeats", label: "Ghế da", rule: "true", unit: "" },
      { key: "cabinSpace", label: "Không gian cabin", rule: "neutral", unit: "" }
    ]
  },
  {
    title: "Hỗ trợ vận hành",
    fields: [
      { key: "electricParkingBrake", label: "Phanh tay điện tử", rule: "true", unit: "" },
      { key: "autoHold", label: "Giữ phanh tự động", rule: "true", unit: "" },
      { key: "hud", label: "Hiển thị kính lái HUD", rule: "true", unit: "" },
      { key: "driveModes", label: "Nhiều chế độ lái", rule: "true", unit: "" },
      { key: "paddleShifters", label: "Lẫy chuyển số", rule: "true", unit: "" },
      { key: "cruiseControl", label: "Kiểm soát hành trình", rule: "true", unit: "" },
      { key: "adaptiveCruiseControl", label: "Ga tự động thích ứng", rule: "true", unit: "" }
    ]
  },
  {
    title: "Công nghệ an toàn",
    fields: [
      { key: "airbags", label: "Số túi khí", rule: "higher", unit: "" },
      { key: "absEbd", label: "ABS / EBD", rule: "true", unit: "" },
      { key: "brakeAssist", label: "Hỗ trợ phanh khẩn cấp", rule: "true", unit: "" },
      { key: "esp", label: "Cân bằng điện tử", rule: "true", unit: "" },
      { key: "tractionControl", label: "Kiểm soát lực kéo", rule: "true", unit: "" },
      { key: "hillStartAssist", label: "Hỗ trợ khởi hành ngang dốc", rule: "true", unit: "" },
      { key: "blindSpotWarning", label: "Cảnh báo điểm mù", rule: "true", unit: "" },
      { key: "rearCamera", label: "Camera lùi", rule: "true", unit: "" },
      { key: "camera360", label: "Camera 360", rule: "true", unit: "" },
      { key: "laneAssist", label: "Hỗ trợ giữ làn", rule: "true", unit: "" },
      { key: "aeb", label: "Phanh tự động khẩn cấp", rule: "true", unit: "" },
      { key: "rearCrossTrafficAlert", label: "Cảnh báo phương tiện cắt ngang khi lùi", rule: "true", unit: "" },
      { key: "tirePressureMonitoring", label: "Cảm biến áp suất lốp", rule: "true", unit: "" },
      { key: "parkingSensors", label: "Cảm biến trước/sau", rule: "true", unit: "" },
      { key: "isofix", label: "Móc ghế trẻ em Isofix", rule: "true", unit: "" },
      { key: "safety", label: "Gói an toàn", rule: "neutral", unit: "" }
    ]
  },
  {
    title: "Giá bán",
    fields: [
      { key: "basePrice", label: "Giá bản tiêu chuẩn", rule: "lower", unit: "VND" },
      { key: "topPrice", label: "Giá bản cao nhất", rule: "lower", unit: "VND" },
      { key: "price", label: "Giá tham khảo", rule: "lower", unit: "VND" }
    ]
  }
] as const;

export type CompareFieldKey = (typeof compareSections)[number]["fields"][number]["key"];
