// frontend/src/components/AuthSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../services/api';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Get token from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');

        if (!token) {
          throw new Error('No authentication token received');
        }

        console.log('Received token:', token);

        // Store the token
        localStorage.setItem('token', token);
        setAuthToken(token);

        // Decode token to get basic user info
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);

        // Fetch complete user data from backend
        try {
          const userResponse = await api.get('/auth/me');
          const userData = userResponse.data;
          console.log('User data:', userData);

          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData));

          // Redirect based on user role
          const role = userData.role || 'user';
          console.log('Redirecting to role:', role);

          switch (role) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'recipient':
              navigate('/recipient/dashboard');
              break;
            case 'user':
              navigate('/user/dashboard');
              break;
            default:
              navigate('/dashboard');
          }
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // If we can't fetch user data, still try to redirect with basic token info
          const role = decoded.role || 'user';
          navigate(`/${role}/dashboard`);
        }

      } catch (error) {
        console.error('Auth success error:', error);
        // Redirect to login with error message
        navigate('/login', { 
          state: { 
            error: 'Authentication failed. Please try again.' 
          } 
        });
      }
    };

    handleAuthSuccess();
  }, [navigate, location]);

  return (
    <div style={styles.container}>
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>Completing authentication...</p>
        <p style={styles.subText}>Please wait while we log you in.</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '90%',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px auto',
  },
  text: {
    fontSize: '18px',
    color: '#333',
    margin: '0 0 10px 0',
    fontWeight: '600',
  },
  subText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
};

// Add CSS for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
try {
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
} catch (e) {
  console.log('CSS already added');
}
