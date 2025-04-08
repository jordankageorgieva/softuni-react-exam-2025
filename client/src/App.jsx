import { lazy, useState } from 'react';
import './index.css'
import './App.css';

import CataloguePage from './components/catalogue-page/CataloguePage';
import CreatePage from './components/create-page/CreatePage';

import GameEdit from './components/edit-page/EditProject';
import Header from './components/header/Header';
import Home from './components/home/Home';
import LoginPage from './components/login-page/LoginPage';
import RegisterPage from './components/register-page/RegisterPage';
import { Routes, Route } from 'react-router';
import { UserContext } from './hookContext/userContext';
import { BrowserRouter as Router } from 'react-router-dom';
import LogoutPage from './components/logout-page/LogoutPage';
import ProtectedRoute from './components/guards/AuthGuard';
import AuthGuard from './components/guards/AuthGuard';
// import DetailsPage from './components/details-page/DetailsPage';
const DetailsPage = lazy(() => import('./components/details-page/DetailsPage'));

function App() {

  console.log(import.meta.env.VITE_APP_API_URL_DATA); // Logs the server URL from the .env file

  const [authData, setAuthData] = useState({});

  // putLoginActionData is the authentication handler for loggin
  const putLoginActionData = (authData) => {
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
              <Route path="/projects/:projectId/project-details" element={<DetailsPage />} />

              <Route path="/projects/create" element={
                <AuthGuard isAuthenticated={authData.token}>
                  <CreatePage />
                </AuthGuard>
              }
              />
              <Route path="/projects/:projectId/project-edit" element={
                <AuthGuard isAuthenticated={authData.token}>
                  <GameEdit />
                </AuthGuard>
              }
              />

              <Route path="/logout" element={<AuthGuard isAuthenticated={authData.token}>
                <LogoutPage />
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
