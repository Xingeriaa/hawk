import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Import Firestore methods & your db and auth from firebase.js
import { collection, getDocs, doc, deleteDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase'; // Adjust path as needed

// Icons
import HomeHomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';

// CSS
import styles from './Sidebar.module.css';

const Sidebar = ({ userPhotoURL, currentUserId }) => {
  const navigate = useNavigate();

  // State for toggling the notifications panel
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // State for friend requests data
  const [friendRequests, setFriendRequests] = useState([]);
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for the favorite icon container and notifications panel
  const iconRef = useRef(null);
  const panelRef = useRef(null);

  // Toggle the notifications panel on Favorite icon click
  const toggleNotificationsPanel = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (currentUserId) {
      const friendRequestsRef = collection(db, 'users', currentUserId, 'friendRequests');
      const unsubscribe = onSnapshot(friendRequestsRef, snapshot => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(requestsData);
      });
      return () => unsubscribe();
    }
  }, [currentUserId]);
  

  // Fetch friend requests when the panel is open
  useEffect(() => {
    if (isNotificationsOpen && currentUserId) {
      fetchFriendRequests();
    }
  }, [isNotificationsOpen, currentUserId]);

  // Function to fetch friendRequests from Firestore
  const fetchFriendRequests = async () => {
    setLoading(true);
    setError(null);
    try {
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

  // Function to accept a friend request and add mutual friendship
  const handleAcceptRequest = async (request) => {
    try {
      // Add the accepted friend to the current user's 'friends' subcollection.
      const currentUserFriendsRef = collection(db, 'users', currentUserId, 'friends');
      await addDoc(currentUserFriendsRef, {
        friendId: request.senderId,
        displayName: request.displayName,
        email: request.email,
        acceptedAt: new Date(),
      });

      // Add the current user to the sender's 'friends' subcollection for mutual friendship.
      const senderFriendsRef = collection(db, 'users', request.senderId, 'friends');
      const currentUser = auth.currentUser;
      await addDoc(senderFriendsRef, {
        friendId: currentUserId,
        displayName: currentUser.displayName || 'No Name',
        email: currentUser.email || 'No Email',
        acceptedAt: new Date(),
      });

      // Remove the friend request after acceptance
      await deleteDoc(doc(db, 'users', currentUserId, 'friendRequests', request.id));
      setFriendRequests((prev) => prev.filter((req) => req.id !== request.id));
    } catch (err) {
      console.error(err);
    }
  };

  // Function to deny a friend request
  const handleDenyRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'users', currentUserId, 'friendRequests', requestId));
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Close the notifications panel if the user clicks outside the icon or panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isNotificationsOpen &&
        panelRef.current &&
        iconRef.current &&
        !panelRef.current.contains(event.target) &&
        !iconRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

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
          <HomeHomeOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/home')} />
          <SearchIcon className={styles.icon} onClick={() => handleNavigate('/search')} />
          <AddBoxOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/create')} />
          {/* Wrap the Favorite icon in a div to attach a ref */}
          <div ref={iconRef} style={{ position: 'relative' }}>
            <FavoriteBorderOutlinedIcon className={styles.icon} onClick={toggleNotificationsPanel} />
            {friendRequests.length > 0 && (
              <span className={styles.notificationBubble}>
                {friendRequests.length}
              </span>
            )}
          </div>
        </div>
        <SettingsIcon className={`${styles.icon} ${styles.settingsIcon}`} onClick={() => handleNavigate('/setting')} />
        <div className={styles.profileSidebarProfile} onClick={() => handleNavigate('/profile')}>
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>

      {/* NOTIFICATIONS PANEL */}
      <div ref={panelRef} className={`${styles.notificationsPanel} ${isNotificationsOpen ? styles.open : ''}`}>
        <div className={styles.notificationsHeader}>
          <h2>Friend Requests</h2>
        </div>
        <div className={styles.notificationsContent}>
          {loading && <p>Loading friend requests...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {!loading && !error && friendRequests.length === 0 && <p>No friend requests</p>}
          {friendRequests.map((request) => (
            <div key={request.id} className={styles.notificationItem}>
              <div className={styles.requestAvatar}>
                <img
                  src={request.photoURL || '/src/assets/DefaultProfilePic/Default.jpg'}
                  alt={request.displayName}
                />
              </div>
              <div className={styles.requestInfo}>
                <p>
                  <strong>{request.displayName}</strong> sent you a friend request
                </p>
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.acceptButton} onClick={() => handleAcceptRequest(request)}>
                  Accept
                </button>
                <button className={styles.denyButton} onClick={() => handleDenyRequest(request.id)}>
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
