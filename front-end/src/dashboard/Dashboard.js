import React, { useEffect, useState } from "react";
import { listReservations, listTables } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import {previous, next} from "../utils/date-time";
import DashboardReservations from "./DashboardReservations";

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */
function Dashboard({ date }) {
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);
  const [tables, setTables] = useState([]);
  const [tablesError, setTablesError] = useState(null);

  useEffect(loadDashboard, [date]);

  function loadDashboard() {
    const abortController = new AbortController();
    setReservationsError(null);
    listReservations({ date }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);
    listTables(abortController.signal)
      .then(setTables)
      .catch(setTablesError);
    return () => abortController.abort();
  }

  async function handleUnseat(event) {
    const thisTableId = event['target']['attributes']['data-table-id-finish'][
      'nodeValue'];
    const abortController = new AbortController();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const statusPacket = { data: { status: "finished" } };
    if (window.confirm("Is this table ready to seat new guests? This" +
      " cannot be undone.")) {
      await fetch(`http://localhost:5000/tables/${thisTableId}/seat`, {
        method: 'DELETE',
        headers: headers,
        signal: abortController.signal,
      });
      // set status within "reservations" table to FINISHED
      await fetch(`http://localhost:5000/reservations/${event['target']['id']}/status`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(statusPacket),
        signal: abortController.signal,
      })
      // fetch("http://localhost:5000/tables", {
      //   method: 'GET',
      //   headers: headers,
      //   signal: abortController.signal,
      // });
      window.location.reload(); // refresh
    }
  };

  let tablesTable = undefined;
  if(tables.length) {
    tables.sort((x,y) => (x['table_name'] > y['table_name']) ? 1 : -1);
    tablesTable = tables.map(({table_id, table_name, capacity, reservation_id},
      index) => (
      <tr key={index}>
        <td>{table_id}</td>
        <td>{table_name}</td>
        <td>{capacity}</td>
        <td data-table-id-status={table_id}>{(reservation_id) ? "Occupied" :
          "Free" } </td>
        <td>
          <button data-table-id-finish={table_id} onClick={handleUnseat}
            hidden={!reservation_id &&
            reservation_id !== 0} id={reservation_id}>
            Finish
          </button>
        </td>
        {/* data-table-id-status=${table.table_id} */}
      </tr>
    ));
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <div className="d-md-flex mb-3">
        <p><a href={`?date=${previous(date)}`}>[Previous date]</a></p><br/>
        <h4 className="mb-0">{`Reservations for the date of ${date}`}</h4><br/>
        <p><a href={`?date=${next(date)}`}>[Next date]</a></p><br/>
      </div>
      <DashboardReservations arrReservations={reservations}
        reservationsError={reservationsError}/>
      <ErrorAlert error={tablesError}/>
      {(tables.length) ? (<table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Table name</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Finish</th>
          </tr>
        </thead>
        <tbody>{tablesTable}</tbody>
      </table> ) : "No tables."}
    </main>
  );
}

export default Dashboard;