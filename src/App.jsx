import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Onboarding from '@/pages/Onboarding';
import WorkoutTab from '@/pages/WorkoutTab';
import CreateWorkout from '@/pages/CreateWorkout';
import ActiveWorkout from '@/pages/ActiveWorkout';
import PostWorkout from '@/pages/PostWorkout';
import NutritionTab from '@/pages/NutritionTab';
import ProgressTab from '@/pages/ProgressTab';
import CoachTab from '@/pages/CoachTab';
import AtlasTab from '@/pages/AtlasTab';
import TitanTab from '@/pages/TitanTab';
import CalendarTab from '@/pages/CalendarTab';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/active-workout/:id" element={<ActiveWorkout />} />
      <Route path="/post-workout/:id" element={<PostWorkout />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/workout" element={<WorkoutTab />} />
        <Route path="/workout/create" element={<CreateWorkout />} />
        <Route path="/nutrition" element={<NutritionTab />} />
        <Route path="/progress" element={<ProgressTab />} />
        <Route path="/coach" element={<CoachTab />} />
        <Route path="/atlas" element={<AtlasTab />} />
        <Route path="/titan" element={<TitanTab />} />
        <Route path="/calendar" element={<CalendarTab />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App