import React from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { updateStatus } from "../utils/api";

function DashboardReservations({arrReservations, reservationsError,
  nonFinished=true}) {
  let reservationsTable = undefined;
  async function cancelReservation(event) {
    const thisId = event['target']['attributes']['data-reservation-id-cancel'][
      'value'];
    const abortController = new AbortController();
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const statusPacket = { data: { status: "cancelled" } };
    if (window.confirm("Do you want to cancel this reservation? " + 
      "This cannot be undone.")) {
        /* cancel a seated reservation? */
      // await fetch(`http://localhost:5000/tables/${thisTableId}/seat`, {
      //   method: 'DELETE',
      //   headers: headers,
      //   signal: abortController.signal,
      // });
      // set status within "reservations" table to CANCELLED
      await updateStatus(thisId, statusPacket, abortController.signal);
      window.location.reload(); // refresh
    }
  }
  if(arrReservations.length) {
    // filter out reservations with status of "cancelled"
    let nonCancel = arrReservations.filter(x => x['status'] !== "cancelled");
    // filter out reservations with status of "finished"
    let activeReservations = (nonFinished) ? (
      nonCancel.filter(x => x['status'] !== "finished")) : nonCancel;
    if(activeReservations.length){
        // sort by reservation time ascending
        activeReservations.sort((x,y) => {
          const xDate = x['reservation_date'];
          const yDate = y['reservation_date'];
          if(xDate === yDate) return (x['reservation_time'] > 
            y['reservation_time']) ? 1 : -1;
          return (xDate > yDate) ? 1 : -1;
        });
        reservationsTable = activeReservations.map(({reservation_id, first_name,
            last_name, mobile_number, reservation_date, reservation_time,
            people, status},
            index) => (
            <tr key={index}>
                <td>{reservation_id}</td>
                <td>{last_name}</td>
                <td>{first_name}</td>
                <td>{mobile_number}</td>
                <td>{reservation_date}</td>
                <td>{reservation_time}</td>
                <td>{people}</td>
                <td><a href={`/reservations/${reservation_id}/seat`}
                    hidden={status !== "booked"}>Seat</a></td>
                <td data-reservation-id-status={reservation_id}>{status}</td>
                <td><a href={`/reservations/${reservation_id}/edit`}>Edit</a></td>
                <td>
                  <button data-reservation-id-cancel={reservation_id}
                    onClick={cancelReservation}>
                      Cancel
                  </button>
                </td>
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
            <th>Reservation date</th>
            <th>Reservation time</th>
            <th>Number of persons</th>
            <th>[SEAT]</th>
            <th>Status</th>
            <th>[EDIT]</th>
            <th>[CANCEL]</th>
          </tr>
        </thead>
        <tbody>{reservationsTable}</tbody>
      </table>) : "No reservations found."}
    </div>
  );
}

export default DashboardReservations;