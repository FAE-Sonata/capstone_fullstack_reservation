import React, { useEffect, useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */
function DashboardReservations({arrReservations, reservationsError}) {
//   const [reservations, setReservations] = useState([]);
//   const [reservationsError, setReservationsError] = useState(null);

  let reservationsTable = undefined;
  if(arrReservations.length) {
    // filter out reservations with status of "finished"
    let activeReservations = arrReservations.filter(x => x['status'] !==
        "finished");
    if(activeReservations.length){
        // sort by reservation time ascending
        activeReservations.sort((x,y) => (x['reservation_time'] > 
            y['reservation_time']) ? 1 : -1);
        reservationsTable = activeReservations.map(({reservation_id, first_name,
            last_name, mobile_number, reservation_time, people, status},
            index) => (
            <tr key={index}>
                <td>{reservation_id}</td>
                <td>{last_name}</td>
                <td>{first_name}</td>
                <td>{mobile_number}</td>
                <td>{reservation_time}</td>
                <td>{people}</td>
                <td><a href={`/reservations/${reservation_id}/seat`}
                    hidden={status !== "booked"}>Seat</a></td>
                <td data-reservation-id-status={reservation_id}>{status}</td>
            </tr>
        ));
    }
  }

  return (
    <div>
      <ErrorAlert error={reservationsError} />
      {(reservationsTable) ? (<table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Mobile number</th>
            <th>Reservation time</th>
            <th>Number of persons</th>
            <th>[SEAT]</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>{reservationsTable}</tbody>
      </table>) : "No reservations found."}
    </div>
  );
}

export default DashboardReservations;