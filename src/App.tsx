import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { MasterLayout } from "@/components/master/MasterLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Propostas from "./pages/Propostas";
import Clientes from "./pages/Clientes";
import Ranking from "./pages/Ranking";
import Alertas from "./pages/Alertas";
import BaseConhecimento from "./pages/BaseConhecimento";
import Acessos from "./pages/Acessos";
import Desenvolvimento from "./pages/Desenvolvimento";
import Configuracoes from "./pages/Configuracoes";
import Gestao from "./pages/Gestao";
import MirandaPage from "./pages/MirandaPage";
import RankingTV from "./pages/RankingTV";
import NotFound from "./pages/NotFound";
import MasterDashboard from "./pages/master/MasterDashboard";
import MasterCorretoras from "./pages/master/MasterCorretoras";
import MasterUsuarios from "./pages/master/MasterUsuarios";
import MasterPlanos from "./pages/master/MasterPlanos";
import MasterFinanceiro from "./pages/master/MasterFinanceiro";
import UsuariosCorretora from "./pages/UsuariosCorretora";
import Landing from "./pages/Landing";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/propostas" element={<Propostas />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/alertas" element={<Alertas />} />
                <Route path="/base-conhecimento" element={<BaseConhecimento />} />
                <Route path="/acessos" element={<Acessos />} />
                <Route path="/desenvolvimento" element={<Desenvolvimento />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/configuracoes/usuarios" element={<UsuariosCorretora />} />
                <Route path="/gestao" element={<Gestao />} />
                <Route path="/miranda" element={<MirandaPage />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute>
                    <MasterLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/master" element={<MasterDashboard />} />
                <Route path="/master/corretoras" element={<MasterCorretoras />} />
                <Route path="/master/usuarios" element={<MasterUsuarios />} />
                <Route path="/master/planos" element={<MasterPlanos />} />
                <Route path="/master/financeiro" element={<MasterFinanceiro />} />
                <Route path="/master/configuracoes" element={<Configuracoes />} />
              </Route>
              <Route path="/ranking/tv" element={<ProtectedRoute><RankingTV /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
