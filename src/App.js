import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Amplify } from 'aws-amplify';
import { PrincipalEntityProvider } from './context/PrincipalEntityContext';

import environment from './config/environment';
import authService from './services/authService';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Categories from './components/Categories/Categories';
import DataList from './components/Data/DataList';
import DataForm from './components/Data/DataForm';
import DataDetail from './components/Data/DataDetail';
import GraphView from './components/Graph/GraphView';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: environment.AWS_CONFIG.region,
    userPoolId: environment.AWS_CONFIG.userPoolId,
    userPoolWebClientId: environment.AWS_CONFIG.userPoolWebClientId,
  },
});

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const user = await authService.initialize();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthChange = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <PrincipalEntityProvider>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Login onAuthChange={handleAuthChange} />
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <Categories />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/data" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <DataList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/data/new" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <DataForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/data/:id" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <DataDetail />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/graph" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout onAuthChange={handleAuthChange}>
                    <GraphView />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
      </PrincipalEntityProvider>
    </ThemeProvider>
  );
}

export default App;