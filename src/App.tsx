import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/miranda" element={<MirandaPage />} />
            </Route>
            <Route path="/ranking/tv" element={<ProtectedRoute><RankingTV /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
