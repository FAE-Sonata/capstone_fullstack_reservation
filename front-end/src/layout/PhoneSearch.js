import React, { useState } from "react";
import { useHistory } from "react-router";
import DashboardReservations from "../dashboard/DashboardReservations";
import { listReservations } from "../utils/api";
import ErrorAlert from "./ErrorAlert";

function PhoneSearch() {
  const history = useHistory();

  const [searchTerm, setSearchTerm] = useState("");
  const [clickedFind, setClickedFind] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);
  const [inputError, setInputError] = useState(null);

  const setMessage = (message) => {
    setInputError({ message });
  }

  const handlePhone = ({ target }) => {
    setInputError(null);
    const input = target.value.trim();
    const phoneRegex = new RegExp(/^\(?\s*\d{0,3}\s*\)?\s*\-?\s*\d{0,3}\s*\-?\s*\d{0,4}$/);
    if(phoneRegex.test(input)) setSearchTerm(input);
    else setMessage("Invalid mobile number format");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setClickedFind(true);
    setReservationsError(null);
    history.push(`/search?mobile_number=${searchTerm}`);
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const abortController = new AbortController();
    const sentParams = { 'mobile_number': searchTerm }; // { 'mobile_phone': searchTerm }
    await listReservations(sentParams, abortController.signal)
      .then(setReservations)
      .catch(setReservationsError);
  };

  return (
    <form>
        <label htmlFor="mobile_number">
            Enter a customer's phone number:
            <input
                id="mobile_number"
                type="text"
                name="mobile_number"
                onChange={handlePhone}
                value={searchTerm}
            />
        </label>
        <button type="submit" disabled={!searchTerm.length}
          onClick={handleSubmit}>Find</button>
        {/* <button onClick={() => history.goBack()}>Cancel</button> */}
        <br/>
        <ErrorAlert error={inputError}/>
        {/* <div className="alert alert-danger" hidden={!inputError.length}>
          {inputError}
        </div> */}
        <br/>
        {(clickedFind) ? (<DashboardReservations arrReservations={reservations}
          reservationsError={reservationsError}
          nonFinished={false}></DashboardReservations>): ""}
    </form>
  );
}

export default PhoneSearch;