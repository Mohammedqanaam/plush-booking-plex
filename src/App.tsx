import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import EnterpriseThemeLoader from "./components/EnterpriseThemeLoader";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDiscounts from "./pages/AdminDiscounts";
import AdminEnterpriseControl from "./pages/AdminEnterpriseControl";
import AdminErrors from "./pages/AdminErrors";
import AdminLogin from "./pages/AdminLogin";
import AdminBranches from "./pages/AdminBranches";
import AdminKnowledgeBank from "./pages/AdminKnowledgeBank";
import AdminComplaints from "./pages/AdminComplaints";
import Contacts from "./pages/Contacts";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnterpriseThemeLoader />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/contact-requests" element={<Contacts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/discounts" element={<ProtectedRoute><AdminDiscounts /></ProtectedRoute>} />
            <Route path="/admin/enterprise-control" element={<ProtectedRoute><AdminEnterpriseControl /></ProtectedRoute>} />
            <Route path="/admin/errors" element={<ProtectedRoute><AdminErrors /></ProtectedRoute>} />
            <Route path="/admin/branches" element={<ProtectedRoute><AdminBranches /></ProtectedRoute>} />
            <Route path="/admin/knowledge-bank" element={<ProtectedRoute><AdminKnowledgeBank /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
