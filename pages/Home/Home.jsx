import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import Tooltip from '@mui/material/Tooltip';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';

import { auth, db } from '../../config/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import styles from './Home.module.css';

function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const posted = timestamp.toMillis();
  const diffMs = now - posted;
  const diffM = Math.floor(diffMs / (1000 * 60));
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return diffM + 'm';
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return diffH + 'h';
  const diffD = Math.floor(diffH / 24);
  return diffD + 'd';
}

function renderPrivacyIcon(privacyMode) {
  if (privacyMode === 'Public') {
    return <PublicIcon style={{ fontSize: 16, color: '#666' }} />;
  } else if (privacyMode === 'Private') {
    return <LockIcon style={{ fontSize: 16, color: '#666' }} />;
  } else if (privacyMode === 'Friends Only') {
    return <GroupIcon style={{ fontSize: 16, color: '#666' }} />;
  }
  return null;
}

function Post({ post, currentUserId, onDeletePost }) {
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [liked, setLiked] = useState(post.likedBy?.includes(currentUserId) || false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const iconRef = useRef(null);
  
  const timeAgo = post.createdAt ? getRelativeTime(post.createdAt) : '';

  const handleOpenMenu = useCallback((e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  const handleOpenConfirm = useCallback((e) => {
    e.stopPropagation();
    setOpenConfirm(true);
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setOpenConfirm(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await onDeletePost(post.id);
    setOpenConfirm(false);
    setShowMenu(false);
  }, [onDeletePost, post.id]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    const postRef = doc(db, "posts", post.id);
    if (liked) {
      await updateDoc(postRef, {
        likesCount: likesCount - 1,
        likedBy: arrayRemove(currentUserId)
      });
      setLikesCount(likesCount - 1);
      setLiked(false);
    } else {
      await updateDoc(postRef, {
        likesCount: likesCount + 1,
        likedBy: arrayUnion(currentUserId)
      });
      setLikesCount(likesCount + 1);
      setLiked(true);
    }
  }, [liked, currentUserId, likesCount, post.id]);

  // Ẩn menu khi click ra ngoài container sidebar (bao gồm icon và menu)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && iconRef.current && !iconRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const userPic = post.userPhotoURL || 'src/assets/DefaultProfilePic/Default.jpg';

  return (
    <div className={styles.postContainer}>
      <div className={styles.postHeader}>
        <img src={userPic} alt="User" className={styles.postUserPic} />
        <div className={styles.postUserInfo}>
          <span className={styles.postUsername}>{post.username}</span>
          <span className={styles.postTime}>{timeAgo}</span>
        </div>
        <Tooltip title={post.privacyMode} arrow>
          <div style={{ marginLeft: 'auto', marginRight: '10px' }}>
            {renderPrivacyIcon(post.privacyMode)}
          </div>
        </Tooltip>
        {post.userId === currentUserId && (
          <div style={{ position: 'relative' }} ref={iconRef}>
            <MoreHorizIcon 
              className={styles.postMoreIcon}
              onClick={handleOpenMenu}
            />
            {showMenu && (
              <div className={styles.postMenu} ref={menuRef}>
                <div className={styles.dangerItem} onClick={handleOpenConfirm}>
                  Delete post
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.postImageContainer}>
        <img src={post.imageUrl} alt="Post" className={styles.postImage} />
      </div>
      <div className={styles.postActions}>
        <div className={styles.actionsLeft}>
          {liked ? (
            <FavoriteIcon className={`${styles.postActionIcon} ${styles.liked}`} onClick={handleLike} />
          ) : (
            <FavoriteBorderOutlinedIcon className={styles.postActionIcon} onClick={handleLike} />
          )}
          <ChatBubbleOutlineOutlinedIcon className={styles.postActionIcon} />
          <MovieFilterOutlinedIcon className={styles.postActionIcon} />
        </div>
      </div>
      <div className={styles.postLikesCount}>
        {likesCount ? likesCount.toLocaleString() : 0} likes
      </div>
      {post.caption && post.caption.trim() !== '' && (
        <div className={styles.postCaption}>
          <span className={styles.postUsername}>{post.username}</span> {post.caption}
        </div>
      )}
      <ConfirmDialog 
        open={openConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const handleDeletePostInParent = useCallback(async (postId) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prevPosts) => prevPosts.filter(p => p.id !== postId));
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Delete post failed");
    }
  }, []);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  const fetchUserData = useCallback(async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserPhotoURL(data.profilePicUrl || 'src/assets/DefaultProfilePic/Default.jpg');
      } else {
        setUserPhotoURL('src/assets/DefaultProfilePic/Default.jpg');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  const fetchPosts = useCallback(async (userId) => {
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        let postUserPhoto = "src/assets/DefaultProfilePic/Default.jpg";
        if (data.userId) {
          try {
            const userDocRef = doc(db, "users", data.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              postUserPhoto = userData.profilePicUrl || "src/assets/DefaultProfilePic/Default.jpg";
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
        if (
          data.privacyMode === "Public" ||
          (data.privacyMode === "Private" && data.userId === userId) ||
          (data.privacyMode === "Friends Only" && (await isUserFriend(data.userId, currentUserId)) || data.userId === userId)
        ) {
          fetchedPosts.push({
            ...data,
            id: docSnap.id,
            userPhotoURL: postUserPhoto,
          });
        }
      }
      setPosts(fetchedPosts);
      setLoaded(true);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [currentUserId]);

  const isUserFriend = useCallback(async (postUserId, currentUserId) => {
    if (!postUserId || !currentUserId) return false; 
    try {
      const currentUserRef = doc(db, "users", currentUserId);
      const currentUserSnap = await getDoc(currentUserRef);
      if (currentUserSnap.exists()) {
        const currentUserData = currentUserSnap.data();
        return currentUserData.friendsList?.includes(postUserId) || false;
      }
    } catch (error) {
      console.error("Error checking friendship:", error);
    }
    return false;
  }, []);

  useEffect(() => {
    document.body.style.background = '#000';
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Current User ID:", user.uid);
        setCurrentUserId(user.uid);
        await fetchUserData(user.uid);
        await fetchPosts(user.uid);
      } else {
        navigate('/');
        console.log('User is not logged in');
      }
    });
    return () => unsubscribe();
  }, [navigate, fetchUserData, fetchPosts]);

  return (
    <>
      <div className={styles.pageWrapper}>
        {/* Sidebar */}
        <Sidebar userPhotoURL={userPhotoURL} currentUserId={currentUserId}/>

        <div className={styles.contentArea}>
          <div className={styles.feedContainer}>
            {!loaded ? (
              <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>
                Loading...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>
                No posts yet
              </div>
            ) : (
              posts.map((post) => (
                <Post 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId}
                  onDeletePost={handleDeletePostInParent}
                />
              ))
            )}
          </div>
        </div>

        {showNotifications && (
          <div className={styles.notificationsPanel}>
            <h2 className={styles.notificationsTitle}>Notifications</h2>
            <div className={styles.notificationSection}>
              <h3>This week</h3>
              <div className={styles.notificationItem}>
                <img src="avatar1.jpg" alt="User" className={styles.notificationAvatar} />
                <p>
                  <strong>ly.is.me</strong> started following you. 
                  <span className="time">2d</span>
                </p>
                <button className={styles.followingBtn}>Following</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.bottomNavContainer}>
        <HomeIcon className={styles.icon} onClick={() => handleNavigate('/home')} />
        <SearchIcon className={styles.icon} onClick={() => handleNavigate('/search')} />
        <AddBoxOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/create')} />
        <MovieFilterOutlinedIcon className={styles.icon} onClick={() => handleNavigate('/movies')} />
        <div className={`${styles.profileImage} ${styles.bottomProfile}`} onClick={() => handleNavigate('/profile')}>
          <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>
    </>
  );
}
