import { useState } from 'react';
import './index.css'
import './App.css';

import CataloguePage from './components/catalogue-page/CataloguePage';
import CreatePage from './components/create-page/CreatePage';
import DetailsPage from './components/details-page/DetailsPage';
import GameEdit from './components/game-edit/GameEdit';
import Header from './components/header/Header';
import Home from './components/home/Home';
import LoginPage from './components/login-page/LoginPage';
import RegisterPage from './components/register-page/RegisterPage';
import { Routes, Route } from 'react-router';
import { UserContext } from './hookContext/userContext';
import { BrowserRouter as Router } from 'react-router-dom';
import LogoutPage from './components/logout-page/LogoutPage';

function App() {

  console.log(import.meta.env.VITE_APP_API_URL_DATA); // Logs the server URL from the .env file

  const [authData, setAuthData] = useState({});

   // putLoginActionData is the authentication handler for loggin
  const putLoginActionData = (authData) => {
    setAuthData(authData);
  }

  return (
    <>
      <UserContext.Provider value={{...authData, putLoginActionData} }>
        <div id="box">
          <Header />

          {/* <!-- Main Content --> */}
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage  />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/projects/create" element={<CreatePage />} />
              <Route path="/projects" element={<CataloguePage />} />
              <Route path="/projects/:gameId/project-edit" element={<GameEdit />} />
              <Route path="/projects/:gameId/project-details" element={<DetailsPage />} />
              <Route path="/logout" element={<LogoutPage/>} />
            </Routes>
          </main>
          {/* <GameEdit />
          <DetailsPage /> */}
        </div>
      </UserContext.Provider>
    </>
  )
}

export default App
