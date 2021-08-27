import React, { useState } from "react";
import { useHistory } from "react-router";
import { postTable } from "../utils/api";
import ErrorAlert from "./ErrorAlert";

function TableForm() {
  const history = useHistory();
  const initialFormState = {
    table_name: "",
    capacity: "",
  };
  const [formErrors, setFormErrors] = useState(null);
  const [tableErrors, setTableErrors] = useState({});
  const [formData, setFormData] = useState({ ...initialFormState });
  
  const handleChange = ({ target }) => {
    setFormData({
      ...formData,
      [target.name]: target.value,
    });
  };

  const setMessage = (message) => {
    setFormErrors({message});
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setTableErrors({});
    if(formData['table_name'].length < 2) {
      setMessage("'table_name' must be at least 2 characters.")
      return;
    }
    if(!parseInt(formData['capacity'])) {
      setMessage("'capacity' must be a strictly positive integer.");
      return;
    }
    let submitForm = {
      table_name: formData['table_name'],
      capacity: parseInt(formData['capacity']),
    };

    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const abortController = new AbortController();
    await postTable(submitForm, abortController.signal)
      .then((res) => {
        if(res.status === 500) {
          return res.json()
            .then((json) => {
              const { error } = json;
              setTableErrors({'server': error});
            });
          }
          else return res.json();
        });
    if(Object.keys(tableErrors).length > 0){ 
      // console.log("POST FETCH formData has errors");
      return;
    }
    history.push(`../../`);
  };

  return (
    <form>
      <label htmlFor="table_name">
        Enter table name:
        <input
          id="table_name"
          type="text"
          name="table_name"
          onChange={handleChange}
          value={formData['table_name']}
          required
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
          required
        />
        {/* <div className="alert alert-danger" hidden={!Object.keys(tableErrors).length}>
            {tableErrors}
        </div> */}
      </label>
      <br/>
      <ErrorAlert error={formErrors}/>
      {/* <button type="submit" disabled={!formData['table_name'].length() ||
        !parseInt(formData['capacity'])}>Submit</button> */}
      <button type="submit" onClick={handleSubmit}>Submit</button>
      <button onClick={() => history.goBack()}>Cancel</button>
    </form>
  );
}

export default TableForm;