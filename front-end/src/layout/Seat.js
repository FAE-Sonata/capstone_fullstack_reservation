import { useEffect, useState } from "react";
import { listTables, readReservation, seatTable } from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import { useHistory, useParams } from "react-router";

function Seat() {
  const history = useHistory();
  const { reservation_id } = useParams(); // reservations/:reservation_id/seat

  const [reservationSize, setReservationSize] = useState(undefined);
  const [reservationDate, setReservationDate] = useState(undefined);
  const [tables, setTables] = useState([]);
  const [formErrors, setFormErrors] = useState(null);
  // const [hasAvailable, setHasAvailable] = useState(true);

  const [serverErrors, setServerErrors] = useState(null);
  useEffect(() => {
    const abortController = new AbortController();
    // retrieve reservation info for party size
    async function loadReservation() {
      try {
        const reservationResponse = await readReservation(reservation_id,
          abortController.signal);
        setReservationSize(reservationResponse['people']);
        setReservationDate(reservationResponse['reservation_date']);
        const tablesResponse = await listTables(abortController.signal);
        setTables(tablesResponse);
      }
      catch(error) {
        setServerErrors(error);
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
        <option key={index} value={table_id} data-capacity={capacity}
          disabled={(reservation_id || reservation_id === 0) || (
            capacity < reservationSize)}>
              {table_name} - {capacity}
        </option>
    ));
  }

  function getSelected() {
    const selectElem = document.querySelector("select");
    if(selectElem && Object.keys(selectElem).length) {
      for(let k = 0; k < selectElem.options.length; k++) {
        const thisOption = selectElem.options[k];
        if(thisOption.selected) {
          return {
            table_id: thisOption.value,
            capacity: parseInt(thisOption["attributes"]["data-capacity"][
              "value"]) };
        }
      }
    }
    return undefined;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const selectedOption = getSelected();
    if(selectedOption && event.target['innerText'].toLowerCase() !== "cancel") {
      if(selectedOption['capacity'] < reservationSize) {
        setFormErrors({ message: "Invalid seating." });
        return;
      }
      const seatPacket = { data: { reservation_id: reservation_id } };
      const headers = new Headers();
      headers.append("Content-Type", "application/json");

      const abortController = new AbortController();
      /* set reservation_id in table entry, which also
      updates "status" field in reservations table entry */
      await seatTable(selectedOption['table_id'], seatPacket,
        abortController.signal)
        .then((res) => res.json())
        .catch(setServerErrors);
      history.push(`../../dashboard?date=${reservationDate}`);
      window.location.reload();
      return;
    }
  };
  return (
    <main>
      <h1>Seating</h1>
      <p>Select a table, format is "(table name) - number of seats":</p>      
        <select name="table_id">
          {tablesOptions}
        </select>
      <ErrorAlert error={serverErrors} />
      <ErrorAlert error={formErrors}/>
      <button type="submit" onClick={handleSubmit}>Submit</button>
      <button onClick={(event) => {
        history.goBack();}}>Cancel</button>
      {/* <p hidden={hasAvailable}>No tables matching party size of {
        reservationSize} available. Press "Cancel" to go back.</p> */}
    </main>
  );
}

export default Seat;