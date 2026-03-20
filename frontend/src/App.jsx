import { Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import Add from './pages/Add';
import WordPage from './pages/WordPage';
import Submissions from './pages/Submissions';
import NotFound from './pages/NotFound';

import { AuthProvider } from './context/AuthContext';
import RequireAdmin from './components/routing/RequireAdmin';
import RequireAuth from './components/routing/RequireAuth';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/word/:id" element={<WordPage />} />

        {/* Authenticated routes */}
        <Route element={<RequireAuth />}>
          <Route path="/add" element={<Add />} />
          <Route path="/submissions" element={<Submissions />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}