// import moment from "moment";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { RANGE_TIMES,
  getOpenOn,
  getCloseOn,
  getFirstTopHour } from "../utils/additional-time-functions";
import { postReservation, readReservation, updateReservation } from "../utils/api";
import ErrorAlert from "./ErrorAlert";
let serverError = {};

/**
 * 
 * @param {Number} x 
 * @returns "0X" if "X" is a single digit
 */
function padInt(x) {
  return x.toString().padStart(2, "0");
}

function timeToStr(timeObj) {
  const ymd = [timeObj.getFullYear(),
    timeObj.getMonth()+1,
    timeObj.getDate()].join("-");
  const hm = [timeObj.getHours(), timeObj.getMinutes()].join(":");
  return [ymd, hm].join(" ");
}

function constructDateObj(date, time) {
  const dateSplit = date.split("-");
  const timeSplit = time.split(":");
  return new Date(parseInt(dateSplit[0]), parseInt(dateSplit[1])-1,
    parseInt(dateSplit[2]), parseInt(timeSplit[0]), parseInt(timeSplit[1]));
  // return new Date(`${date}T${time}`);
}

function ReservationForm({isNew = true}) {
  // const { urmUrl } = useRouteMatch();
  const history = useHistory();
  const { reservation_id } = useParams();
  const [clientErrors, setClientErrors] = useState(null);
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
  useEffect(() => {
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
    loadReservation();
  }, [isNew, reservation_id]);

  const setMessage = (message) => {
    setClientErrors({message});
  }
  
  const handleChange = ({ target }) => {
    setClientErrors(null);
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  function isValidTime(currentTime, formTime) {
    console.log(`current time: ${timeToStr(currentTime)}`);
    console.log(`form time: ${timeToStr(formTime)}`);
    if(!formTime || !formTime.getFullYear()) {
      setMessage("Invalid time format.");
      return false;
    }
    if(formTime <= currentTime) {
      setMessage("Invalid time: Reservation start time must be in the future");
      return false;
    }
    const EARLIEST_TIME = getOpenOn(formTime);
    const LATEST_TIME = getCloseOn(formTime);
    if(formTime < EARLIEST_TIME || formTime > LATEST_TIME) {
      setMessage("Invalid time: Reservation start time must be between " +
        RANGE_TIMES[0] + " and " + RANGE_TIMES[1] + ", inclusive.");
      return false;
    }
    if(formTime.getDay() === 2) {
      setMessage("Invalid: Restaurant closed on Tuesdays");
      return false;
    }
    return true;
  }

  // const handleTime = ({ target }) => {
  //   setClientErrors(null);
  //   const field = target.name;
  //   const input = target.value;

  //   const CURRENT_TIME = new Date();
  //   let builtTime = undefined;
  //   switch(field) {
  //     case "reservation_date":
  //       if(!input /*|| input.charAt(0) === "0"*/) {
  //         console.log("INPUT WAS: ", input);
  //         setMessage("Invalid date format, and/or year cannot lead with 0");
  //         return;
  //       }
  //       builtTime = constructDateObj(input, formData['reservation_time']);
  //       // builtTime = new Date([input, formData['reservation_time']].join(" "));
  //       break;
  //     case "reservation_time":
  //       builtTime = constructDateObj(formData['reservation_date'], input);
  //       // builtTime = new Date([formData['reservation_date'], input].join(" "));
  //       break;
  //     default:
  //       setMessage("Invalid time field");
  //       return;
  //   }
  //   if(!isValidTime(CURRENT_TIME, builtTime)) return;
    
  //   setFormData({
  //     ...formData,
  //     [field]: input,
  //   })
  // };

  const handlePhone = ({ target }) => {
    setClientErrors(null);
    const input = target.value;
    const phoneRegex = new RegExp(/^\(?\s*[1-9][0-9]{2}\s*\)?\s*-?\s*[0-9]{3}\s*-?\s*[0-9]{4}$/);
    if(phoneRegex.test(input.trim())) {
      setFormData({
        ...formData,
        'mobile_number': input,
      });
    }
    else setMessage("Invalid mobile number format");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    serverError = {};
    if(!(formData['reservation_date'] && formData['reservation_time'])) {
      setMessage("One or both of 'reservation_date' and 'reservation_time' missing.");
      return;
    }
    if(formData['people'] < 1 || formData['people'] % 1) {
      setMessage("People field must be a strictly positive integer.");
      return;
    }
    const CURRENT_TIME = new Date();
    if(!isValidTime(CURRENT_TIME, constructDateObj(formData['reservation_date'],
      formData['reservation_time'])))
      return;

    let mid = formData;
    const ymd = formData['reservation_date'];
    // delete submitForm['errors'];
    const teleRe = new RegExp(/[-()\s]/g);
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
      await postReservation(submitForm, // sets status=='booked' within controller create() method
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
      </label>
      <br/>
      <label htmlFor="reservation_date">
        Date form:
        <input
          id="reservation_date"
          type="date"
          name="reservation_date"
          required
          onChange={handleChange}
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
          onChange={handleChange}
          value={formData['reservation_time']}
        />
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
      </label>
      <br/>
      <ErrorAlert error={clientErrors || reservationErrors}/>
      <button type="submit" disabled={!(formData['first_name'].length &&
        formData['last_name'].length && formData['people']) || clientErrors}
        onClick={handleSubmit}>Submit</button>
      <button onClick={(event) => {
        event.preventDefault();
        history.goBack(2);
        }}>Cancel</button>
    </form>
  );
}

export default ReservationForm;