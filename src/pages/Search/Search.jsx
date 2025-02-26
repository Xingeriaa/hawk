import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { TextField, IconButton, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeIcon from '@mui/icons-material/Home';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsAppIcon from '@mui/icons-material/Settings';
import styles from './Search.module.css';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function SearchUI() {
  const [queryText, setQueryText] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [suggestions, setSuggestions] = useState([]);
  const [friendIds, setFriendIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const loweredEmail = queryText.toLowerCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Note: using user.photoURL (or fallback) as needed
        setUserPhotoURL(user.photoURL || 'src/assets/DefaultProfilePic/Default.jpg');
        setCurrentUserId(user.uid);
        // First, fetch current user's friends
        await fetchFriends(user.uid);
        await fetchTopFollowedUsers(user.uid);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    document.body.classList.add(styles.homeBackground);
    return () => {
      document.body.classList.remove(styles.homeBackground);
    };
  }, []);

  // Fetch current user's friend IDs from their "friends" subcollection
  const fetchFriends = async (uid) => {
    try {
      const friendsRef = collection(db, 'users', uid, 'friends');
      const snapshot = await getDocs(friendsRef);
      const ids = snapshot.docs.map(docSnap => docSnap.data().friendId);
      setFriendIds(ids);
    } catch (error) {
      console.error("Error fetching friends: ", error);
    }
  };

  // Fetch top followed users and filter out current user and friends,
  // then check if a friend request has already been sent
  const fetchTopFollowedUsers = async (uid) => {
    try {
      const q = query(collection(db, "users"), orderBy("followersCount", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        fetchedUsers.push({
          id: docSnap.id,
          name: data.username || data.displayName || "unknown",
          displayName: data.displayName || '',
          email: data.email || '',
          followers: data.followersCount || 0,
          avatar: data.profilePicUrl || 'https://via.placeholder.com/40'
        });
      });
      // Exclude current user and their friends
      const filtered = fetchedUsers.filter(user => user.id !== uid && !friendIds.includes(user.id));
      
      // For each remaining suggestion, check if a friend request has already been sent
      const suggestionsWithStatus = await Promise.all(filtered.map(async (user) => {
        const requestDocRef = doc(db, `users/${user.id}/friendRequests`, uid);
        const requestDoc = await getDoc(requestDocRef);
        return { ...user, friendRequestSent: requestDoc.exists() };
      }));
      setSuggestions(suggestionsWithStatus);
    } catch (error) {
      console.error("Error fetching top followed users: ", error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Modified handleAddFriend function:
  const handleAddFriend = async (targetUserId) => {
    if (!auth.currentUser) {
      alert("You must be logged in to send friend requests.");
      return;
    }
    const currentUid = auth.currentUser.uid;
    if (targetUserId === currentUid) {
      alert("You cannot send a friend request to yourself.");
      return;
    }
    try {
      const requestRef = doc(db, `users/${targetUserId}/friendRequests`, currentUid);
      await setDoc(requestRef, {
        senderId: currentUid,
        displayName: auth.currentUser.displayName || 'No Name',
        email: auth.currentUser.email || 'No Email',
        photoURL: auth.currentUser.photoURL || '/src/assets/DefaultProfilePic/Default.jpg',
        sentAt: serverTimestamp(),
        status: 'pending'
      });
      alert("Friend request sent!");
      // Update the suggestions state to mark this user as having a sent request.
      setSuggestions(prev => prev.map(user => user.id === targetUserId ? { ...user, friendRequestSent: true } : user));
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request.");
    }
  };

  // Filter suggestions based on the query text
  const filteredSuggestions = queryText.includes('@')
    ? suggestions.filter(item => item.email.toLowerCase().includes(loweredEmail))
    : suggestions.filter(item =>
        item.displayName.toLowerCase().includes(loweredEmail) ||
        item.name.toLowerCase().includes(loweredEmail)
      );

  return (
    <>
      <Sidebar userPhotoURL={userPhotoURL} currentUserId={currentUserId} />

      <div className={styles.searchPageContainer}>
        <div className={styles.searchCard}>
          <div className={styles.searchBarContainer}>
            <SearchIcon className={styles.searchIcon} />
            <TextField
              placeholder="Search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              variant="standard"
              InputProps={{ disableUnderline: true, className: styles.searchInput }}
            />
          </div>
          <Typography className={styles.suggestionsTitle}>Follow suggestions</Typography>
          <List className={styles.suggestionList}>
            {filteredSuggestions.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem
                  className={styles.suggestionItem}
                  onClick={() => handleNavigate(`/${user.name.toLowerCase()}`)}
                  secondaryAction={
                    user.friendRequestSent ? (
                      <Button variant="outlined" size="small" disabled>
                        Request Sent
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        className={styles.followButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFriend(user.id);
                        }}
                      >
                        Add friend
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={user.avatar} alt={user.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<span className={styles.primaryText}>{user.name}</span>}
                    secondary={
                      <span className={styles.secondaryText}>
                        {user.displayName}
                        <br />
                        <span className={styles.followersText}>{user.followers.toLocaleString()} followers</span>
                      </span>
                    }
                  />
                </ListItem>
                {index < filteredSuggestions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </div>
      </div>
    </>
  );
}
