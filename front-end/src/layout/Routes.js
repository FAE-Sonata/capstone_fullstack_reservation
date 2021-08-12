import React from "react";

import { Redirect, Route, Switch } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import NotFound from "./NotFound";
import { today } from "../utils/date-time";
import useQuery from "../utils/useQuery";
import ReservationForm from "./ReservationForm";

/**
 * Defines all the routes for the application.
 *
 * You will need to make changes to this file.
 *
 * @returns {JSX.Element}
 */
function Routes() {
  // with permission from mentor Marius Banea: https://github.com/itsdotnickscott/periodic-tables/blob/main/front-end/src/layout/Routes.js
  const query = useQuery();
  const queryDate = query.get("date");
  const suppliedDate = (queryDate) ? queryDate : (today());
  return (
    <Switch>
      <Route exact={true} path="/reservations/new">
        <ReservationForm/>
      </Route>
      {/* DASHBOARD BY DATE */}
      <Route exact={true} path="/">
        <Redirect to={"/dashboard"} />
      </Route>
      <Route exact={true} path="/reservations">
        <Redirect to={"/dashboard"} />
      </Route>
      <Route path="/dashboard">
        <Dashboard date={suppliedDate} />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default Routes;
