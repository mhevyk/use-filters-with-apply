import { useEffect } from "react";
import useFiltersWithApply from "./useFiltersWithApply";

export default function App() {
  const {
    filters,
    appliedFilters,
    activeFiltersCount,
    updateFilterByKey,
    resetFilterByKey,
    resetFilters,
    applyFilters,
    checkFilterActive,
  } = useFiltersWithApply({
    name: "",
    age: 0,
    isPaid: false,
    statuses: new Set<string>(),
  });

  useEffect(() => {
    console.log("FROM query", appliedFilters);
  }, [appliedFilters]);

  const statuses = ["completed", "canceled", "delivered"];

  return (
    <div>
      {statuses.map((status) => (
        <label key={status} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={filters.statuses.has(status)}
            onChange={(event) => {
              const newSet = new Set(filters.statuses);

              if (event.target.checked) {
                newSet.add(status);
              } else {
                newSet.delete(status);
              }

              updateFilterByKey("statuses", newSet);
            }}
          />
          {status}
        </label>
      ))}
      <p>Active filters count: {activeFiltersCount}</p>
      {checkFilterActive("name") && <p>Name filter active</p>}
      {checkFilterActive("age") && <p>Age filter active</p>}
      <input
        type="number"
        value={filters.age}
        onChange={(event) =>
          updateFilterByKey("age", Number(event.target.value))
        }
      />
      <input
        value={filters.name}
        onChange={(event) => updateFilterByKey("name", event.target.value)}
      />
      <input
        type="checkbox"
        checked={filters.isPaid}
        onChange={(event) => updateFilterByKey("isPaid", event.target.checked)}
      />
      <button onClick={() => resetFilterByKey("name")}>
        Reset name filter
      </button>
      <button onClick={() => resetFilterByKey("age")}>Reset age filter</button>
      <button onClick={() => resetFilterByKey("statuses")}>
        Reset statuses filter
      </button>
      <button onClick={applyFilters}>Apply filters</button>
      <button onClick={() => resetFilters()}>Clear filters</button>
    </div>
  );
}
