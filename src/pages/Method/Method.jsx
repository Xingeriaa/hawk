import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '@fontsource/roboto/700.css';
import Button from '@mui/material/Button';
import styles from './Method.module.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function Method() {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(true);

  const handleNavigate = useCallback(
    (path) => {
      setFadeIn(false);
      setTimeout(() => navigate(path), 500);
    },
    [navigate]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) handleNavigate('/home');
    });
    return () => unsubscribe();
  }, [handleNavigate]);

  const RedirectHandler = useCallback((method) => {
    setFadeIn(false);
    setTimeout(() => {
      switch (method.toLowerCase()) {
        case 'method':
          navigate('/');
          break;
        case 'login':
          navigate('/login');
          break;
        case 'register':
          navigate('/register');
          break;
        case 'home':
          navigate('/home');
          break;
        default:
          break;
      }
    }, 750);
  }, [navigate]);

  return (
    <div className={styles.methodHomeContainer}>
      <div className={`${styles.methodContainer} ${fadeIn ? styles.fadeIn : styles.fadeOut}`}>
        <div className={styles.imageContainer}>
          <img src="/src/assets/Login/login-image.jpg" alt="" />
        </div>
        <div className={styles.buttonsContainer}>
          <Button variant="contained" className={styles.btnLogin} onClick={() => RedirectHandler('login')}>
            Login
          </Button>
          <Button variant="outlined" className={styles.btnRegister} onClick={() => RedirectHandler('register')}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
