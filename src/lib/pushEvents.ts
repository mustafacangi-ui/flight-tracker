/** Fired on `window` when user bookmarks a flight (see FlightSaveBookmark). */
export const ROUTE_WINGS_FLIGHT_SAVED_EVENT = "routewings-flight-saved";

export function dispatchFlightSavedEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ROUTE_WINGS_FLIGHT_SAVED_EVENT));
}
