import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const PrivateRoute = ({ component: Component, roles = [], ...rest }) => {
  const { user } = useAuth();
  const allowed = user && (roles.length === 0 || user.roles?.some(r => roles.includes(r)));

  return (
    <Route
      {...rest}
      render={props =>
        allowed ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default PrivateRoute;
