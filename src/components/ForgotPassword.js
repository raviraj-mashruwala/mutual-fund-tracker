// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your email for password reset instructions');
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <div style={styles.icon}>🔑</div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>Enter your email to receive reset instructions</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div style={styles.success}>
            <span>✅</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="your.email@example.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #B8E3E9 0%, #93B1B5 100%)',
    padding: '20px'
  },
  box: {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(11, 46, 51, 0.15)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#0B2E33'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#5A6D70'
  },
  error: {
    background: '#FFEBEE',
    color: '#C62828',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  success: {
    background: '#E8F5E9',
    color: '#2E7D32',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2C3E40'
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #E8EDED',
    borderRadius: '8px',
    outline: 'none'
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #4F7C82 0%, #0B2E33 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '8px'
  },
  links: {
    marginTop: '24px',
    textAlign: 'center'
  },
  link: {
    color: '#4F7C82',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px'
  }
};

export default ForgotPassword;
