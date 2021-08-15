import { useEffect, useState } from "react";
import { listTables, readReservation } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { useParams } from "react-router";

function Seat(/*reservation_id*/) {
  const { reservation_id } = useParams();
  // console.log("SEAT RESERVATION ID: ", reservation_id);
  const [reservation, setReservation] = useState({});
  const [tables, setTables] = useState([]);
  const [reservationError, setReservationError] = useState(null);
  const [tablesError, setTablesError] = useState(null);
  useEffect(loadInfo, []);
  function loadInfo() {
      const abortController = new AbortController();
      readReservation(reservation_id, abortController.signal)
        .then(setReservation)
        .catch(setReservationError);
      listTables(abortController.signal)
        .then(setTables)
        .catch(setTablesError);
      return () => abortController.abort();
  }

  console.log("SEAT -- RESERVATION PPL: ", reservation[0]['people']);
  let tablesOptions = undefined;
  if(Object.keys(reservation).length && tables.length) {
      tables.sort((x,y) => (x['table_name'] > y['table_name']) ? 1 : -1);
      tablesOptions = tables.map(({table_id, table_name, capacity, reservation_id},
        index) => (
          <option key={index} value={table_id} disabled={
            /*(!reservation_id && reservation_id !== 0) ||*/ (
              capacity < reservation[0]['people'])}>
              {table_name} - {capacity}
          </option>
      ));
  }
  return (
    <main>
      <h1>Seating</h1>
      {/* <div className="d-md-flex mb-3">
        <p><a href={`?date=${previous(date)}`}>[Previous date]</a></p><br/>
        <h4 className="mb-0">{`Reservations for the date of ${date}`}</h4><br/>
        <p><a href={`?date=${next(date)}`}>[Next date]</a></p><br/>
      </div> */}
      <ErrorAlert error={reservationError} />
      <ErrorAlert error={tablesError} />
      <p>Select a table, format is "(table name) - number of seats":</p>
      {(tablesOptions) ? (<select name="table_id">
        {tablesOptions}
      </select>) : `No open tables matching party size of ${reservation[0]['people']}.`}
    </main>
  );
}

export default Seat;