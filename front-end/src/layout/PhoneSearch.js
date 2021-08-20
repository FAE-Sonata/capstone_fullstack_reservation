import React, { useState } from "react";
import { useHistory } from "react-router";
import DashboardReservations from "../dashboard/DashboardReservations";
import { listReservations } from "../utils/api";

function PhoneSearch() {
  const history = useHistory();

  const [searchTerm, setSearchTerm] = useState("");
  const [clickedFind, setClickedFind] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);
  const [inputError, setInputError] = useState("");

  const handlePhone = ({ target }) => {
    setInputError("");
    const input = target.value.trim();
    const phoneRegex = new RegExp(/^\(?\s*\d{0,3}\s*\)?\s*\-?\s*\d{0,3}\s*\-?\s*\d{0,4}$/);
    if(phoneRegex.test(input)) {
      setSearchTerm(input);
    }
    else {
      setInputError("Invalid mobile number format");
    }
  };

  function handleSubmit(event) {
    event.preventDefault();
    setClickedFind(true);
    setInputError("");
    setReservationsError(null);
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const abortController = new AbortController();
    listReservations({ 'mobile_phone': searchTerm }, abortController.signal)
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
        <button onClick={() => history.goBack()}>Cancel</button>
        <br/>
        <div className="alert alert-danger" hidden={!inputError.length}>
          {inputError}
        </div>
        <br/>
        {(clickedFind) ? (<DashboardReservations arrReservations={reservations}
          reservationsError={reservationsError}
          nonFinished={false}></DashboardReservations>): ""}
    </form>
  );
}

export default PhoneSearch;