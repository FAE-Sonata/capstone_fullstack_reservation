import { useEffect, useState } from "react";
import { listTables, readReservation } from "../utils/api";

function Seat(reservation_id) {
    const [reservation, setReservation] = useState([]);
    const [tables, setTables] = useState([]);
    const [reservationErrors, setReservationErrors] = useState(null);
    const [tablesErrors, setTablesErrors] = useState(null);
    useEffect(loadInfo, []);
    function loadInfo() {
        const abortController = new AbortController();
        readReservation(reservation_id, abortController.signal)
          .then(setReservation)
          .catch(setReservationErrors);
        listTables(abortController.signal)
            .then(setTables)
            .catch(setTablesErrors);
        return () => abortController.abort();
    }
    let tablesTable = undefined;
    if(reservation && tables.length) {
        tables.sort((x,y) => (x['table_name'] > y['table_name']) ? 1 : -1);
        // tablesTable = tables.map(({table_id, table_name, capacity, reservation_id},
        //   index) => (
        // ));
    }
}