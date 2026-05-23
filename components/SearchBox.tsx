"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CarOption = {
  id: string;
  name: string;
  brand: string;
  slug: string;
};

export default function SearchBox() {
  const router = useRouter();
  const [cars, setCars] = useState<CarOption[]>([]);
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [selectedA, setSelectedA] = useState<CarOption | null>(null);
  const [selectedB, setSelectedB] = useState<CarOption | null>(null);

  useEffect(() => {
    fetch("/api/cars")
      .then((res) => res.json())
      .then((data) => setCars(data.cars ?? []))
      .catch(() => setCars([]));
  }, []);

  const suggestionsA = useMemo(() => findCars(cars, queryA, selectedB?.id), [cars, queryA, selectedB]);
  const suggestionsB = useMemo(() => findCars(cars, queryB, selectedA?.id), [cars, queryB, selectedA]);

  function submit() {
    if (!selectedA || !selectedB || selectedA.id === selectedB.id) {
      return;
    }

    router.push(`/compare/${selectedA.slug}-vs-${selectedB.slug}`);
  }

  return (
    <div className="space-y-4">
      <CarCombobox
        label="Xe thứ nhất"
        query={queryA}
        selected={selectedA}
        suggestions={suggestionsA}
        onQueryChange={(value) => {
          setQueryA(value);
          setSelectedA(null);
        }}
        onSelect={(car) => {
          setSelectedA(car);
          setQueryA(car.name);
        }}
      />
      <CarCombobox
        label="Xe thứ hai"
        query={queryB}
        selected={selectedB}
        suggestions={suggestionsB}
        onQueryChange={(value) => {
          setQueryB(value);
          setSelectedB(null);
        }}
        onSelect={(car) => {
          setSelectedB(car);
          setQueryB(car.name);
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!selectedA || !selectedB || selectedA.id === selectedB.id}
        className="w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        So sánh
      </button>
    </div>
  );
}

function CarCombobox({
  label,
  query,
  selected,
  suggestions,
  onQueryChange,
  onSelect
}: {
  label: string;
  query: string;
  selected: CarOption | null;
  suggestions: CarOption[];
  onQueryChange: (value: string) => void;
  onSelect: (car: CarOption) => void;
}) {
  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-ink">{label}</label>
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Nhập tên xe"
        className="w-full rounded-md border border-line bg-white px-3 py-3 text-sm outline-none focus:border-good focus:ring-2 focus:ring-green-100"
      />
      {query.length > 0 && !selected ? (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-md border border-line bg-white shadow-lg">
          {suggestions.length > 0 ? (
            suggestions.map((car) => (
              <button key={car.id} type="button" onClick={() => onSelect(car)} className="block w-full px-3 py-3 text-left text-sm hover:bg-surface">
                <span className="font-semibold text-ink">{car.name}</span>
                <span className="ml-2 text-muted">{car.brand}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted">Không tìm thấy xe phù hợp</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function findCars(cars: CarOption[], query: string, excludeId?: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return cars.filter((car) => car.id !== excludeId).slice(0, 6);
  }

  return cars
    .filter((car) => car.id !== excludeId)
    .filter((car) => `${car.name} ${car.brand}`.toLowerCase().includes(normalized))
    .slice(0, 8);
}
