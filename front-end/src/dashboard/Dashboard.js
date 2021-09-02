import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { listReservations, listTables, unseatTable } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import {previous, next, today} from "../utils/date-time";
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
  const history = useHistory();

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
    if (window.confirm("Is this table ready to seat new guests? This" +
      " cannot be undone.")) {
      /* set "reservation_id" field in "tables" table to null, and
      set status within "reservations" table to FINISHED */
      await unseatTable(thisTableId, abortController.signal);
      // await listTables(abortController.signal); STILL NEEDED ?
      window.location.reload(); // refresh
    }
  };

  function handlePrev(event) {
    history.push(`?date=${previous(date)}`);
  }

  function handleNext(event) {
    history.push(`?date=${next(date)}`);
  }

  function handleToday(event) {
    history.push(`?date=${today()}`);
  }

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
          <button data-table-id-finish={table_id} type="button" className="btn btn-danger" onClick={handleUnseat}
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
        <p>
          <button type="button" onClick={handlePrev}>Previous date</button>
        </p><br/>
        <h4 className="mb-0">{`Reservations for the date of ${date}`}</h4><br/>
        <p><button type="button" onClick={handleNext}>Next date</button></p><br/>
        <p>
          <button type="button" onClick={handleToday}>Jump to today</button>
        </p>
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