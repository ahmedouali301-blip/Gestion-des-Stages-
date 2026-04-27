import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROLES } from './utils/roleHelpers';

import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import MonProfil from './pages/shared/MonProfil';
import ContactPage from './pages/shared/ContactPage';


import AdminDashboard from './pages/admin/AdminDashboard';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';

import ResponsableDashboard from './pages/responsable/ResponsableDashboard';
import GestionStages from './pages/responsable/GestionStages';
import GestionSujets from './pages/responsable/GestionSujets';
import GestionStagiaires from './pages/responsable/GestionStagiaires';
import TableauDeBord from './pages/responsable/TableauDeBord';


import EncadrantDashboard from './pages/encadrant/EncadrantDashboard';
import MesStages from './pages/encadrant/MesStages';
import SprintManager from './pages/encadrant/SprintManager';
import GestionTaches from './pages/encadrant/GestionTaches';
import GestionReunions from './pages/encadrant/GestionReunions';
import GestionEvaluations from './pages/encadrant/GestionEvaluations';

import StagiaireDashboard from './pages/stagiaire/StagiaireDashboard';
import MesSujets from './pages/stagiaire/MesSujets';
import MesSprints from './pages/stagiaire/MesSprints';
import MesTaches from './pages/stagiaire/MesTaches';
import MesReunions from './pages/stagiaire/MesReunions';
import MesEvaluations from './pages/stagiaire/MesEvaluations';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── Admin ── */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="utilisateurs" element={<GestionUtilisateurs />} />
                    <Route path="profil" element={<MonProfil />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* ── Responsable ── */}
              <Route path="/responsable/*" element={
                <ProtectedRoute allowedRoles={[ROLES.RESPONSABLE]}>
                  <Routes>
                    <Route path="dashboard" element={<ResponsableDashboard />} />
                    <Route path="stages" element={<GestionStages />} />
                    <Route path="sujets" element={<GestionSujets />} />
                    <Route path="stagiaires" element={<GestionStagiaires />} />
                    <Route path="analytique" element={<TableauDeBord />} />

                    <Route path="profil" element={<MonProfil />} />
                    <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* ── Encadrant ── */}
              <Route path="/encadrant/*" element={
                <ProtectedRoute allowedRoles={[ROLES.ENCADRANT]}>
                  <Routes>
                    <Route path="dashboard" element={<EncadrantDashboard />} />
                    <Route path="stages" element={<MesStages />} />
                    <Route path="sujets" element={<GestionSujets />} />
                    <Route path="sprints/:stageId" element={<SprintManager />} />
                    <Route path="taches/:stageId" element={<GestionTaches />} />
                    <Route path="reunions" element={<GestionReunions />} />
                    <Route path="evaluations" element={<GestionEvaluations />} />
                    <Route path="profil" element={<MonProfil />} />
                    <Route path="*" element={<Navigate to="/encadrant/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              {/* ── Stagiaire ── */}
              <Route path="/stagiaire/*" element={
                <ProtectedRoute allowedRoles={[ROLES.STAGIAIRE]}>
                  <Routes>
                    <Route path="dashboard" element={<StagiaireDashboard />} />
                    <Route path="sujets" element={<MesSujets />} />
                    <Route path="sprints" element={<MesSprints />} />
                    <Route path="taches" element={<MesTaches />} />
                    <Route path="reunions" element={<MesReunions />} />
                    <Route path="evaluations" element={<MesEvaluations />} />
                    <Route path="profil" element={<MonProfil />} />
                    <Route path="*" element={<Navigate to="/stagiaire/dashboard" replace />} />
                  </Routes>
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;