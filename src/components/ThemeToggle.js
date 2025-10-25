// src/components/ThemeToggle.js
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { currentTheme, themes, changeTheme, theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const themeOptions = Object.keys(themes).map(key => ({
    key,
    ...themes[key]
  }));

  return (
    <div style={styles.container}>
      <button 
        onClick={() => setShowMenu(!showMenu)}
        style={{
          ...styles.button,
          background: `linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primaryDeepDark} 100%)`
        }}
        title="Change theme"
      >
        <span style={styles.icon}>🎨</span>
        <span style={styles.text}>Theme</span>
      </button>

      {showMenu && (
        <>
          <div 
            style={styles.overlay} 
            onClick={() => setShowMenu(false)}
          />
          <div style={styles.menu}>
            <div style={styles.menuHeader}>Choose Theme</div>
            {themeOptions.map(option => (
              <button
                key={option.key}
                onClick={() => {
                  changeTheme(option.key);
                  setShowMenu(false);
                }}
                style={{
                  ...styles.menuItem,
                  background: currentTheme === option.key ? theme.primary : 'transparent',
                  borderLeft: currentTheme === option.key ? `4px solid ${theme.primaryDark}` : '4px solid transparent'
                }}
              >
                <div style={styles.themePreview}>
                  <div 
                    style={{
                      ...styles.colorDot,
                      background: option.primary
                    }} 
                  />
                  <div 
                    style={{
                      ...styles.colorDot,
                      background: option.primaryMedium
                    }} 
                  />
                  <div 
                    style={{
                      ...styles.colorDot,
                      background: option.primaryDark
                    }} 
                  />
                  <div 
                    style={{
                      ...styles.colorDot,
                      background: option.primaryDeepDark
                    }} 
                  />
                </div>
                <div style={styles.themeName}>{option.name}</div>
                {currentTheme === option.key && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative'
  },
  button: {
    padding: '10px 18px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(11, 46, 51, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap'
  },
  icon: {
    fontSize: '16px'
  },
  text: {
    fontSize: '14px'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  },
  menu: {
    position: 'absolute',
    top: '110%',
    right: 0,
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    minWidth: '240px',
    zIndex: 1000,
    overflow: 'hidden'
  },
  menuHeader: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#5A6D70',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #E8EDED'
  },
  menuItem: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    color: '#2C3E40'
  },
  themePreview: {
    display: 'flex',
    gap: '4px'
  },
  colorDot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)'
  },
  themeName: {
    flex: 1,
    textAlign: 'left',
    fontWeight: '500'
  },
  checkmark: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4F7C82'
  }
};

export default ThemeToggle;
