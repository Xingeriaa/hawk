import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, TextField, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, updateProfile } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import styles from './Register.module.css';
import { auth, db } from '../../config/firebase';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const DEFAULT_AVATAR_URL = 'src/assets/DefaultProfilePic/Default.jpg';

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleNavigate = useCallback((path) => {
    setFadeIn(false);
    setTimeout(() => navigate(path), 500);
  }, [navigate]);

  const createUserDoc = useCallback(async (uid, email, displayName, photoURL, provider) => {
    const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    await setDoc(doc(db, "users", uid), {
      username,
      displayName,
      email,
      profilePicUrl: photoURL || DEFAULT_AVATAR_URL,
      bio: '',
      website: '',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      linkedAccounts: {
        google: provider instanceof GoogleAuthProvider,
        facebook: provider instanceof FacebookAuthProvider,
        github: provider instanceof GithubAuthProvider
      },
      twoFactorEnabled: false,
      twoFactorSecret: '',
      friendsCount: 0,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      blockedUsersCount: 0,
      privacySettings: {
        defaultPostPrivacy: "public",
        showEmail: true,
        showActivityStatus: true
      }
    }, { merge: true });
  }, []);

  const emailCreate = useCallback(async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }
    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const displayName = `User-${uuidv4().slice(0, 6)}`;
      await updateProfile(user, { displayName });
      await createUserDoc(user.uid, user.email, displayName, '', null);
      handleNavigate('/home');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [email, password, confirmPassword, createUserDoc, handleNavigate]);

  const socialLogin = useCallback(async (provider) => {
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const displayName = user.displayName || `User-${uuidv4().slice(0, 6)}`;
      const photoURL = user.photoURL || DEFAULT_AVATAR_URL;
      await createUserDoc(user.uid, user.email, displayName, photoURL, provider);
      handleNavigate('/home');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }, [createUserDoc, handleNavigate]);

  return (
    <div className={`${styles.loginContainer} ${fadeIn ? styles.fadeIn : styles.fadeOut}`}>
      <Box className={styles.centerBox}>
        <div className={styles.titleContent}>
          <Button variant="outlined" onClick={() => handleNavigate('/')}>
            <ArrowBackIosNewIcon />
          </Button>
          <Typography variant="h4" sx={{ mt: 2 }}>
            Hello! Register to get started!
          </Typography>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <div className={styles.boxContent}>
          <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" variant="outlined" type="password" fullWidth sx={{ mt: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField label="Confirm Password" variant="outlined" type="password" fullWidth sx={{ mt: 2 }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Button variant="contained" sx={{ width: "100%", mt: 2 }} onClick={emailCreate}>
            Register
          </Button>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <Divider sx={{ flexGrow: 1, height: 1, backgroundColor: "#ccc" }} />
        <Typography variant="body2" sx={{ mx: 2, color: "#888" }}>
          Or Register with
        </Typography>
        <Divider sx={{ flexGrow: 1, height: 1, backgroundColor: "#ccc" }} />
      </Box>
      <Box className={styles.centerBox}>
        <div className={styles.buttonGroup}>
          <Button variant="outlined" onClick={() => socialLogin(facebookProvider)}>
            <FacebookRoundedIcon />
          </Button>
          <Button variant="outlined" onClick={() => socialLogin(googleProvider)}>
            <GitHubIcon />
          </Button>
          <Button variant="outlined" onClick={() => socialLogin(githubProvider)}>
            <GoogleIcon />
          </Button>
        </div>
      </Box>
      <Box className={styles.centerBox}>
        <Typography variant="body2">
          Already have an account? <a href="#" onClick={() => handleNavigate('/login')}>Login now</a>
        </Typography>
      </Box>
    </div>
  );
}
