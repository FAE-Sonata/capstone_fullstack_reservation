// import moment from "moment";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { RANGE_TIMES,
  getOpenOn,
  getCloseOn,
  getFirstTopHour } from "../utils/additional-time-functions";
import { postReservation, readReservation, updateReservation,
  updateStatus } from "../utils/api";
let serverError = {};

/**
 * 
 * @param {Number} x 
 * @returns "0X" if "X" is a single digit
 */
function padInt(x) {
  return x.toString().padStart(2, "0");
}

function ReservationForm({isNew = true}) {
  // const { urmUrl } = useRouteMatch();
  const history = useHistory();
  const { reservation_id } = useParams();
  const [clientErrors, setClientErrors] = useState({});
  const [reservationErrors, setReservationErrors] = useState(null);
  let DEFAULT_FORM_TIME = getFirstTopHour();

  const initialFormState = {
    first_name: "", last_name: "",
    mobile_number: "(123) 456-7890",
    people: 1,
    reservation_date: [DEFAULT_FORM_TIME.getFullYear(),
      padInt(DEFAULT_FORM_TIME.getMonth()+1),
      padInt(DEFAULT_FORM_TIME.getDate())].join("-"),
    reservation_time: [padInt(DEFAULT_FORM_TIME.getHours()),
      padInt(DEFAULT_FORM_TIME.getMinutes())].join(":")
  };
  const [formData, setFormData] = useState({ ...initialFormState });

  async function loadReservation() {
    if(!isNew && (reservation_id || reservation_id === 0)) {
      const TIME_AT_LOAD = new Date();
      const abortController = new AbortController();
      const updateFields = (reservation) => {
        let populatedForm = {
          first_name: reservation['first_name'],
          last_name: reservation['last_name'],
          mobile_number: reservation['mobile_number'],
          people: reservation['people'],
        };
        const existingTime = new Date(
          `${reservation['reservation_date']} ` +
          `${reservation['reservation_time']}`);
        if(existingTime > TIME_AT_LOAD) {
          // const {reservation_date, reservation_time, ...other} = formData;
          populatedForm['reservation_date'] = reservation['reservation_date'];
          populatedForm['reservation_time'] = reservation['reservation_time'];
          setFormData({...populatedForm});
          // setDateFields({
          //   year: existingTime.getFullYear(),
          //   month: existingTime.getMonth() + 1,
          //   day: existingTime.getDate(),
          // });
          // setTimeFields({
          //   hour: existingTime.getHours(),
          //   minute: existingTime.getMinutes(),
          // });
        }
        else {
          populatedForm['reservation_date'] = formData['reservation_date'];
          populatedForm['reservation_time'] = formData['reservation_time'];
          setFormData({...populatedForm});
        }
      }
      try {
        const reservationResponse = await readReservation(reservation_id,
          abortController.signal);
        if(Object.keys(reservationResponse).length > 0)
          updateFields(reservationResponse);
      }
      catch(error) {
        setReservationErrors(error);
      }
      return () => abortController.abort();
    }
    return undefined;
  }

  useEffect(loadReservation, [isNew, reservation_id]);

  const setTimeErrors = (type, message) => {
    let timeErrors = {[type]: message};
    setClientErrors(timeErrors);
  }
  const handleChange = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  function isValidTime(currentTime, formTime) {
    if(!formTime) {
      setTimeErrors('time',
        "Invalid time format.");
      return false;
    }
    if(formTime <= currentTime) {
      setTimeErrors('time',
        "Invalid time: Reservation start time must be in the future");
      return false;
    }
    const EARLIEST_TIME = getOpenOn(formTime);
    const LATEST_TIME = getCloseOn(formTime);
    if(formTime < EARLIEST_TIME || formTime > LATEST_TIME) {
      setTimeErrors('time',
        "Invalid time: Reservation start time must be between " +
        RANGE_TIMES[0] + " and " + RANGE_TIMES[1] + ", inclusive.");
      return false;
    }
    if(formTime.getDay() === 2) {
      setTimeErrors('Tuesday', "Invalid: Restaurant closed on Tuesdays");
      return false;
    }
    return true;
  }

  const handleTime = ({ target }) => {
    setClientErrors({});
    const field = target.name;
    const input = target.value;

    const CURRENT_TIME = new Date();
    let builtTime = undefined; let inputSplit = undefined;
    // debugger;
    switch(field) {
      case "reservation_date":
        if(!input || toString(input).charAt(0) === "0") {
          setTimeErrors('time', "Year cannot lead with 0");
          return;
        }
        inputSplit = input.split("-");
        const timeSplit = toString(formData['reservation_time']).split(":");
        builtTime = new Date(parseInt(inputSplit[0]),
          parseInt(inputSplit[1])-1,
          parseInt(inputSplit[2]),
          parseInt(timeSplit[0]),
          parseInt(timeSplit[1]));
        // builtTime = new Date([input, formData['reservation_time']].join(" "));
        break;
      case "reservation_time":
        // debugger;
        const dateSplit = toString(formData['reservation_date']).split("-");
        inputSplit = input.split(":");
        builtTime = new Date(parseInt(dateSplit[0]),
          parseInt(dateSplit[1])-1,
          parseInt(dateSplit[2]),
          parseInt(inputSplit[0]),
          parseInt(inputSplit[1]));
        // builtTime = new Date([formData['reservation_date'], input].join(" "));
        break;
      default:
        setTimeErrors('invalid_field', "Invalid field");
        return;
    }
    if(!isValidTime(CURRENT_TIME, builtTime)) return;
    
    setFormData({
      ...formData,
      [field]: input,
    })
  };

  const handlePhone = ({ target }) => {
    setClientErrors({});
    const phoneError = {};
    const input = target.value;
    const phoneRegex = new RegExp(/^\(?\s*[1-9][0-9]{2}\s*\)?\s*\-?\s*[0-9]{3}\s*\-?\s*[0-9]{4}$/);
    if(phoneRegex.test(input.trim())) {
      setFormData({
        ...formData,
        'mobile_number': input,
      });
    }
    else {
      phoneError["mobile"] = "Invalid mobile number format";
      setClientErrors(phoneError);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    serverError = {};
    setClientErrors({});
    if(!(formData['reservation_date'] && formData['reservation_time'])) {
      setClientErrors({'missing': "One or both of 'reservation_date' and 'reservation_time' missing."});
      return;
    }
    if(formData['people'] < 1 || formData['people'] % 1) {
      setClientErrors({'people': "People field must be a strictly positive integer."});
      return;
    }

    let mid = formData;
    const ymd = formData['reservation_date'];
    // const hms = [formData['reservation_time'], "00"].join(":");
    // delete submitForm['errors'];
    const teleRe = new RegExp(/[\-()\s]/g);
    const rawTele = mid['mobile_number'].replaceAll(teleRe, "");
    // using mid so formData is NOT modified in-place for these 2 fields
    mid['mobile_number'] = [rawTele.substr(0,3),
      rawTele.substr(3,3),
      rawTele.substr(6,4)].join("-");
    // mid['reservation_time'] = hms;
    let submitForm = mid;
    submitForm['people'] = parseInt(mid['people']);

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const abortController = new AbortController();
    if(isNew) {
      const statusObj = { data: { status: "booked" } };
      const createdRecord = await postReservation(submitForm,
        abortController.signal)
        .then((res) => {
          if(res.status === 500) {
            res.json()
              .then((json) => {
                // console.log("SUBMIT status 500 THEN");
                const { error } = json;
                // console.log("RESULTANT JSON: ", json);
                // serverError = {'server': error};
                setReservationErrors({'server': error});
                // console.log("SET serverError: ", serverError);
              });
            return;
          }
          else {
            return res.json();
          }
        });
      if(createdRecord){
        const createdId = createdRecord['data']['reservation_id'];
        await updateStatus(createdId, statusObj, abortController.signal)
          .then((res) => res.json())
          .catch(setReservationErrors);
      }
    }
    else {
      submitForm['reservation_id'] = parseInt(reservation_id);
      const dataObj = { data: submitForm };
      await updateReservation(reservation_id, dataObj, abortController.signal)
        .then((res) => {
          if(res.status === 500) {
            res.json()
              .then((json) => {
                const { error } = json;
                setReservationErrors({'server': error});
              });
            return;
          }
          else return res.json();
        });
    }
    // console.log("FORM DATA PRE-EXIT OF SE: ", serverError);
    if(serverError.error){
      console.log("POST FETCH has server errors");
      return;
    }
    else history.push(`../../dashboard?date=${ymd}`);
  };

  return (
    // <form onSubmit={handleSubmit}>
    <form>
      <label htmlFor="first_name">
        Enter Your First Name:
        <input
          id="first_name"
          type="text"
          name="first_name"
          onChange={handleChange}
          value={formData['first_name']}
        />
      </label>
      <label htmlFor="last_name">
        Your Last Name:
        <input
          id="last_name"
          type="text"
          name="last_name"
          onChange={handleChange}
          value={formData['last_name']}
        />
      </label>
      <br />
      <label htmlFor="mobile_number">
        Your Mobile number with area code:
        <input
          id="mobile_number"
          type="text"
          name="mobile_number"
          onChange={handlePhone}
          value={formData['mobile_number']}
        />
        <div className="alert alert-danger" hidden={!('mobile' in
          clientErrors)}>
          {clientErrors['mobile']}
        </div>
      </label>
      <br/>
      <label htmlFor="reservation_date">
        Date form:
        <input
          id="reservation_date"
          type="date"
          name="reservation_date"
          required
          onChange={handleTime}
          value={formData['reservation_date']}
        />
      </label>
      <br/>
      <label htmlFor="reservation_time">
        Time form:
        <input
          id="reservation_time"
          type="time"
          name="reservation_time"
          required
          onChange={handleTime}
          value={formData['reservation_time']}
        />
        <div className="alert alert-danger"
          hidden={!('time' in clientErrors || 'Tuesday' in clientErrors)}>
            {clientErrors['time'] || clientErrors['Tuesday']}
        </div>
      </label>
      <br/>
      <label htmlFor="people">
        Number of people in reservation:
        <input
          id="people"
          type="number"
          name="people"
          min="1"
          onChange={handleChange}
          value={formData['people']}
        />
        <div className="alert alert-danger" hidden={!clientErrors['missing']}>
            {clientErrors['missing']}
        </div>
        <div className="alert alert-danger" hidden={!clientErrors['people']}>
            {clientErrors['people']}
        </div>
      </label>
      <br/>
      <button type="submit" disabled={!(formData['first_name'].length &&
        formData['last_name'].length && formData['people'])}
        onClick={handleSubmit}>Submit</button>
      <button onClick={(event) => {
        event.preventDefault();
        history.goBack(2);
        }}>Cancel</button>
    </form>
  );
}

export default ReservationForm;