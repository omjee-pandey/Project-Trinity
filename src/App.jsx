// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import PerformanceTracker from './components/PerformanceTracker';
import HealthMonitoring from './components/HealthMonitoring';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Coaches from './components/Coaches';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileForm from './components/ProfileForm';
import InjuriesSection from './components/InjuriesSection';
import CareerPlanning from './components/CareerPlanning';
import StadiumBooking from './components/StadiumBooking';


const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    }, (error) => {
      console.error('Authentication error:', error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute user={user}>
              <ProfileForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <div className='w-full overflow-hidden'>
              <Header/>
              <PerformanceTracker/>
              <HealthMonitoring/>
              <Contact/>
              <Coaches/>
              <Footer/>
            </div>
          } 
        />
        <Route 
          path="/injuries" 
          element={
             <ProtectedRoute user={user}>
             <InjuriesSection />
             </ProtectedRoute>
    
  } 
  
/>
<Route 
  path="/career-planning" 
  element={
    <ProtectedRoute user={user}>
      <CareerPlanning />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/stadium" 
  element={
    <ProtectedRoute user={user}>
      <StadiumBooking />
    </ProtectedRoute>
  } 
/>

      </Routes>
    </Router>
  );
};

export default App;