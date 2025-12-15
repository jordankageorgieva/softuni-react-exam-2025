import { lazy, useState } from 'react';
import './index.css'
import './App.css';

import CataloguePage from './components/catalogue-page/CataloguePage';

import CreatePage from './components/create-page/CreatePage';

import EditProject from './components/edit-page/EditProject';
import Header from './components/header/Header';
import Home from './components/home/Home';
import LoginPage from './components/login-page/LoginPage';
import RegisterPage from './components/register-page/RegisterPage';
import { Routes, Route } from 'react-router';
import { UserContext } from './hookContext/userContext';
import LogoutPage from './components/logout-page/LogoutPage';
import AuthGuard from './components/guards/AuthGuard';
import EurUsdPredictionPage from './components/eur-usd-prediction-page/EurUsdPredictionPage';
import CertificatesPage from './components/certificates-page/CertificatesPage';
const DetailsPage = lazy(() => import('./components/details-page/DetailsPage'));

function App() {

  console.log(import.meta.env.VITE_APP_API_URL_DATA); // Logs the server URL from the .env file

  const [authData, setAuthData] = useState({});

  // putLoginActionData is the authentication handler for loggin
  const putLoginActionData = (authData) => {
    console.log("App.jsx - putLoginActionData called with:", authData);
    setAuthData(authData);
  }

  return (
    <>
      <UserContext.Provider value={{ ...authData, putLoginActionData }}>
        <div id="box">
          <Header />

          {/* <!-- Main Content --> */}
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/projects" element={<CataloguePage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/eur-usd-prediction" element={<EurUsdPredictionPage />} />
              <Route path="/projects/:projectId/project-details" element={<DetailsPage />} />

              <Route path="/projects/create" element={
                <AuthGuard isAuthenticated={authData.token}>
                  <CreatePage />
                </AuthGuard>
              }
              />
              <Route path="/projects/:projectId/project-edit" element={
                <AuthGuard isAuthenticated={authData.token}>
                  <EditProject />
                </AuthGuard>
              }
              />

              <Route path="/logout" element={<AuthGuard isAuthenticated={authData.token}>
                <LogoutPage />
              </AuthGuard>
              }
              />
              <Route path="/eur-usd-prediction" element={<AuthGuard isAuthenticated={authData.token}>
                <EurUsdPredictionPage />
              </AuthGuard>
              }
              />
            </Routes>
          </main>
        </div>
      </UserContext.Provider>
    </>
  )
}

export default App
