// src/components/Signup.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.signupBox}>
        <div style={styles.header}>
          <div style={styles.icon}>💰</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Start tracking your portfolio today</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="John Doe"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="your.email@example.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="••••••••"
              minLength="6"
            />
            <small style={styles.hint}>At least 6 characters</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="••••••••"
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.links}>
          <span style={styles.linkText}>Already have an account?</span>
          <Link to="/login" style={styles.link}>
            Sign In
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
  signupBox: {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
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
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  hint: {
    fontSize: '12px',
    color: '#5A6D70'
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
    textAlign: 'center',
    fontSize: '14px'
  },
  linkText: {
    color: '#5A6D70',
    marginRight: '8px'
  },
  link: {
    color: '#4F7C82',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Signup;
