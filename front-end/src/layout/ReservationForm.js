// import moment from "moment";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { today, next } from "../utils/date-time";
// function isLeap(yr) {
//   return 28 + ((yr % 400 === 0 || ((yr % 100) && (yr % 4 === 0))));
// }

function ReservationForm() {
  const history = useHistory();
  const DATE_OBJ = new Date();
  let DEFAULT_DATE = today();
  if(DATE_OBJ.getDay() === 2) DEFAULT_DATE = next(today());
  const NUM_DIGITS_YR = DEFAULT_DATE.indexOf("-");
  const DEFAULT_YEAR = parseInt(DEFAULT_DATE.substr(0, NUM_DIGITS_YR));
  const DEFAULT_MONTH = parseInt(DEFAULT_DATE.substr(NUM_DIGITS_YR+1, 2));
  const DEFAULT_DAY = parseInt(DEFAULT_DATE.substr(NUM_DIGITS_YR+4, 2));
  // const MAX_DATES = [31, undefined, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const initialFormState = {
    first_name: "", last_name: "",
    mobile_number: "(123) 456-7289", // validate
    // reservation_date: today(),
    hour: "12",
    minute: "00",
    people: 1,
    errors: {},
  };
  const initialDateFields = {
    year: DEFAULT_YEAR,
    month: DEFAULT_MONTH,
    day: DEFAULT_DAY,
  }
  const [formData, setFormData] = useState({ ...initialFormState });
  const [dateFields, setDateFields] = useState({...initialDateFields});
  const handleChange = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  // TODO: CHANGE TO VALIDATION OF SUBMISSION
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
    // const CURRENT_YEAR = CURRENT_DATE_OBJ.getFullYear();
    // const CURRENT_MONTH = CURRENT_DATE_OBJ.getMonth() + 1;
    // const CURRENT_DAY = CURRENT_DATE_OBJ.getDate();
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
    console.log("Submitted:", formData);
    setFormData({ ...initialFormState });
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
          onChange={handleChange}
          value={formData['hour']}
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
          onChange={handleChange}
          value={formData['minute']}
        />
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
      <button type="submit">Submit</button>
      <button onClick={() => history.goBack()}>Cancel</button>
    </form>
  );
}

export default ReservationForm;