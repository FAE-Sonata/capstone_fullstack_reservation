import { useEffect, useState } from "react";
import { listTables, readReservation } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { useHistory, useParams } from "react-router";

function Seat() {
  const history = useHistory();
  const { reservation_id } = useParams(); // reservations/:reservation_id/seat
  // console.log("SEAT - reservation_id: ", reservation_id);

  const [reservation, setReservation] = useState({});
  const [reservationSize, setReservationSize] = useState(undefined);
  const [tables, setTables] = useState([]);
  // const [hasAvailable, setHasAvailable] = useState(true);

  const [errors, setErrors] = useState(null);
  useEffect(() => {
    const abortController = new AbortController();
    // retrieve reservation info for party size
    async function loadReservation() {
      try {
        const reservationResponse = await readReservation(reservation_id,
          abortController.signal);
        setReservation(reservationResponse[0]);
        setReservationSize(reservationResponse[0]['people']);
        const tablesResponse = await listTables(abortController.signal);
        setTables(tablesResponse);
      }
      catch(error) {
        setErrors(error);
      }
    }
    loadReservation();
    return (() => { abortController.abort() });
  }, [reservation_id]);

  // useEffect(() => {
  //   let anyOpen = false;
  //   console.log("USE EFFECT: DETERMINING ANY AVAILABLE TABLES");
  //   console.log(`${tables.length} TABLES`);
  //   for(let k = 0; k < tables.length; k++) {
  //     const thisReservationId = tables[k]['reservation_id'];
  //     console.log(`TABLE ${k} reservation ID: ${thisReservationId}`);
  //     console.log(`TABLE ${k} capacity: ${tables[k]['capacity']}`);
  //     if((!thisReservationId && thisReservationId !== 0) && (
  //       tables[k]['capacity'] >= reservationSize)) {
  //         anyOpen = true;
  //         break;
  //       }
  //   }
  //   if(!anyOpen) setHasAvailable(false);
  // }, [reservationSize, tables]);
  // console.log("RESERVATION OBTAINED: ", reservation);
  // console.log("party size: ", reservationSize);
  // console.log("TABLES OBTAINED: ", tables);

  let tablesOptions = undefined;
  if(reservationSize && tables.length) {
    tables.sort((x,y) => (x['table_name'] > y['table_name']) ? 1 : -1);
    tablesOptions = tables.map(({table_id, table_name, capacity, reservation_id},
      index) => (
        <option key={index} value={table_id} disabled={(
          reservation_id || reservation_id === 0) || (
            capacity < reservationSize)}>
            {table_name} - {capacity}
        </option>
    ));
  }

  function getSelected() {
    const selectElem = document.querySelector("select");
    if(selectElem && Object.keys(selectElem).length) {
      // console.log("HAS SELECT ELEMENT");
      for(let k = 0; k < selectElem.options.length; k++) {
        const thisOption = selectElem.options[k];
        if(thisOption.selected) return thisOption.value;
      }
    }
    return undefined;
  }

  const handleSubmit = (event) => {
    // console.log("ENTERING SUBMIT HANDLER");
    event.preventDefault();
    const selectedId = getSelected();
    // console.log("SELECTED ID was: ", selectedId);
    if(selectedId) {
      const submission = { data: { reservation_id: reservation_id } };
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const abortController = new AbortController();
      fetch(`http://localhost:5000/tables/${selectedId}/seat`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(submission),
        signal: abortController.signal,
      })
        .then((res) => res.json())
        .catch(setErrors);
      history.push(`../../dashboard`);
      return;
    }
  };
  return (
    <main>
      <form onSubmit={handleSubmit}>
        <h1>Seating</h1>
        {/* <div className="d-md-flex mb-3">
          <p><a href={`?date=${previous(date)}`}>[Previous date]</a></p><br/>
          <h4 className="mb-0">{`Reservations for the date of ${date}`}</h4><br/>
          <p><a href={`?date=${next(date)}`}>[Next date]</a></p><br/>
        </div> */}
        {/* <ErrorAlert error={reservationError} />
        <ErrorAlert error={tablesError} /> */}
        <ErrorAlert error={errors} />
        <p>Select a table, format is "(table name) - number of seats":</p>
        
          <select name="table_id">
            {tablesOptions}
          </select>
        
        {/* <button type="submit" disabled={!getSelected()}>Submit</button> */}
        <button type="submit">Submit</button>
        <button onClick={() => history.goBack()}>Cancel</button>
        {/* <p hidden={hasAvailable}>No tables matching party size of {
          reservationSize} available. Press "Cancel" to go back.</p> */}
      </form>
    </main>
  );
}

export default Seat;