import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage.jsx';
import AuthPage from './components/AuthPage/AuthPage.jsx';
import PersonalAccount from './components/PersonalAccount/PersonalAccount.jsx';
import ProfileSetupPage from './components/ProfileSetupPage/ProfileSetupPage.jsx';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/AuthPage" replace />} />
        <Route path="/AuthPage" element={<AuthPage />} />
        <Route path="/ProfileSetup" element={<ProfileSetupPage />} />
        <Route path="/MainPage" element={<MainPage />} />
        <Route path="/PersonalAccount" element={<PersonalAccount />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
