import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";
import Courses from "./pages/Courses";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CourseDetail from "./pages/CourseDetail";
import CourseLearn from "@/pages/CourseLearn";
import AssignmentDetailPage from "./pages/AssignmentDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Страница логина/регистрации */}
          <Route path="/auth" element={<Auth />} />

          {/* Всё остальное под MainLayout */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  {/* Главная: список курсов */}
                  <Route path="/" element={<Courses />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/:courseId" element={<CourseDetail />} />
                  <Route
                    path="courses/:courseId/assignments/:assignmentId"
                    element={<AssignmentDetailPage />}
                  />
                  <Route
                    path="courses/:courseId/learn"
                    element={<CourseLearn />}
                  />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
