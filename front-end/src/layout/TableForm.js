import React, { useState } from "react";
import { useHistory } from "react-router";

function TableForm() {
  const history = useHistory();
  const initialFormState = {
    table_name: "",
    capacity: 1,
    errors: {},
  };
  const [formData, setFormData] = useState({ ...initialFormState });
  
  const handleChange = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      'errors': {}
    });
    
    const {errors, ...submitForm} = formData;    
    for(let key of Object.keys(submitForm)) {
      const val = submitForm[key];
      if(!val && val !== 0) {
        // console.log(`Blank field: ${key}`);
        delete submitForm[key];
      }
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const abortController = new AbortController();
    fetch('http://localhost:5000/tables/new', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(submitForm),
      signal: abortController.signal,
    })
      .then((res) => {
        if(res.status === 500) {
          return res.json()
            .then((json) => {
              const { error } = json;
              let serverError = {};
              serverError['server'] = error; // `SERVER ERROR: ${error['name']} -- ${error['message']}`;
              setFormData({
                ...formData,
                'errors': serverError,
              });
            });
          }
          else return res.json();
        });
    if(Object.keys(formData['errors']).length > 0){ 
      // console.log("POST FETCH formData has errors");
      return;
    }
    history.push(`../../`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="table_name">
        Enter table name:
        <input
          id="table_name"
          type="text"
          name="table_name"
          onChange={handleChange}
          value={formData['table_name']}
        />
      </label>
      <br />
      <label htmlFor="capacity">
        Table capacity (number of person(s)):
        <input
          id="capacity"
          type="number"
          name="capacity"
          min="1"
          onChange={handleChange}
          value={formData['capacity']}
        />
        <div className="alert alert-danger" hidden={!('server' in
          formData['errors'])}>
            {formData['errors']['server']}
        </div>
      </label>
      <br/>
      <button type="submit" disabled={!formData['table_name'].length}>Submit</button>
      {/* <button type="submit">Submit</button> */}
      <button onClick={() => history.goBack()}>Cancel</button>
    </form>
  );
}

export default TableForm;