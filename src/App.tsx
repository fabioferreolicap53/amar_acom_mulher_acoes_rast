import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Settings from './pages/Settings';
import Placeholder from './pages/Placeholder';
import ForgotPassword from './pages/ForgotPassword';
import ConfirmVerification from './pages/ConfirmVerification';
import VerificationGateway from './pages/VerificationGateway';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/confirm-verification" element={<ConfirmVerification />} />
        <Route path="/gateway/verify" element={<VerificationGateway />} />
        
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/pacientes" element={
          <Layout>
            <Patients />
          </Layout>
        } />
        

        
        <Route path="/relatorios" element={
          <Layout>
            <Placeholder title="Relatórios e Análises" />
          </Layout>
        } />
        
        <Route path="/configuracoes" element={
          <Layout>
            <Settings />
          </Layout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
