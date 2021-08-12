// import moment from "moment";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { today, next } from "../utils/date-time";
// function isLeap(yr) {
//   return 28 + ((yr % 400 === 0 || ((yr % 100) && (yr % 4 === 0))));
// }

function ReservationForm() {
  // const { url } = useRouteMatch();
  const history = useHistory();
  const DATE_OBJ = new Date();
  let DEFAULT_DATE = today();
  if(DATE_OBJ.getDay() === 2) DEFAULT_DATE = next(today());
  const NUM_DIGITS_YR = DEFAULT_DATE.indexOf("-");
  const DEFAULT_YEAR = parseInt(DEFAULT_DATE.substr(0, NUM_DIGITS_YR));
  const DEFAULT_MONTH = parseInt(DEFAULT_DATE.substr(NUM_DIGITS_YR+1, 2));
  const DEFAULT_DAY = parseInt(DEFAULT_DATE.substr(NUM_DIGITS_YR+4, 2));
  const RANGE_TIMES = ["10:30", "21:30"];
  // const MAX_DATES = [31, undefined, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const initialFormState = {
    first_name: "", last_name: "",
    mobile_number: "(123) 456-7289", // validate
    // reservation_date: today(),
    // hour: "12",
    // minute: "00",
    people: 1,
    errors: {},
  };
  const initialDateFields = {
    year: DEFAULT_YEAR,
    month: DEFAULT_MONTH,
    day: DEFAULT_DAY,
  }
  const initialTimeFields = {
    hour: "12",
    minute: "00",
  }
  const [formData, setFormData] = useState({ ...initialFormState });
  const [dateFields, setDateFields] = useState({...initialDateFields});
  const [timeFields, setTimeFields] = useState({...initialTimeFields});

  const setTimeErrors = (type, message) => {
    let timeErrors = {};
    timeErrors[type] = message;
    setFormData({
      ...formData,
      'errors': timeErrors
    });
  }
  const handleChange = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  function isValidTime(currentDate, timeObj) {
    console.log("VALIDATING TIME: ", currentDate);
    const CURRENT_YEAR = currentDate.getFullYear();
    const CURRENT_MONTH = currentDate.getMonth();
    const CURRENT_DAY = currentDate.getDate();

    if(timeObj <= currentDate) {
      setTimeErrors('time',
        "Invalid time: Reservation start time must be in the future");
      return false;
    }
    const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
    const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
    const EARLIEST_TIME = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY,
      EARLIEST_SPLIT[0], EARLIEST_SPLIT[1]);
    const LATEST_TIME = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY,
      LATEST_SPLIT[0], LATEST_SPLIT[1]);
    if(timeObj < EARLIEST_TIME || timeObj > LATEST_TIME) {
      setTimeErrors('time',
        `Invalid time: Reservation start time must be between ${RANGE_TIMES[0]} and ${RANGE_TIMES[1]}, inclusive.`);
      return false;
    }
    return true;
  }

  const handleDate = ({ target }) => {
    // moment()
    setFormData({
      ...formData,
      'errors': {}
    });
    const dateErrors = {};
    const field = target.name;
    const input = parseInt(target.value);
    // const intInput = parseInt(input);
    const CURRENT_TIME = new Date();
    const CURRENT_DATE_OBJ = new Date(CURRENT_TIME.getFullYear(),
      CURRENT_TIME.getMonth(),
      CURRENT_TIME.getDate());
    
    const setDateErrors = (type, message) => {
      dateErrors[type] = message;
      setFormData({
        ...formData,
        'errors': dateErrors
      });
    }
    let builtDateObj = undefined;
    const yearForm = dateFields['year'];
    const monthForm = parseInt(dateFields['month']);
    const dayForm = parseInt(dateFields['day']);
    switch(field) {
      case "year":
        builtDateObj = new Date(input, monthForm-1, dayForm);
        break;
      case "month":
        builtDateObj = new Date(yearForm, input-1, dayForm);
        break;
      case "day":
        builtDateObj = new Date(yearForm, monthForm-1, input);
        break;
      default:
        setDateErrors('invalid_field', "Invalid field");
        return;
    }
    /* check invalid date, e.g. "30 February" or "29 February 2011" */
    if((field === "day" && builtDateObj.getMonth()+1 !== monthForm) || (
      field === "month" && builtDateObj.getDate() !== dayForm) || (
        field === "year" && builtDateObj.getDate() !== dayForm)) {
          setDateErrors('date',
            "Invalid date: Month does not have that many days");
          return;
        }
    if(builtDateObj < CURRENT_DATE_OBJ) {
      console.log(`ATTEMPTED DATE set: ${builtDateObj}`);
      setDateErrors('date',
        "Invalid date: Reservation must be on or after today");
      return;
    }
    if(builtDateObj.getDay() === 2) {
      setDateErrors('Tuesday', "Invalid: Restaurant closed on Tuesdays");
      return;
    }
    setDateFields({
      ...dateFields,
      [field]: target.value,
    });
  };

  const handleTime = ({ target }) => {
    setFormData({
      ...formData,
      'errors': {}
    });
    // const timeErrors = {};
    const field = target.name;
    const input = parseInt(target.value);

    const CURRENT_TIME = new Date();
    const CURRENT_YEAR = CURRENT_TIME.getFullYear();
    const CURRENT_MONTH = CURRENT_TIME.getMonth();
    const CURRENT_DAY = CURRENT_TIME.getDate();
    
    let builtTime = undefined;
    const hourForm = parseInt(timeFields['hour']);
    const minuteForm = parseInt(timeFields['minute']);
    switch(field) {
      case "hour":
        builtTime = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY,
          input, minuteForm);
        break;
      case "minute":
        builtTime = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY,
          hourForm, input);
        break;
      default:
        setTimeErrors('invalid_field', "Invalid field");
        return;
    }
    if(!isValidTime(CURRENT_TIME, builtTime)) return;
    
    setTimeFields({
      ...timeFields,
      [field]: target.value,
    });
  };

  const handlePhone = ({ target }) => {
    setFormData({
      ...formData,
      'errors': {}
    })
    const errors = {};
    const input = target.value;
    const phoneRegex = new RegExp(/\(?\s*[1-9][0-9]{2}\s*\)?\s*\-?\s*[0-9]{3}\s*\-?\s*[0-9]{4}/);
    if(phoneRegex.test(input)) {
      setFormData({
        ...formData,
        'mobile_number': input,
      });
    }
    else {
      errors["mobile"] = "Invalid mobile number format";
      setFormData({
        ...formData,
        'errors': errors
      })
    }
  };

  // TODO: prevent submission of invalid time
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("ENTERING SUBMIT, PRE-VALIDATION");
    /* check time at beginning since default time of form is 12:00, and
    check during onChange={} will not be done
    */
    const CURRENT_TIME = new Date();
    const FORM_TIME = new Date(parseInt(dateFields['year']),
      parseInt(dateFields['month'])-1,
      parseInt(dateFields['day']),
      parseInt(timeFields['hour'],
      parseInt(timeFields['minute'])));
    console.log("VALIDATING SUBMISSION TIME, CURRENT =", CURRENT_TIME.getFullYear());
    if(!isValidTime(CURRENT_TIME, FORM_TIME)) {
      return;
    }

    const {errors, ...mid} = formData;
    // console.log(`TYPEOF month and day: ${typeof(dateFields['month'])}; ${typeof(dateFields['day'])}`);
    const strMonth = String(dateFields['month']);
    const strDay = String(dateFields['day']);
    const ymd = [`${dateFields['year']}`,
      `${strMonth.padStart(2, "0")}`,
      `${strDay.padStart(2, "0")}`].join("-");
    const hms = [`${timeFields['hour'].padStart(2, "0")}`,
      `${timeFields['minute'].padStart(2, "0")}`, "00"].join(":");
    // delete submitForm['errors'];
    const teleRe = new RegExp(/[\-()\s]/g);
    const rawTele = mid['mobile_number'].replaceAll(teleRe, "");
    mid['mobile_number'] = [rawTele.substr(0,3),
      rawTele.substr(3,3),
      rawTele.substr(6,4)].join("-");
    mid['reservation_date'] = ymd;
    mid['reservation_time'] = hms;
    const {hour, minute, ...submitForm} = mid;
    // console.log("Submitted:", submitForm);
    // setFormData({ ...initialFormState });

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    console.log("SUBMIT: PRE-FETCH");
    const abortController = new AbortController();
    try {
      fetch('http://localhost:5000/reservations/new', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(submitForm),
        signal: abortController.signal,
      })//.then((res) => res.json());
    }
    catch(error) {
      // console.log(`${error['name']}; ${error['message']}`);
      // if (error['name'] === "AbortError") console.log("Aborted");
      // else throw error;
      console.log("ERROR: " + error);
    }
      // .catch((err) => console.log(`ERROR: ${err}`));
    history.push("../../");
  };

  return (
    <form onSubmit={handleSubmit}>
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
          formData['errors'])}>
          {formData['errors']['mobile']}
        </div>
      </label>
      <br/>
      {/* ONLY allow reservations thru the end of the next calendar year */}
      <label htmlFor="year">
          Reservation date (year):
          <select
              id="year"
              name="year"
              onChange={handleDate}
              value={dateFields['year']}
          >
          <option value={DEFAULT_YEAR}>{DEFAULT_YEAR}</option>
          <option value={DEFAULT_YEAR+1}>{DEFAULT_YEAR+1}</option>
          </select>
      </label>
      <br />
      <label htmlFor="month">
        Reservation date (month):
        <input
          id="month"
          type="number"
          name="month"
          min="1"
          max="12"
          onChange={handleDate}
          value={dateFields['month']}
        />
      </label>
      <br />
      <label htmlFor="day">
        Reservation date (day):
        <input
          id="day"
          type="number"
          name="day"
          min="1"
          max="31"
          onChange={handleDate}
          value={dateFields['day']}
        />
        <div className="alert alert-danger" hidden={!('date' in
          formData['errors'])}>
            {formData['errors']['date']}
        </div>
        <div className="alert alert-danger" hidden={!('Tuesday' in
          formData['errors'])}>
            {formData['errors']['Tuesday']}
        </div>
      </label>
      <br />
      <label htmlFor="hour">
        Reservation time (hour):
        <input
          id="hour"
          type="number"
          name="hour"
          min="10"
          max="21"
          onChange={handleTime}
          value={timeFields['hour']}
        />
      </label>
      <br />
      <label htmlFor="minute">
        Reservation time (minute):
        <input
          id="minute"
          type="number"
          name="minute"
          min="0"
          max="59"
          onChange={handleTime}
          value={timeFields['minute']}
        />
        <div className="alert alert-danger" hidden={!('time' in
          formData['errors'])}>
            {formData['errors']['time']}
        </div>
      </label>
      <br />
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
      <button type="submit" disabled={!(formData['first_name'].length &&
        formData['last_name'].length)}>Submit</button>
      <button onClick={() => history.goBack()}>Cancel</button>
    </form>
  );
}

export default ReservationForm;