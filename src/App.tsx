import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Propostas from "./pages/Propostas";
import Clientes from "./pages/Clientes";
import Ranking from "./pages/Ranking";
import Alertas from "./pages/Alertas";
import BaseConhecimento from "./pages/BaseConhecimento";
import Acessos from "./pages/Acessos";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/propostas" element={<Propostas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/base-conhecimento" element={<BaseConhecimento />} />
            <Route path="/acessos" element={<Acessos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
