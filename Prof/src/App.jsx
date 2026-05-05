import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage.jsx';
import PersonalAccount from './components/PersonalAccount/PersonalAccount.jsx';
import UsersPage from './components/UsersPage/UsersPage.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/MainPage" replace />} />
        <Route path="/MainPage" element={<MainPage />} />
        <Route path="/PersonalAccount" element={<PersonalAccount />} />
        <Route path="/Users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/MainPage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
