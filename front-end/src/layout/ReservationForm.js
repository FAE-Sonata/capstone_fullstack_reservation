// import moment from "moment";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { today, next } from "../utils/date-time";
const RANGE_TIMES = ["10:30", "21:30"];

/**
 * 
 * @param {Number} x 
 * @returns "0X" if "X" is a single digit
 */
function padInt(x) {
  return x.toString().padStart(2, "0");
}

/**
 * 
 * @returns hour (in 24-hour format) of restaurant's opening time
 */
function earliestHour() {
  const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
  return EARLIEST_SPLIT[0];
}

/**
 * 
 * @returns hour (in 24-hour format) of restaurant's closing time
 */
function latestHour() {
  const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
  return LATEST_SPLIT[0];
}

/**
 * 
 * @param {Date} someDate 
 * @returns restaurant's opening time on the specified date
 */
function getOpenOn(someDate) {
  const year = someDate.getFullYear();
  const month = someDate.getMonth();
  const day = someDate.getDate();
  const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
  const EARLIEST_TIME = new Date(year, month, day,
    EARLIEST_SPLIT[0], EARLIEST_SPLIT[1]);
  return EARLIEST_TIME;
}

/**
 * 
 * @param {Date} someDate 
 * @returns restaurant's closing time (earlier than midnight) on the specified date
 */
 function getCloseOn(someDate) {
  const year = someDate.getFullYear();
  const month = someDate.getMonth();
  const day = someDate.getDate();
  const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
  const LATEST_TIME = new Date(year, month, day,
    LATEST_SPLIT[0], LATEST_SPLIT[1]);
  return LATEST_TIME;
}

/**
 * 
 * @returns default time to initially populate the form; either 
 * 1) the opening time of the next day if A) the current date is a Tuesday 
 * or B) the current time is after the closing time
 * 2) the top of the next full hour in the restaurant's operating window
 * 3) the closing time (not a top of the hour, e.g. 23:00) if in the last
 * truncated hour of the restaurant's operating window
 */
function getFirstTopHour() {
  const CURRENT_TIME = new Date();
  if(CURRENT_TIME.getDay() === 2 || CURRENT_TIME > getCloseOn(CURRENT_TIME))
    return getOpenOn(next(today()));
  else {
    const openToday = getOpenOn(CURRENT_TIME);
    if(CURRENT_TIME < openToday) return openToday;
    const CURRENT_HOUR = CURRENT_TIME.getHours();
    if(CURRENT_HOUR < latestHour()) {
      const topNextHour = new Date(CURRENT_TIME.getFullYear(),
        CURRENT_TIME.getMonth(),
        CURRENT_TIME.getDate(),
        CURRENT_HOUR + 1,
        0);
      return topNextHour;
    }
    return getCloseOn(CURRENT_TIME);
  }
}

function ReservationForm() {
  const history = useHistory();
  let DEFAULT_FORM_TIME = getFirstTopHour();
  const DEFAULT_YEAR = DEFAULT_FORM_TIME.getFullYear();

  const initialFormState = {
    first_name: "", last_name: "",
    mobile_number: "(123) 456-7289", // validate
    // reservation_date: today(),
    people: 1,
    errors: {},
  };
  const initialDateFields = {
    year: DEFAULT_YEAR,
    month: DEFAULT_FORM_TIME.getMonth() + 1,
    day: DEFAULT_FORM_TIME.getDate(),
  }
  const initialTimeFields = {
    hour: padInt(DEFAULT_FORM_TIME.getHours()),
    minute: padInt(DEFAULT_FORM_TIME.getMinutes()),
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

  function isValidTime(currentTime, formTime) {
    if(formTime <= currentTime) {
      setTimeErrors('time',
        "Invalid time: Reservation start time must be in the future");
      return false;
    }
    const EARLIEST_TIME = getOpenOn(formTime);
    const LATEST_TIME = getCloseOn(formTime);
    if(formTime < EARLIEST_TIME || formTime > LATEST_TIME) {
      console.log("TIME RANGE: ", EARLIEST_TIME, "; ", LATEST_TIME);
      console.log("ATTEMPTED TIME: ", formTime);
      setTimeErrors('time',
        "Invalid time: Reservation start time must be between ",
        RANGE_TIMES[0], " and ", RANGE_TIMES[1], ", inclusive.");
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
    const FORM_YEAR = dateFields['year'];  //CURRENT_TIME.getFullYear();
    const FORM_MONTH = parseInt(dateFields['month'])-1; // CURRENT_TIME.getMonth();
    const FORM_DAY = parseInt(dateFields['day']); //CURRENT_TIME.getDate();
    
    let builtTime = undefined;
    const hourForm = parseInt(timeFields['hour']);
    const minuteForm = parseInt(timeFields['minute']);
    switch(field) {
      case "hour":
        builtTime = new Date(FORM_YEAR, FORM_MONTH, FORM_DAY,
          input, minuteForm);
        break;
      case "minute":
        builtTime = new Date(FORM_YEAR, FORM_MONTH, FORM_DAY,
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      'errors': {}
    });
    // /* check time at beginning since default time of form is 12:00, and
    // check during onChange={} will not be done
    // */
    // const CURRENT_TIME = new Date();
    // const FORM_TIME = new Date(parseInt(dateFields['year']),
    //   parseInt(dateFields['month'])-1,
    //   parseInt(dateFields['day']),
    //   parseInt(timeFields['hour'],
    //   parseInt(timeFields['minute'])));
    // if(!isValidTime(CURRENT_TIME, FORM_TIME)) {
    //   return;
    // }

    const {errors, ...mid} = formData;
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
    for(let key of Object.keys(submitForm)) {
      const val = submitForm[key];
      if(!val && val !== 0) {
        console.log(`Blank field: ${key}`);
        delete submitForm[key];
      }
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const abortController = new AbortController();
    // try {
    // console.log("TRY bad FETCH");
    fetch('http://localhost:5000/reservations/new', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(submitForm),
      signal: abortController.signal,
    })
      .then((res) => {
        if(res.status === 500) {
          return res.json()
            .then((json) => {
              console.log("SUBMIT status 500 THEN");
              // console.log("OLD formData errors: ", formData['errors']);
              const { error } = json;
              console.log("RESULTANT JSON: ", json);
              let serverError = {};
              serverError['server'] = error; // `SERVER ERROR: ${error['name']} -- ${error['message']}`;
              console.log("SET serverError: ", serverError);
              setFormData({
                ...formData,
                'errors': serverError,
              });
              console.log("NEW formData errors: ", formData['errors']);
              // console.log("result: ", json);
              // console.log("message: ", message);
              // console.log("stack trace: ", stackTrace);
            });
            // .catch((error) => {
            //   console.log("CAUGHT ERROR");              
              // return;
            // })
          }
          else return res.json();
        });
    // console.log("ERRORS number of keys: ", Object.keys(formData['errors']).length);
    if(Object.keys(formData['errors']).length > 0){ 
      console.log("POST FETCH formData has errors");
      return;
    }
    history.push(`../../dashboard?date=${ymd}`);
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
          min={padInt(earliestHour())}
          max={latestHour()}
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
        <div className="alert alert-danger" hidden={!('server' in
          formData['errors'])}>
            {formData['errors']['server']}
        </div>
      </label>
      <br/>
      <button type="submit" disabled={!(formData['first_name'].length &&
        formData['last_name'].length)}>Submit</button>
      {/* <button type="submit">Submit</button> */}
      <button onClick={() => history.goBack()}>Cancel</button>
    </form>
  );
}

export default ReservationForm;