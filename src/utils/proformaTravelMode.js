/**
 * Derive exclusive active travel mode (mirrors backend exclusivity).
 * Returns ROAD | FIXED | RAIL | FLIGHT.
 */
export function getActiveTravelMode(travelItems = []) {
  const travel = Array.isArray(travelItems) ? travelItems : [];
  const modeOf = (i) => String(i?.travel_mode || "ROAD").toUpperCase();
  const rails = travel.filter((i) => modeOf(i) === "RAIL");
  const flights = travel.filter((i) => modeOf(i) === "FLIGHT");
  const railsBilled = rails.filter((i) => Number(i.line_total) > 0);
  const flightsBilled = flights.filter((i) => Number(i.line_total) > 0);
  const railCandidates = railsBilled.length ? railsBilled : rails;
  const flightCandidates = flightsBilled.length ? flightsBilled : flights;

  if (railCandidates.length && flightCandidates.length) {
    const lastId = (list) =>
      list.reduce((best, i) => {
        const id = String(i._id || "");
        return id > best ? id : best;
      }, "");
    return lastId(railCandidates) >= lastId(flightCandidates) ? "RAIL" : "FLIGHT";
  }
  if (railCandidates.length) return "RAIL";
  if (flightCandidates.length) return "FLIGHT";

  const hasFixed = travel.some((i) => modeOf(i) === "FIXED");
  const hasRoad = travel.some((i) => modeOf(i) === "ROAD");
  if (hasFixed && !hasRoad) return "FIXED";
  if (hasRoad) return "ROAD";
  return hasFixed ? "FIXED" : "ROAD";
}

export function activeTravelModeLabel(mode) {
  switch (String(mode || "").toUpperCase()) {
    case "FIXED":
      return "Fixed module";
    case "RAIL":
      return "Rail";
    case "FLIGHT":
      return "Flight";
    default:
      return "Road";
  }
}
