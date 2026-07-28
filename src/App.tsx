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
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDiscounts = lazy(() => import("./pages/AdminDiscounts"));
const AdminEnterpriseControl = lazy(() => import("./pages/AdminEnterpriseControl"));
const AdminErrors = lazy(() => import("./pages/AdminErrors"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminBranches = lazy(() => import("./pages/AdminBranches"));
const AdminKnowledgeBank = lazy(() => import("./pages/AdminKnowledgeBank"));
const AdminComplaints = lazy(() => import("./pages/AdminComplaints"));
const AdminWarnings = lazy(() => import("./pages/AdminWarnings"));
const AdminAvayaReports = lazy(() => import("./pages/AdminAvayaReports"));
const AdminGhost = lazy(() => import("./pages/AdminGhost"));
const AdminCroExport = lazy(() => import("./pages/AdminCroExport"));
const AdminUno = lazy(() => import("./pages/AdminUno"));
const AdminOperaSearch = lazy(() => import("./pages/AdminOperaSearch"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <>
    <EnterpriseThemeLoader />
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">جاري التحميل…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Navigate to="/booking-reports?section=employees" replace />} />
            <Route path="/booking-reports" element={<BookingReports />} />
            <Route path="/operations" element={<HotelSearch />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/knowledge-bank" element={<KnowledgeBank />} />
            <Route path="/policies" element={<Navigate to="/" replace />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/runner" element={<Navigate to="/" replace />} />
            <Route path="/relax" element={<Navigate to="/" replace />} />
            <Route path="/boudl-preview/*" element={<Navigate to="/" replace />} />
            <Route path="/upload-center" element={<Navigate to="/admin/login" replace />} />
            <Route path="/contact-requests" element={<Contacts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/warnings" element={<ProtectedRoute><AdminWarnings /></ProtectedRoute>} />
            <Route path="/admin/avaya-reports" element={<ProtectedRoute><AdminAvayaReports /></ProtectedRoute>} />
            <Route path="/admin/cro-export" element={<ProtectedRoute><AdminCroExport /></ProtectedRoute>} />
            <Route path="/admin/uno" element={<ProtectedRoute><AdminUno /></ProtectedRoute>} />
            <Route path="/admin/opera-search" element={<ProtectedRoute><AdminOperaSearch /></ProtectedRoute>} />
            <Route path="/admin/ghost" element={<ProtectedRoute><AdminGhost /></ProtectedRoute>} />
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
  </>
);

export default App;
