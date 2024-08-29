import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const parseSerializedSet = (value: string) => {
  const match = value.match(/^{((?:\w+(?:,\w+)*)?)}$/);

  const arrayMatch = match?.[1];

  if (arrayMatch === "") {
    return new Set();
  }

  if (arrayMatch !== undefined) {
    const array = arrayMatch
      .split(",")
      .map((item) => deserializeFromSearchParam(item));

    return new Set(array);
  }
};

const checkSupportedType = (value: unknown) => {
  return (
    ["number", "string", "boolean"].includes(typeof value) ||
    value === null ||
    value === undefined ||
    value instanceof Set
  );
};

const serializeToQueryString = <Value>(value: Value): string => {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "number":
    case "string":
    case "boolean":
      return value.toString();
    case "object":
      if (value instanceof Set) {
        const serializedList = Array.from(value)
          .map((item) => serializeToQueryString(item))
          .join(",");

        return `{${serializedList}}`;
      }

      throw new Error(`Type is not supported`);
    default:
      throw new Error(`Type is not supported`);
  }
};

const deserializeFromSearchParam = <Value>(queryString: string): Value => {
  if (queryString === "null") {
    return null as Value;
  }

  if (queryString === "true") {
    return true as Value;
  }

  if (queryString === "false") {
    return false as Value;
  }

  const numericValue = parseInt(queryString);

  if (!isNaN(numericValue)) {
    return numericValue as Value;
  }

  const parsedSet = parseSerializedSet(queryString);

  if (parsedSet) {
    return parsedSet as Value;
  }

  if (typeof queryString === "string") {
    return queryString as Value;
  }

  throw new Error(`Type is not supported`);
};

const parseFiltersFromParams = <Filters>(
  defaultFilters: Filters,
  searchParams: URLSearchParams
) => {
  const activeFilters = new Set<keyof Filters>();
  const filters = {} as Filters;

  for (const key in defaultFilters) {
    const paramValue = searchParams.get(key);

    const defaultFilterValue = defaultFilters[key];

    if (!checkSupportedType(defaultFilterValue)) {
      throw new Error(
        "Serialization for this type of value is not supported! Supported types are: number, string, boolean, null or Set"
      );
    }

    if (paramValue !== null) {
      filters[key] = deserializeFromSearchParam(paramValue);
      activeFilters.add(key);
    } else {
      filters[key] = defaultFilterValue;
    }
  }

  return {
    defaultFiltersFromParams: filters,
    defaultActiveFilters: activeFilters,
  };
};

const useFiltersWithApply = <Filters extends Record<string, unknown>>(
  defaultFilters: Filters
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFiltersRef = useRef(defaultFilters);

  const { defaultActiveFilters, defaultFiltersFromParams } = useMemo(
    () => parseFiltersFromParams(defaultFiltersRef.current, searchParams),
    [defaultFiltersRef.current, searchParams]
  );

  const activeFiltersRef = useRef(defaultActiveFilters);
  const [localFilters, setLocalFilters] = useState(defaultFiltersFromParams);

  const updateFilterByKey = <Key extends keyof Filters>(
    key: Key,
    value: Filters[Key]
  ) => {
    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));

    activeFiltersRef.current.add(key);
  };

  const resetFilterByKey = <Key extends keyof Filters>(key: Key) => {
    setLocalFilters((prevFilters) => ({
      ...prevFilters,
      [key]: defaultFiltersRef.current[key],
    }));

    activeFiltersRef.current.delete(key);
  };

  const resetFilters = () => {
    const resetFilters = {} as Filters;

    for (const key in localFilters) {
      resetFilters[key] = defaultFiltersRef.current[key];
    }

    setLocalFilters(resetFilters);
    activeFiltersRef.current.clear();
  };

  const checkFilterActive = <Key extends keyof Filters>(key: Key) => {
    return activeFiltersRef.current.has(key);
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);

    for (const [filterKey, filterValue] of Object.entries(localFilters)) {
      if (checkFilterActive(filterKey)) {
        params.set(filterKey, serializeToQueryString(filterValue));
      } else {
        params.delete(filterKey);
      }
    }

    setSearchParams(params);
  };

  const appliedFilters = useMemo(() => {
    const filters = {} as Partial<Filters>;

    for (const key in defaultFiltersFromParams) {
      if (checkFilterActive(key)) {
        filters[key] = defaultFiltersFromParams[key];
      }
    }

    return filters;
  }, [defaultFiltersFromParams]);

  const activeFiltersCount = activeFiltersRef.current.size;

  return {
    filters: localFilters,
    appliedFilters,
    activeFiltersCount,
    checkFilterActive,
    updateFilterByKey,
    resetFilterByKey,
    resetFilters,
    applyFilters,
  } as const;
};

export default useFiltersWithApply;
