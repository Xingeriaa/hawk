import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import styles from './Profile.module.css';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [displayName, setDisplayName] = useState('Guest');
  const [followersCount, setFollowersCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchUserByUsername = useCallback(async (uname) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", uname.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        setProfileUserId(docSnap.id);
        setUserPhotoURL(data.profilePicUrl || 'src/assets/DefaultProfilePic/Default.jpg');
        setDisplayName(data.displayName || 'Guest');
        setFollowersCount(data.followersCount || 0);
        setPostsCount(data.postsCount || 0);
        setFollowingCount(data.followingCount || 0);
        setProfileUsername(data.username || '');
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUserPosts = useCallback(async (uid) => {
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("userId", "==", uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setUserPosts(postsData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        if (username) {
          await fetchUserByUsername(username);
        } else {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfileUserId(user.uid);
            setUserPhotoURL(data.profilePicUrl || 'src/assets/DefaultProfilePic/Default.jpg');
            setDisplayName(data.displayName || 'Guest');
            setFollowersCount(data.followersCount || 0);
            setPostsCount(data.postsCount || 0);
            setFollowingCount(data.followingCount || 0);
            setProfileUsername(data.username || '');
          } else {
            setProfileUserId(user.uid);
            setUserPhotoURL(user.photoURL || 'src/assets/DefaultProfilePic/Default.jpg');
            setDisplayName(user.displayName || 'Guest');
          }
        }
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, username, fetchUserByUsername]);

  useEffect(() => {
    if (profileUserId) {
      fetchUserPosts(profileUserId);
    }
  }, [profileUserId, fetchUserPosts]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const isMyProfile = currentUserId && currentUserId === profileUserId;

  return (
    <>
      <div className={styles.pageWrapper}>
        <Sidebar userPhotoURL={userPhotoURL} />

        <div className={styles.profileContentContainer}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeaderRow}>
              <img src={userPhotoURL} alt="Profile" className={styles.profileAvatarLarge} />
              <div className={styles.profileInfoSection}>
                <div className={styles.profileTopRow}>
                  <h2 className={styles.profileUsername}>{profileUsername || displayName}</h2>
                  {isMyProfile ? (
                    <button className={styles.followBtn} onClick={() => handleNavigate('/setting')}>
                      Edit Profile
                    </button>
                  ) : (
                    <button className={styles.followBtn}>Follow</button>
                  )}
                  <MoreHorizIcon className={styles.moreIcon} />
                </div>
                <div className={styles.profileStatsRow}>
                  <span><strong>{postsCount}</strong> posts</span>
                  <span><strong>{followersCount}</strong> followers</span>
                  <span><strong>{followingCount}</strong> following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.postsGridContainer}>
        {userPosts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#fff', marginTop: '20px' }}>No posts yet</p>
        ) : (
          <div className={styles.profilePostGrid}>
            {userPosts.map((post) => (
              <div className={styles.postGridItem} key={post.id}>
                <img src={post.imageUrl} alt="Post" />
              </div>
            ))}
          </div>
        )}
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
    </>
  );
}
