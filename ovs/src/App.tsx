
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ElectionsPage from "./pages/ElectionsPage";
import ElectionDetailsPage from "./pages/ElectionDetailsPage";
import ResultsPage from "./pages/ResultsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import FingerprintRequiredPage from "./pages/FingerprintRequiredPage";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/admin/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Header />
              <main className="flex-grow">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/fingerprint-required" element={<FingerprintRequiredPage />} />

                  {/* Protected Routes - Any logged in user */}
                  <Route 
                    path="/elections" 
                    element={
                      <ProtectedRoute>
                        <ElectionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/elections/:id" 
                    element={
                      <ProtectedRoute>
                        <ElectionDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route 
                    path="/results" 
                    element={
                      <ProtectedRoute>
                        <ResultsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin-only Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirects */}
                  <Route path="/" element={<LoginPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
