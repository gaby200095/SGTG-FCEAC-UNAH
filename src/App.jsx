import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Tramites from './pages/Tramites';
import Contacto from './pages/Contacto';
import AcercaSGTG from './pages/AcercaSGTG';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Verify2FA from './pages/auth/Verify2FA';
import PrivateRoute from './components/PrivateRoute';
import DashEstudiante from './pages/dash/DashboardEstudiante';
import DashCoordinador from './pages/dash/DashboardCoordinador';
import DashAdministrativo from './pages/dash/DashboardAdministrativo';
import DashSecretaria from './pages/dash/DashboardSecretaria';
import DashboardExpediente from './pages/dash/DashboardExpediente';
import CentroRecursos from './pages/CentroRecursos';

function App() {
  useEffect(() => {
    fetch('http://localhost:5001/api/prueba-db')
      .then(res => res.json())
      .then(data => console.log('Hora de la BD:', data))
      .catch(err => console.error('Error al conectar con la BD:', err));
  }, []);

  return (
    <Router>
      <Navbar />
      <main>
        <Switch>
          {/* públicas */}
          <Route exact path="/" component={Landing} />
          <Route path="/tramites" component={Tramites} />
          <Route path="/contacto" component={Contacto} />
          <Route path="/acerca" component={AcercaSGTG} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/verify-2fa" component={Verify2FA} />  {/* alias corregido */}
          <Route path="/2fa" component={Verify2FA} />

          {/* privadas por rol */}
          <PrivateRoute path="/panel/estudiante" roles={['estudiante']} component={DashEstudiante} />
          <PrivateRoute path="/panel/coordinador" roles={['coordinador']} component={DashCoordinador} />
          <PrivateRoute path="/panel/administrativo" roles={['administrativo']} component={DashAdministrativo} />
          <PrivateRoute path="/panel/secretaria" roles={['secretaria_general']} component={DashSecretaria} />
          {/* NUEVA RUTA: Expedientes (solo para estudiantes) */}
          <PrivateRoute path="/expedientes" roles={['estudiante']} component={DashboardExpediente} />
          <Route path="/recursos" component={CentroRecursos} />
        </Switch>
      </main>
    </Router>
  );
}

export default App;



