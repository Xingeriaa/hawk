import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import styles from './Profile.module.css';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import Post from '../../components/Post/Post.jsx'; // New shared Post component

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [displayName, setDisplayName] = useState('Guest');
  const [postsCount, setPostsCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch user data by username from the URL
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
        setPostsCount(data.postsCount || 0);
        setProfileUsername(data.username || '');
        console.log("Fetched user:", docSnap.id, data);
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);
    }
  }, []);

  // Fetch posts for the given user ID
  const fetchUserPosts = async (uid) => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      console.log("Fetched posts for user", uid, postsData);
      setUserPosts(postsData);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  // Fetch friend count from the "friends" subcollection
  const fetchFriendCount = useCallback(async (uid) => {
    try {
      const friendsRef = collection(db, "users", uid, "friends");
      const friendsSnap = await getDocs(friendsRef);
      setFriendCount(friendsSnap.docs.length);
      console.log("Fetched friend count for", uid, friendsSnap.docs.length);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }, []);

  // Listen for auth state changes and fetch profile data
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
            setPostsCount(data.postsCount || 0);
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

  // When profileUserId is available, fetch posts and friend count
  useEffect(() => {
    if (profileUserId) {
      fetchUserPosts(profileUserId);
      fetchFriendCount(profileUserId);
    }
  }, [profileUserId, fetchUserPosts, fetchFriendCount]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const isMyProfile = currentUserId && currentUserId === profileUserId;

  return (
    <>
      <div className={styles.pageWrapper}>
        <Sidebar userPhotoURL={userPhotoURL} currentUserId={currentUserId} />

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
                  <span><strong>{friendCount}</strong> friends</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.postsGridContainer}>
        {userPosts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#fff', marginTop: '20px' }}>
            No posts yet
          </p>
        ) : (
          <div className={styles.profilePostGrid}>
            {userPosts.map((post) => (
              <Post
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDeletePost={(id) => {
                  // Optionally implement deletion logic here if needed.
                }}
              />
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
