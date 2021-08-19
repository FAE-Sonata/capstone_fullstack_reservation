import React, { useState } from "react";
import { useHistory } from "react-router";

function PhoneSearch() {
  const history = useHistory();

  const [searchTerm, setSearchTerm] = useState("0");
  const [errors, setErrors] = useState({});

  const handlePhone = ({ target }) => {
    setErrors({});
    const phoneError = {};
    const input = target.value;
    const phoneRegex = new RegExp(/^\(?\s*[1-9][0-9]{2}\s*\)?\s*\-?\s*[0-9]{3}\s*\-?\s*[0-9]{4}$/);
    if(phoneRegex.test(input.trim())) {
      setSearchTerm(input);
    }
    else {
      phoneError["mobile"] = "Invalid mobile number format";
      setErrors(phoneError);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const abortController = new AbortController();
  };

  return (
    // <form onSubmit={handleSubmit}>
    <form>
      <label htmlFor="mobile_number">
        Your Mobile number with area code:
        <input
          id="mobile_number"
          type="text"
          name="mobile_number"
          onChange={handlePhone}
          value={searchTerm}
        />
        <div className="alert alert-danger" hidden={!('mobile' in
          errors)}>
          {errors['mobile']}
        </div>
      </label>
      <br/>
      <button type="submit" disabled={!searchTerm.length}
        onClick={handleSubmit}>Submit</button>
      <button onClick={() => {
        debugger;
        history.goBack();
        }}>Cancel</button>
    </form>
  );
}

export default PhoneSearch;