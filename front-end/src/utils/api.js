/**
 * Defines the base URL for the API.
 * The default values is overridden by the `API_BASE_URL` environment variable.
 */
import formatReservationDate from "./format-reservation-date";
import formatReservationTime from "./format-reservation-date";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

/**
 * Defines the default headers for these functions to work with `json-server`
 */
const headers = new Headers();
headers.append("Content-Type", "application/json");

/**
 * Fetch `json` from the specified URL and handle error status codes and ignore `AbortError`s
 *
 * This function is NOT exported because it is not needed outside of this file.
 *
 * @param url
 *  the url for the requst.
 * @param options
 *  any options for fetch
 * @param onCancel
 *  value to return if fetch call is aborted. Default value is undefined.
 * @returns {Promise<Error|any>}
 *  a promise that resolves to the `json` data or an error.
 *  If the response is not in the 200 - 399 range the promise is rejected.
 */
async function fetchJson(url, options, onCancel) {
  try {
    const response = await fetch(url, options);

    if (response.status === 204) {
      return null;
    }

    const payload = await response.json();

    if (payload.error) {
      return Promise.reject({ message: payload.error });
    }
    return payload.data;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error.stack);
      throw error;
    }
    return Promise.resolve(onCancel);
  }
}

/**
 * Retrieves all existing reservation.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of reservation saved in the database.
 */

export async function listReservations(params, signal) {
  const url = new URL(`${API_BASE_URL}/reservations`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.append(key, value.toString())
  );
  return await fetchJson(url, { headers, signal }, [])
    .then(formatReservationDate)
    .then(formatReservationTime);
}

/**
 * Creates new reservation from the new reservation form.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of reservation saved in the database.
 */

export async function postReservation(created, signal) {
  const url = new URL(`${API_BASE_URL}/reservations/new`);
  return await fetch(url,
    { method: 'POST', headers, body: JSON.stringify(created), signal }, []);
}

/**
 * Creates new table from the new table form.
 * @returns {Promise<[table]>}
 *  a promise that resolves to a possibly empty array of table saved in the database.
 */

 export async function postTable(created, signal) {
  const url = new URL(`${API_BASE_URL}/tables/new`);
  return await fetch(url,
    { method: 'POST', headers, body: JSON.stringify(created), signal }, []);
}

/**
 * Updates reservation entry with status from given object.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of reservation saved in the database.
 */

export async function updateStatus(reservation_id, statusObj, signal) {
  const url = new URL(`${API_BASE_URL}/reservations/${reservation_id}/status`);
  return await fetch(url,
    { method: 'PUT', headers, body: JSON.stringify(statusObj), signal }, []);
}

/**
 * Retrieves the reservation with the specified `reservation_id`
 * @param reservation_id
 *  the `id` property matching the desired reservation.
 * @param signal
 *  optional AbortController.signal
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to the saved reservation.
 */
export async function readReservation(reservation_id, signal) {
  const url = `${API_BASE_URL}/reservations/${reservation_id}`;
  return await fetchJson(url, { headers, signal }, [])
    .then(formatReservationDate)
    .then(formatReservationTime);
}

/**
 * Updates reservation from the edit reservation form.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of reservation saved in the database.
 */

export async function updateReservation(reservation_id, updated, signal) {
  const url = new URL(`${API_BASE_URL}/reservations/${reservation_id}`);
  return await fetch(url,
    { method: 'PUT', headers, body: JSON.stringify(updated), signal }, []);
}

/**
 * Updates table entry upon placing reservation by assigning reservation_id.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of table saved in the database.
 */

 export async function seatTable(table_id, seating, signal) {
  const url = new URL(`${API_BASE_URL}/tables/${table_id}/seat`);
  return await fetch(url,
    { method: 'PUT', headers, body: JSON.stringify(seating), signal }, []);
}

/**
 * Updates table entry upon finishing reservation by nulling the reservation_id.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of table saved in the database.
 */

export async function unseatTable(table_id, signal) {
  const url = new URL(`${API_BASE_URL}/tables/${table_id}/seat`);
  return await fetch(url, { method: 'DELETE', headers, signal }, []);
}

/**
 * Retrieves all existing table.
 * @returns {Promise<[table]>}
 *  a promise that resolves to a possibly empty array of table saved in the database.
 */

export async function listTables(signal) {
  const url = new URL(`${API_BASE_URL}/tables`);
  return await fetchJson(url, { headers, signal }, []);
}