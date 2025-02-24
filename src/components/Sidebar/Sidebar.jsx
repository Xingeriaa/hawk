import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import Firestore methods & your db from firebase.js
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js'; // <-- Adjust path to your firebase.js

// Optionally import auth if you want to detect current user here
// import { auth } from '../firebase';
// import { onAuthStateChanged } from 'firebase/auth';

// Icons
import HomeHomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';

// Styles
import styles from './Sidebar.module.css';

const Sidebar = ({ userPhotoURL, currentUserId }) => {
  const navigate = useNavigate();

  // State for toggling the notifications panel
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // State for friend requests data
  const [friendRequests, setFriendRequests] = useState([]);
  // Loading/error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Optional: If you want to detect the current user here, you could do something like:
  /*
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUserId(user.uid);
      } else {
        setLoggedInUserId(null);
      }
    });
  }, []);
  */

  // Toggle the notifications panel open/close
  const toggleNotificationsPanel = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  // Fetch friend requests whenever the panel is opened
  useEffect(() => {
    if (isNotificationsOpen && currentUserId) {
      fetchFriendRequests();
    }
  }, [isNotificationsOpen, currentUserId]);

  // Fetch friendRequests from Firestore
  const fetchFriendRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      // Reference: users/<uid>/friendRequests
      const friendRequestsRef = collection(db, 'users', currentUserId, 'friendRequests');
      const snapshot = await getDocs(friendRequestsRef);
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriendRequests(requestsData);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Example: confirm a friend request
  const handleConfirmRequest = async (requestId) => {
    console.log('Confirm friend request:', requestId);
    // Typically you'd update or move the doc, e.g.:
    // await updateDoc(doc(db, 'users', currentUserId, 'friendRequests', requestId), {
    //   status: 'accepted',
    // });
    // Then refetch or remove it from local state
  };

  // Example: delete a friend request
  const handleDeleteRequest = async (requestId) => {
    console.log('Delete friend request:', requestId);
    try {
      await deleteDoc(doc(db, 'users', currentUserId, 'friendRequests', requestId));
      // Remove it from local state
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <img
          src="/src/assets/logo-square.png"
          alt="Logo"
          className={styles.sidebarLogo}
          onClick={() => handleNavigate('/home')}
        />
        <div className={styles.iconContainer}>
          <HomeHomeOutlinedIcon
            className={styles.icon}
            onClick={() => handleNavigate('/home')}
          />
          <SearchIcon
            className={styles.icon}
            onClick={() => handleNavigate('/search')}
          />
          <AddBoxOutlinedIcon
            className={styles.icon}
            onClick={() => handleNavigate('/create')}
          />
          <MovieFilterOutlinedIcon
            className={styles.icon}
            onClick={() => handleNavigate('/movies')}
          />
          {/* Toggle notifications panel on click */}
          <FavoriteBorderOutlinedIcon
            className={styles.icon}
            onClick={toggleNotificationsPanel}
          />
          <ChatBubbleOutlineOutlinedIcon
            className={styles.icon}
            onClick={() => handleNavigate('/chat')}
          />
        </div>
        <SettingsIcon
          className={`${styles.icon} ${styles.settingsIcon}`}
          onClick={() => handleNavigate('/setting')}
        />
        <div
          className={styles.profileSidebarProfile}
          onClick={() => handleNavigate('/profile')}
        >
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>

      {/* NOTIFICATIONS PANEL */}
      <div
        className={`${styles.notificationsPanel} ${
          isNotificationsOpen ? styles.open : ''
        }`}
      >
        <div className={styles.notificationsHeader}>
          <h2>Friend Requests</h2>
          <button onClick={toggleNotificationsPanel} className={styles.closeButton}>
            X
          </button>
        </div>

        <div className={styles.notificationsContent}>
          {loading && <p>Loading friend requests...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {!loading && !error && friendRequests.length === 0 && (
            <p>No friend requests</p>
          )}

          {friendRequests.map((request) => (
            <div key={request.id} className={styles.notificationItem}>
              <div>
                <p>
                  <strong>{request.displayName}</strong> sent you a friend request
                </p>
                <p>Email: {request.email}</p>
              </div>
              <div>
                <button onClick={() => handleConfirmRequest(request.id)}>Confirm</button>
                <button onClick={() => handleDeleteRequest(request.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
 