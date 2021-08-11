import React, { useEffect, useState } from "react";
import { listReservations } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import {previous, next} from "../utils/date-time";

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */
function Dashboard({ date }) {
  console.log(`DATE FED TO DASHBOARD is ${date}`);
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);

  useEffect(loadDashboard, [date]);

  function loadDashboard() {
    const abortController = new AbortController();
    setReservationsError(null);
    listReservations({ date }, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);
    return () => abortController.abort();
  }
  let table = undefined;
  if(reservations.length) {
    // sort by reservation time ascending
    reservations.sort((x,y) => (x['reservation_time'] > y['reservation_time']) ? (
      1) : -1);
    table = reservations.map(({reservation_id, first_name, last_name, mobile_number,
      reservation_time, people},
      index) => (
      <tr key={index}>
          <td>{reservation_id}</td>
          <td>{last_name}</td>
          <td>{first_name}</td>
          <td>{mobile_number}</td>
          <td>{reservation_time}</td>
          <td>{people}</td>
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
      <ErrorAlert error={reservationsError} />
      {(reservations.length) ? (<table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Mobile number</th>
            <th>Reservation time</th>
            <th>Number of persons</th>
          </tr>
        </thead>
        <tbody>{table}</tbody>
      </table>) : "No reservations."}
    </main>
  );
}

export default Dashboard;