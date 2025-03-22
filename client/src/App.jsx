import { useState } from 'react';
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

function App() {

  const [authData, setAuthData] = useState({});

   // putLoginActionData is the authentication handler for loggin
  const putLoginActionData = (authData) => {
    setAuthData(authData);
  }

  return (
    <>
    // The Provider helps to inject the data with useContext through all the components in the tree (in the application)
      <UserContext.Provider value={{...authData, putLoginActionData} }>
        <div id="box">
          <Header />

          {/* <!-- Main Content --> */}
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage  />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/games/create" element={<CreatePage />} />
              <Route path="/games" element={<CataloguePage />} />
              <Route path="/games/:gameId/game-edit" element={<GameEdit />} />
              <Route path="/games/:gameId/game-details" element={<DetailsPage />} />
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
