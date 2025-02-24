import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBackIosNew as ArrowBackIosNewIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  AddBoxOutlined as AddBoxOutlinedIcon,
  MovieFilterOutlined as MovieFilterOutlinedIcon,
  ChatBubbleOutlineOutlined as ChatBubbleOutlineOutlinedIcon,
  FavoriteBorderOutlined as FavoriteBorderOutlinedIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  AlternateEmail as AlternateEmailIcon,
  WifiTethering as WifiTetheringIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import { Typography, Switch, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateProfile,
  signOut,
  deleteUser,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import Sidebar from '../../components/Sidebar/Sidebar';
import styles from './Setting.module.css';

export default function Setting() {
  const navigate = useNavigate();
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [activeTab, setActiveTab] = useState('Account');
  const [userId, setUserId] = useState(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const BIO_MAX_LENGTH = 150;
  const [bioInput, setBioInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [privateProfile, setPrivateProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [birthdayInput, setBirthdayInput] = useState('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.style.background = '#0d0d0d';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserPhotoURL(user.photoURL || 'src/assets/DefaultProfilePic/Default.jpg');
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setDisplayNameInput(data.displayName || '');
          setUsernameInput(data.username || '');
          setBioInput(data.bio || '');
          setWebsiteInput(data.website || '');
          setBirthdayInput(data.birthday || '');
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const checkUsernameUnique = async (newUsername) => {
    const q = query(collection(db, "users"), where("username", "==", newUsername));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSaveChanges = async () => {
    if (!userId) return;
    const newDisplayName = displayNameInput.trim();
    const newUsername = usernameInput.trim().toLowerCase();
    const newWebsite = websiteInput.trim();
    const newBio = bioInput.trim();
    const newBirthday = birthdayInput.trim();
    if (!newDisplayName || !newUsername) {
      alert("Display name and username cannot be empty.");
      return;
    }
    if (newBio.length > BIO_MAX_LENGTH) {
      alert("Bio is too long.");
      return;
    }
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const currentData = userSnap.data();
    if (currentData.username !== newUsername) {
      const isUnique = await checkUsernameUnique(newUsername);
      if (!isUnique) {
        alert("Username already exists, please choose another.");
        return;
      }
    }
    try {
      await updateDoc(userRef, {
        displayName: newDisplayName,
        username: newUsername,
        website: newWebsite,
        bio: newBio,
        birthday: newBirthday,
      });
      if (auth.currentUser.displayName !== newDisplayName) {
        await updateProfile(auth.currentUser, { displayName: newDisplayName });
      }
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile: ", error);
      alert("Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      alert("No user is logged in.");
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      alert("A confirmation email has been sent. Please confirm to delete your account.");
      await deleteUser(auth.currentUser);
      alert("Your account has been deleted successfully.");
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error deleting account: ", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleDeactivateAccount = async () => {
    if (!auth.currentUser) {
      alert("No user is logged in.");
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      alert("A confirmation email has been sent. Please confirm to deactivate your account.");
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error deactivating account: ", error);
      alert("Failed to deactivate account. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !userId) {
      alert("No user is logged in.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      alert("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Error updating password: ", error);
      alert("Failed to update password. Please check your current password.");
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload");
      }
      const data = await response.json();
      const imageUrl = data.secure_url;
      setUserPhotoURL(imageUrl);
      await updateProfile(auth.currentUser, { photoURL: imageUrl });
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { profilePicUrl: imageUrl });
      alert("Profile photo updated successfully (via Cloudinary)!");
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert("Failed to upload profile photo.");
    }
  };

  const inputStyle = {
    backgroundColor: '#222222',
    borderColor: '#333333',
    color: '#ffffff'
  };

  const renderConfirmationDialog = useCallback(() => (
    <Dialog open={confirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)}>
      <DialogTitle>
        {actionType === 'delete' ? 'Delete Account' : 'Deactivate Account'}
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to {actionType === 'delete' ? 'delete' : 'deactivate'} your account? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions className={styles.dialogActions}>
        <Button onClick={() => setConfirmationDialogOpen(false)} variant="outlined" className={styles.dialogButton}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            setConfirmationDialogOpen(false);
            if (actionType === 'delete') {
              handleDeleteAccount();
            } else {
              handleDeactivateAccount();
            }
          }}
          variant="contained"
          className={styles.dialogButton}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  ), [confirmationDialogOpen, actionType]);

  const renderPrivacy = useCallback(() => (
    <>
      <div className={styles.privacySection}>
        <div className={styles.settingRow}>
          <LockIcon className={styles.settingRowIcon} />
          <span className={styles.settingRowText}>Private profile</span>
          <div className={styles.settingRowRight}>
            <Switch
              checked={privateProfile}
              onChange={(e) => setPrivateProfile(e.target.checked)}
              className={styles.toggleSwitch}
            />
          </div>
        </div>
        <div className={styles.settingRow}>
          <AlternateEmailIcon className={styles.settingRowIcon} />
          <span className={styles.settingRowText}>Mentions</span>
          <div className={styles.settingRowRight}>
            <span>Everyone</span>
          </div>
        </div>
        <div className={styles.settingRow}>
          <WifiTetheringIcon className={styles.settingRowIcon} />
          <span className={styles.settingRowText}>Online status</span>
          <div className={styles.settingRowRight}>
            <span>Followers</span>
          </div>
        </div>
        <div className={styles.settingRow}>
          <VisibilityOffIcon className={styles.settingRowIcon} />
          <span className={styles.settingRowText}>Hidden Words</span>
          <div className={styles.settingRowArrow}>
            <ArrowForwardIosIcon className={styles.arrowIcon} />
          </div>
        </div>
      </div>
      <Button variant="contained" className={styles.deleteButton} onClick={() => { setActionType('delete'); setConfirmationDialogOpen(true); }}>
        Delete Account
      </Button>
      <Button variant="contained" className={styles.deactivateButton} onClick={() => { setActionType('deactivate'); setConfirmationDialogOpen(true); }}>
        Deactivate Account
      </Button>
    </>
  ), [privateProfile]);

  const renderAccount = useCallback(() => (
    <>
      <div className={styles.profileCard}>
        <img src={userPhotoURL} alt="Profile" className={styles.profileAvatarLarge} />
        <div className={styles.profileInfoSection}>
          <Typography variant="body1" className={styles.profileUsername}>
            {usernameInput || 'Username'}
          </Typography>
          <Typography variant="body2" className={styles.profileDisplayName}>
            {displayNameInput || 'Display Name'}
          </Typography>
        </div>
        <Button variant="contained" className={styles.changePhotoButton} onClick={() => fileInputRef.current.click()}>
          Change photo
        </Button>
        <input type="file" style={{ display: 'none' }} ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
      </div>
      <Typography variant="body1" className={styles.sectionTitle}>Bio</Typography>
      <TextField
        variant="outlined"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        value={bioInput}
        onChange={(e) => {
          if (e.target.value.length <= BIO_MAX_LENGTH) {
            setBioInput(e.target.value);
          }
        }}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <Typography variant="body2" className={styles.bioLength}>
        {bioInput.length} / {BIO_MAX_LENGTH}
      </Typography>
      <Typography variant="body1" className={styles.sectionTitle}>Display Name</Typography>
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        value={displayNameInput}
        onChange={(e) => setDisplayNameInput(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <Typography variant="body1" className={styles.sectionTitle}>Username</Typography>
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <Typography variant="body1" className={styles.sectionTitle}>Birthday</Typography>
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        type="date"
        value={birthdayInput}
        onChange={(e) => setBirthdayInput(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <Button variant="contained" className={styles.saveChangesButton} onClick={handleSaveChanges}>
        Save Changes
      </Button>
      <Typography variant="body1" className={styles.sectionTitle}>Change Password</Typography>
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <TextField
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        placeholder="Confirm New Password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        InputProps={{ style: inputStyle }}
        sx={{ fieldset: { borderColor: '#333333' } }}
      />
      <Button variant="contained" className={styles.changePasswordButton} onClick={handleChangePassword}>
        Change Password
      </Button>
      <div className={styles.logoutButtonContainer}>
        <button className={styles.logoutButton} onClick={handleSignOut}>
          Log Out
        </button>
      </div>
    </>
  ), [bioInput, usernameInput, displayNameInput, birthdayInput, currentPassword, newPassword, confirmNewPassword, inputStyle, BIO_MAX_LENGTH]);

  return (
    <>
      <div className={styles.pageWrapper}>
        <Sidebar userPhotoURL={userPhotoURL} />
        <div className={styles.contentArea}>
          <div className={styles.topNav}>
            <ArrowBackIosNewIcon className={styles.backIcon} onClick={() => handleNavigate('/profile')} />
            <Typography variant="h5" className={styles.settingsTitle}>Settings</Typography>
          </div>
          <div className={styles.settingsCard}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'Privacy' ? styles.active : ''}`} onClick={() => setActiveTab('Privacy')}>
                Privacy
              </button>
              <button className={`${styles.tab} ${activeTab === 'Account' ? styles.active : ''}`} onClick={() => setActiveTab('Account')}>
                Account
              </button>
            </div>
            {activeTab === 'Privacy' && renderPrivacy()}
            {activeTab === 'Account' && renderAccount()}
          </div>
        </div>
      </div>
      <div className={styles.bottomNavContainer}>
        <HomeIcon className={styles.icon} onClick={() => handleNavigate('/home')} />
        <SearchIcon className={styles.icon} onClick={() => handleNavigate('/search')} />
        <AddBoxOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/create')} />
        <MovieFilterOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/movies')} />
        <div className={styles.bottomProfile} onClick={() => handleNavigate('/profile')}>
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>
      {renderConfirmationDialog()}
    </>
  );
}
