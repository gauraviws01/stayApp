const getPropertyName = property => {
  if (typeof property === 'string') {
    return property.trim();
  }

  return (
    property?.unit_name ??
    property?.final_unit_name ??
    property?.unitName ??
    property?.property_name ??
    property?.propertyName ??
    property?.name ??
    ''
  );
};

const getPropertyId = property => {
  if (typeof property === 'string') {
    return property.trim();
  }

  return (
    property?.unit_id ??
    property?.unitId ??
    property?.property_id ??
    property?.id ??
    getPropertyName(property)
  );
};

const normalizeProperties = properties => {
  if (!Array.isArray(properties)) {
    return [];
  }

  const seenIds = new Set();

  return properties.reduce((normalizedList, property) => {
    const normalized =
      typeof property === 'string'
        ? {unit_id: property, unit_name: property}
        : {...property};
    const unitId = getPropertyId(normalized);
    const unitName = getPropertyName(normalized);

    if (
      unitId === null ||
      unitId === undefined ||
      unitId === '' ||
      !unitName ||
      !String(unitName).trim()
    ) {
      return normalizedList;
    }

    const key = String(unitId);

    if (seenIds.has(key)) {
      return normalizedList;
    }

    seenIds.add(key);
    normalizedList.push({
      ...normalized,
      unit_id: unitId,
      unit_name: unitName,
    });

    return normalizedList;
  }, []);
};

const mergeProperties = (...lists) => {
  const seenIds = new Set();

  return lists.flat().reduce((merged, property) => {
    const unitId = getPropertyId(property);
    const unitName = getPropertyName(property);

    if (
      unitId === null ||
      unitId === undefined ||
      unitId === '' ||
      !unitName ||
      !String(unitName).trim()
    ) {
      return merged;
    }

    const key = String(unitId);

    if (seenIds.has(key)) {
      return merged;
    }

    seenIds.add(key);
    merged.push({
      ...property,
      unit_id: unitId,
      unit_name: unitName,
    });

    return merged;
  }, []);
};

export const mergePropertyOptions = (
  storedProperties,
  fallbackProperties,
) => {
  const normalizedStored =
    normalizeProperties(storedProperties);
  const normalizedFallback =
    normalizeProperties(fallbackProperties);

  return normalizedStored.length
    ? mergeProperties(normalizedStored, normalizedFallback)
    : mergeProperties(normalizedFallback);
};