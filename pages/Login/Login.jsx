import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, TextField, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import styles from './Login.module.css';
import { auth } from '../../config/firebase';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleNavigate = useCallback((path) => {
    setFadeIn(false);
    setTimeout(() => navigate(path), 500);
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        handleNavigate('/home');
      }
    });
    return () => unsubscribe();
  }, [handleNavigate]);

  const emailLogin = useCallback(() => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }
    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
      .then(() => handleNavigate('/home'))
      .catch(error => alert(`Error: ${error.message}`));
  }, [email, password, handleNavigate]);

  const socialLogin = useCallback((provider) => {
    signInWithPopup(auth, provider)
      .then(() => handleNavigate('/home'))
      .catch(error => alert(`Error: ${error.message}`));
  }, [handleNavigate]);

  const handleForgotPassword = useCallback(() => {
    const userEmail = prompt("Please enter your email address to reset your password:");
    if (!userEmail) {
      alert("Email is required.");
      return;
    }
    if (!validateEmail(userEmail)) {
      alert("Please enter a valid email address.");
      return;
    }
    sendPasswordResetEmail(auth, userEmail)
      .then(() => {
        alert("Password reset email sent! Please check your inbox.");
      })
      .catch((error) => {
        console.error("Error sending password reset email: ", error);
        alert("Failed to send password reset email. Please check the email address.");
      });
  }, []);

  return (
    <div className={`${styles.loginContainer} ${fadeIn ? styles.fadeIn : styles.fadeOut}`}>
      <Box className={styles.centerBox}>
        <div className={styles.titleContent}>
          <Button variant="outlined" onClick={() => handleNavigate('/')}>
            <ArrowBackIosNewIcon />
          </Button>
          <Typography variant="h4">
            Welcome back! Glad to see you again!
          </Typography>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <div className={styles.boxContent}>
          <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" variant="outlined" type="password" fullWidth sx={{ mt: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            <a href="#" onClick={handleForgotPassword}>Forgot password?</a>
          </Typography>
          <Button variant="contained" sx={{ width: "100%", mt: 2 }} onClick={emailLogin}>
            Login
          </Button>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <Divider sx={{ flexGrow: 1, height: 1, backgroundColor: "#ccc" }} />
        <Typography variant="body2" sx={{ mx: 2, color: "#888" }}>
          Or Login with
        </Typography>
        <Divider sx={{ flexGrow: 1, height: 1, backgroundColor: "#ccc" }} />
      </Box>
      <Box className={styles.centerBox}>
        <div className={styles.buttonGroup}>
          <Button variant="outlined" onClick={() => socialLogin(facebookProvider)}>
            <FacebookRoundedIcon />
          </Button>
          <Button variant="outlined" onClick={() => socialLogin(githubProvider)}>
            <GitHubIcon />
          </Button>
          <Button variant="outlined" onClick={() => socialLogin(googleProvider)}>
            <GoogleIcon />
          </Button>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <Typography variant="body2">
          Don't have an account? <a href="#" onClick={() => handleNavigate('/register')}>Register now</a>
        </Typography>
      </Box>
    </div>
  );
}
