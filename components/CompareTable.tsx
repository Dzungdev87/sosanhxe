import type { Car } from "@prisma/client";
import { compareSections, compareValue } from "@/lib/compareEngine";

function formatValue(value: unknown, unit: string, key?: string) {
  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (typeof value === "number" || typeof value === "bigint") {
    const isZero = value === 0 || value === BigInt(0);

    if (key === "releaseYear") {
      return String(value);
    }

    if (unit === "VND" && isZero) {
      return "-";
    }

    if (isZero && unit !== "") {
      return "-";
    }

    const formatted = unit === "VND" ? new Intl.NumberFormat("vi-VN").format(value) : new Intl.NumberFormat("vi-VN").format(value);
    return `${formatted}${unit && unit !== "VND" ? ` ${unit}` : unit === "VND" ? " VND" : ""}`;
  }

  return String(value ?? "-");
}

function valueClass(isBetter: boolean) {
  return isBetter ? "font-bold text-good" : "text-ink";
}

export default function CompareTable({ carA, carB }: { carA: Car; carB: Car }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface">
          <tr>
            <th className="w-[34%] px-3 py-3 text-xs uppercase text-muted sm:px-5">Thông số</th>
            <th className="w-[33%] px-3 py-3 text-ink sm:px-5">{carA.name}</th>
            <th className="w-[33%] px-3 py-3 text-ink sm:px-5">{carB.name}</th>
          </tr>
        </thead>
        {compareSections.map((section) => (
          <tbody key={section.title} className="divide-y divide-line">
            <tr>
              <th colSpan={3} className="bg-ink px-3 py-2 text-left text-xs font-bold uppercase text-white sm:px-5">
                {section.title}
              </th>
            </tr>
            {section.fields.map((field) => {
              const valueA = carA[field.key as keyof Car];
              const valueB = carB[field.key as keyof Car];

              /**
               * Logic ẩn/hiện cho 2 dòng tiêu thụ nhiên liệu:
               *
               * - 2 xe xăng:  fuelConsumption > 0, energyConsumption = 0 (cả 2)
               *               → ẩn dòng kWh, hiện dòng lít
               *
               * - 2 xe điện:  fuelConsumption = 0 (cả 2), energyConsumption > 0
               *               → ẩn dòng lít, hiện dòng kWh
               *
               * - Xăng vs Điện: 1 dòng có 1 giá trị > 0, 1 giá trị = 0
               *               → hiện cả 2 dòng (giá trị 0 hiển thị là "-")
               */
              const isFuelRow = field.key === "fuelConsumption";
              const isEnergyRow = field.key === "energyConsumption";

              if (isFuelRow || isEnergyRow) {
                const aIsZero = typeof valueA !== "number" || valueA === 0;
                const bIsZero = typeof valueB !== "number" || valueB === 0;
                // Ẩn dòng nếu CẢ HAI xe đều có giá trị = 0 (hoặc không nhập)
                if (aIsZero && bIsZero) return null;
              }

              const result = compareValue(valueA, valueB, field.rule);

              return (
                <tr key={field.key} className="align-top">
                  <td className="px-3 py-3 font-medium text-muted sm:px-5">{field.label}</td>
                  <td className={`px-3 py-3 sm:px-5 ${valueClass(result.aBetter)}`}>{formatValue(valueA, field.unit, field.key)}</td>
                  <td className={`px-3 py-3 sm:px-5 ${valueClass(result.bBetter)}`}>{formatValue(valueB, field.unit, field.key)}</td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}
