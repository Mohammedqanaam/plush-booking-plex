import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import EnterpriseThemeLoader from "./components/EnterpriseThemeLoader";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const BookingReports = lazy(() => import("./pages/BookingReports"));
const Contacts = lazy(() => import("./pages/Contacts"));
const HotelSearch = lazy(() => import("./pages/HotelSearch"));
const Branches = lazy(() => import("./pages/Branches"));
const KnowledgeBank = lazy(() => import("./pages/KnowledgeBank"));
const Complaints = lazy(() => import("./pages/Complaints"));
const UploadCenter = lazy(() => import("./pages/UploadCenter"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDiscounts = lazy(() => import("./pages/AdminDiscounts"));
const AdminEnterpriseControl = lazy(() => import("./pages/AdminEnterpriseControl"));
const AdminErrors = lazy(() => import("./pages/AdminErrors"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminBranches = lazy(() => import("./pages/AdminBranches"));
const AdminKnowledgeBank = lazy(() => import("./pages/AdminKnowledgeBank"));
const AdminComplaints = lazy(() => import("./pages/AdminComplaints"));
const AdminWarnings = lazy(() => import("./pages/AdminWarnings"));
const BoudlPrototype = lazy(() => import("./pages/BoudlPrototype"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnterpriseThemeLoader />
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">جاري تحميل الصفحة…</div>}>
        <Routes>
          <Route path="/boudl-preview/*" element={<BoudlPrototype />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Navigate to="/booking-reports?section=employees" replace />} />
            <Route path="/booking-reports" element={<BookingReports />} />
            <Route path="/operations" element={<HotelSearch />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/knowledge-bank" element={<KnowledgeBank />} />
            <Route path="/policies" element={<Navigate to="/" replace />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/upload-center" element={<UploadCenter />} />
            <Route path="/contact-requests" element={<Contacts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/warnings" element={<ProtectedRoute><AdminWarnings /></ProtectedRoute>} />
            <Route path="/admin/discounts" element={<ProtectedRoute><AdminDiscounts /></ProtectedRoute>} />
            <Route path="/admin/enterprise-control" element={<ProtectedRoute><AdminEnterpriseControl /></ProtectedRoute>} />
            <Route path="/admin/errors" element={<ProtectedRoute><AdminErrors /></ProtectedRoute>} />
            <Route path="/admin/branches" element={<ProtectedRoute><AdminBranches /></ProtectedRoute>} />
            <Route path="/admin/knowledge-bank" element={<ProtectedRoute><AdminKnowledgeBank /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
