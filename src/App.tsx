import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HotelSearch from "./pages/HotelSearch";
import Contacts from "./pages/Contacts";
import Complaints from "./pages/Complaints";
import AdminDiscounts from "./pages/AdminDiscounts";
import AdminEnterpriseControl from "./pages/AdminEnterpriseControl";
import AdminErrors from "./pages/AdminErrors";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Complaints from "./pages/Complaints";
import Discounts from "./pages/Discounts";
import ErrorDashboard from "./pages/ErrorDashboard";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import EnterpriseThemeLoader from "./components/EnterpriseThemeLoader";

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
          <Route path="/search" element={<HotelSearch />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/complaints" element={<Complaints />} />
<<<<<<< codex/fix-xud2ja
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/admin/errors" element={<ErrorDashboard />} />
=======
>>>>>>> codex/add-tailwind-css-integration-a0gjxg
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
          <Route
            path="/admin/discounts"
            element={<ProtectedRoute><AdminDiscounts /></ProtectedRoute>}
          />
          <Route
            path="/admin/enterprise-control"
            element={<ProtectedRoute><AdminEnterpriseControl /></ProtectedRoute>}
          />
          <Route
            path="/admin/errors"
            element={<ProtectedRoute><AdminErrors /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
