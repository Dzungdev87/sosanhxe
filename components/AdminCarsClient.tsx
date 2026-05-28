"use client";

import type { Car } from "@prisma/client";
import { useMemo, useState } from "react";

type EditableCar = Omit<Car, "createdAt" | "updatedAt"> & {
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const textFields: Array<{ key: keyof EditableCar; label: string; group: string }> = [
  { key: "name", label: "Tên xe", group: "Thông tin cơ bản" },
  { key: "imageKey", label: "Cloudinary image key", group: "Thông tin cơ bản" },
  { key: "brand", label: "Hãng", group: "Thông tin cơ bản" },
  { key: "segment", label: "Phân khúc", group: "Thông tin cơ bản" },
  { key: "origin", label: "Xuất xứ", group: "Thông tin cơ bản" },
  { key: "platform", label: "Nền tảng", group: "Khung gầm" },
  { key: "drivetrain", label: "Hệ dẫn động", group: "Khung gầm" },
  { key: "frontSuspension", label: "Treo trước", group: "Khung gầm" },
  { key: "rearSuspension", label: "Treo sau", group: "Khung gầm" },
  { key: "frontBrake", label: "Phanh trước", group: "Khung gầm" },
  { key: "rearBrake", label: "Phanh sau", group: "Khung gầm" },
  { key: "tireWheel", label: "Lốp / la-zăng", group: "Khung gầm" },
  { key: "engine", label: "Động cơ", group: "Động cơ" },
  { key: "transmission", label: "Hộp số", group: "Động cơ" },
  { key: "batteryType", label: "Loại pin", group: "Pin / hiệu suất điện" },
  { key: "cabinSpace", label: "Không gian cabin", group: "Nội thất" },
  { key: "safety", label: "Mô tả an toàn", group: "An toàn" }
];

const numberFields: Array<{ key: keyof EditableCar; label: string; group: string; step?: string }> = [
  { key: "releaseYear", label: "Năm ra mắt", group: "Thông tin cơ bản" },
  { key: "price", label: "Giá tham khảo", group: "Giá bán" },
  { key: "basePrice", label: "Giá bản tiêu chuẩn", group: "Giá bán" },
  { key: "topPrice", label: "Giá bản cao nhất", group: "Giá bán" },
  { key: "engineHp", label: "Công suất", group: "Động cơ" },
  { key: "torque", label: "Mô-men xoắn", group: "Động cơ" },
  { key: "acceleration0100", label: "Tăng tốc 0-100 km/h (giây)", group: "Động cơ", step: "0.1" },
  { key: "fuelConsumption", label: "Tiêu hao hỗn hợp", group: "Động cơ", step: "0.1" },
  { key: "batteryCapacity", label: "Dung lượng pin (kWh)", group: "Pin / hiệu suất điện", step: "0.1" },
  { key: "seats", label: "Số chỗ", group: "Kích thước" },
  { key: "length", label: "Dài", group: "Kích thước" },
  { key: "width", label: "Rộng", group: "Kích thước" },
  { key: "height", label: "Cao", group: "Kích thước" },
  { key: "wheelbase", label: "Chiều dài cơ sở", group: "Kích thước" },
  { key: "groundClearance", label: "Khoảng sáng gầm", group: "Kích thước" },
  { key: "curbWeight", label: "Trọng lượng bản thân", group: "Kích thước" },
  { key: "grossWeight", label: "Trọng lượng toàn tải", group: "Kích thước" },
  { key: "turningRadius", label: "Bán kính vòng quay", group: "Kích thước", step: "0.1" },
  { key: "cargoVolume", label: "Khoang hành lý", group: "Kích thước" },
  { key: "fuelTankCapacity", label: "Bình nhiên liệu", group: "Kích thước" },
  { key: "screenSize", label: "Màn hình", group: "Nội thất", step: "0.1" },
  { key: "speakers", label: "Số loa", group: "Nội thất" },
  { key: "airbags", label: "Số túi khí", group: "An toàn" }
];

const booleanFields: Array<{ key: keyof EditableCar; label: string; group: string }> = [
  { key: "ledHeadlights", label: "Đèn LED", group: "Ngoại thất" },
  { key: "autoHeadlights", label: "Đèn tự động", group: "Ngoại thất" },
  { key: "electricMirrors", label: "Gương điện", group: "Ngoại thất" },
  { key: "sunroof", label: "Cửa sổ trời", group: "Ngoại thất" },
  { key: "appleCarplay", label: "Apple CarPlay", group: "Nội thất" },
  { key: "androidAuto", label: "Android Auto", group: "Nội thất" },
  { key: "bluetooth", label: "Bluetooth", group: "Nội thất" },
  { key: "usb", label: "USB", group: "Nội thất" },
  { key: "wirelessCharging", label: "Sạc không dây", group: "Nội thất" },
  { key: "leatherSeats", label: "Ghế da", group: "Nội thất" },
  { key: "electricParkingBrake", label: "Phanh tay điện tử", group: "Hỗ trợ vận hành" },
  { key: "autoHold", label: "Auto Hold", group: "Hỗ trợ vận hành" },
  { key: "hud", label: "HUD", group: "Hỗ trợ vận hành" },
  { key: "driveModes", label: "Chế độ lái", group: "Hỗ trợ vận hành" },
  { key: "paddleShifters", label: "Lẫy chuyển số", group: "Hỗ trợ vận hành" },
  { key: "cruiseControl", label: "Cruise Control", group: "Hỗ trợ vận hành" },
  { key: "adaptiveCruiseControl", label: "Adaptive Cruise", group: "Hỗ trợ vận hành" },
  { key: "absEbd", label: "ABS/EBD", group: "An toàn" },
  { key: "brakeAssist", label: "BA", group: "An toàn" },
  { key: "esp", label: "ESP", group: "An toàn" },
  { key: "tractionControl", label: "TCS", group: "An toàn" },
  { key: "hillStartAssist", label: "Hỗ trợ khởi hành ngang dốc", group: "An toàn" },
  { key: "blindSpotWarning", label: "Cảnh báo điểm mù", group: "An toàn" },
  { key: "rearCamera", label: "Camera lùi", group: "An toàn" },
  { key: "camera360", label: "Camera 360", group: "An toàn" },
  { key: "laneAssist", label: "Hỗ trợ giữ làn", group: "An toàn" },
  { key: "aeb", label: "AEB", group: "An toàn" },
  { key: "rearCrossTrafficAlert", label: "Cảnh báo cắt ngang khi lùi", group: "An toàn" },
  { key: "tirePressureMonitoring", label: "Cảm biến áp suất lốp", group: "An toàn" },
  { key: "parkingSensors", label: "Cảm biến đỗ xe", group: "An toàn" },
  { key: "isofix", label: "Isofix", group: "An toàn" }
];

const groups = ["Thông tin cơ bản", "Giá bán", "Động cơ", "Pin / hiệu suất điện", "Kích thước", "Khung gầm", "Ngoại thất", "Nội thất", "Hỗ trợ vận hành", "An toàn"];

export default function AdminCarsClient({ initialCars }: { initialCars: EditableCar[] }) {
  const [cars, setCars] = useState(initialCars);
  const [selectedId, setSelectedId] = useState(initialCars[0]?.id ?? "");
  const [draft, setDraft] = useState<EditableCar | null>(initialCars[0] ?? null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cars;
    return cars.filter((car) => `${car.name} ${car.brand} ${car.segment}`.toLowerCase().includes(normalized));
  }, [cars, query]);

  function selectCar(car: EditableCar) {
    setSelectedId(car.id);
    setDraft({ ...car });
    setMessage("");
  }

  function updateValue(key: keyof EditableCar, value: string | number | boolean) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveCar() {
    if (!draft) return;
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/cars/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanCarPayload(draft))
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Không thể lưu xe");
      return;
    }

    setCars((current) => current.map((car) => (car.id === data.car.id ? data.car : car)));
    setDraft(data.car);
    setMessage("Đã lưu thay đổi.");
  }

  async function deleteCar() {
    if (!draft) return;
    const confirmed = window.confirm(`Xoá "${draft.name}" khỏi Supabase? Vote liên quan cũng sẽ bị xoá.`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/cars/${draft.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Không thể xoá xe");
      return;
    }

    const nextCars = cars.filter((car) => car.id !== draft.id);
    setCars(nextCars);
    setSelectedId(nextCars[0]?.id ?? "");
    setDraft(nextCars[0] ? { ...nextCars[0] } : null);
    setMessage("Đã xoá xe.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border border-line bg-white p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên, hãng, phân khúc"
          className="mb-4 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
        />
        <div className="max-h-[680px] space-y-2 overflow-auto">
          {filteredCars.map((car) => (
            <button
              key={car.id}
              type="button"
              onClick={() => selectCar(car)}
              className={`w-full rounded-md border px-3 py-3 text-left text-sm ${selectedId === car.id ? "border-good bg-green-50" : "border-line bg-white hover:border-good"}`}
            >
              <span className="block font-semibold text-ink">{car.name}</span>
              <span className="text-xs text-muted">
                {car.brand} - {car.segment}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-lg border border-line bg-white p-4">
        {draft ? (
          <>
            <div className="mb-5 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink">{draft.name}</h2>
                <p className="mt-1 text-sm text-muted">Slug hiện tại: {draft.slug}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={deleteCar} disabled={saving} className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                  Xoá xe
                </button>
                <button type="button" onClick={saveCar} disabled={saving} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  Lưu thay đổi
                </button>
              </div>
            </div>

            {message ? <div className="mb-4 rounded-md bg-surface px-3 py-2 text-sm text-muted">{message}</div> : null}

            <div className="space-y-8">
              {groups.map((group) => (
                <fieldset key={group}>
                  <legend className="mb-3 text-sm font-bold uppercase text-ink">{group}</legend>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {textFields
                      .filter((field) => field.group === group)
                      .map((field) => (
                        <label key={String(field.key)} className="block">
                          <span className="mb-1 block text-xs font-semibold text-muted">{field.label}</span>
                          <input value={String(draft[field.key] ?? "")} onChange={(event) => updateValue(field.key, event.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good" />
                        </label>
                      ))}
                    {numberFields
                      .filter((field) => field.group === group)
                      .map((field) => (
                        <label key={String(field.key)} className="block">
                          <span className="mb-1 block text-xs font-semibold text-muted">{field.label}</span>
                          <input
                            type="number"
                            step={field.step ?? "1"}
                            value={Number(draft[field.key] ?? 0)}
                            onChange={(event) => updateValue(field.key, Number(event.target.value))}
                            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-good"
                          />
                        </label>
                      ))}
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {booleanFields
                      .filter((field) => field.group === group)
                      .map((field) => (
                        <label key={String(field.key)} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
                          <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => updateValue(field.key, event.target.checked)} />
                          <span>{field.label}</span>
                        </label>
                      ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted">Chưa có xe nào trong database.</div>
        )}
      </section>
    </div>
  );
}

function cleanCarPayload(car: EditableCar) {
  const payload = { ...car } as Partial<EditableCar>;
  delete payload.id;
  delete payload.slug;
  delete payload.createdAt;
  delete payload.updatedAt;
  return payload;
}
