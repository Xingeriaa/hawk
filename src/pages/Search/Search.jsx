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
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function SearchUI() {
  const [queryText, setQueryText] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const loweredEmail = queryText.toLowerCase();

  useEffect(() => {
    document.body.classList.add(styles.homeBackground);
    return () => {
      document.body.classList.remove(styles.homeBackground);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserPhotoURL(user.photoURL || 'src/assets/DefaultProfilePic/Default.jpg');
        await fetchTopFollowedUsers();
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchTopFollowedUsers = async () => {
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
      setSuggestions(fetchedUsers);
    } catch (error) {
      console.error("Error fetching top followed users: ", error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleAddFriend = async (targetUserId) => {
    if (!auth.currentUser) {
      alert("You must be logged in to send friend requests.");
      return;
    }
    const currentUserId = auth.currentUser.uid;
    try {
      const requestRef = doc(db, `users/${targetUserId}/friendRequests`, currentUserId);
      await setDoc(requestRef, {
        from: currentUserId,
        sentAt: serverTimestamp(),
        status: 'pending'
      });
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request.");
    }
  };

  const loweredQuery = queryText.toLowerCase();
  const filteredSuggestions = queryText.includes('@')
    ? suggestions.filter(item => item.email.toLowerCase().includes(loweredQuery))
    : suggestions.filter(item =>
        item.displayName.toLowerCase().includes(loweredQuery) ||
        item.name.toLowerCase().includes(loweredQuery)
      );

  return (
    <>
      <div className={styles.bottomNavContainer}>
        <HomeIcon className={styles.icon} onClick={() => handleNavigate('/home')} />
        <SearchIcon className={styles.icon} onClick={() => handleNavigate('/search')} />
        <AddBoxOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/create')} />
        <MovieFilterOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/movies')} />
        <div className={styles.profile} onClick={() => handleNavigate('/profile')}>
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>

      <div className={styles.sidebar}>
        <img
          src="src/assets/logo-square.png"
          alt="Logo"
          className={styles.sidebarLogo}
          onClick={() => handleNavigate('/home')}
        />
        <div className={styles.iconContainer}>
          <HomeIcon className={styles.icon} onClick={() => handleNavigate('/home')} />
          <SearchIcon className={styles.icon} onClick={() => handleNavigate('/search')} />
          <AddBoxOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/create')} />
          <MovieFilterOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/movies')} />
          <FavoriteBorderOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/favorites')} />
          <ChatBubbleOutlineOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/chat')} />
        </div>
        <SettingsAppIcon className={styles.icon + " " + styles.settingsIcon} onClick={() => handleNavigate('/setting')} />
        <div className={styles.profile} onClick={() => handleNavigate('/profile')}>
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>

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
            <IconButton className={styles.filterIconContainer}>
              <FilterListIcon className={styles.filterIcon} />
            </IconButton>
          </div>
          <Typography className={styles.suggestionsTitle}>Follow suggestions</Typography>
          <List className={styles.suggestionList}>
            {filteredSuggestions.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem
                  className={styles.suggestionItem}
                  onClick={() => handleNavigate(`/${user.name.toLowerCase()}`)}
                  secondaryAction={
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
