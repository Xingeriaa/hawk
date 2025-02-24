import React from 'react';
import { useNavigate } from "react-router-dom";

import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';

import styles from './Post.module.css';

function getRelativeTime() {
  return '1d'; 
}

const renderPrivacyIcon = (privacyMode) => {
  if (privacyMode === 'Public') {
    return <PublicIcon className={styles.privacyIcon} />;
  } else if (privacyMode === 'Private') {
    return <LockIcon className={styles.privacyIcon} />;
  } else if (privacyMode === 'Friends Only') {
    return <GroupIcon className={styles.privacyIcon} />;
  }
  return null;
};

const post = {
  username: 'iuiii',
  userPhotoURL: 'src/assets/DefaultProfilePic/Default.jpg',
  imageUrl: 'src/assets/sample-post.jpg',
  likesCount: 12,
  caption: 'A nice day out!',
  createdAt: getRelativeTime(),
  privacyMode: 'Public'
};

export default function PostPage() {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.sidebar}>
        <img 
          src="src/assets/logo-square.png" 
          alt="Logo" 
          className={styles.sidebarLogo}
          onClick={() => handleNavigate('/home')}
        />
        <div className={styles.iconContainer}>
          <HomeIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/home')} />
          <SearchIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/search')} />
          <AddBoxOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/create')} />
          <MovieFilterOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/movies')} />
          <FavoriteBorderOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/favorites')} />
          <ChatBubbleOutlineOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/chat')} />
        </div>
        <SettingsIcon className={`${styles.icon} ${styles.settingsIcon}`} onClick={() => handleNavigate('/setting')} />
        <div className={styles.profileSidebarProfile} onClick={() => handleNavigate('/profile')}>
          <img src={post.userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.postContainer}>
          <div className={styles.postHeader}>
            <img src={post.userPhotoURL} alt="User" className={styles.postUserPic} />
            <div className={styles.postUserInfo}>
              <span className={styles.postUsername}>{post.username}</span>
              <span className={styles.postTime}>{post.createdAt}</span>
            </div>
            <div className={styles.post}>
              <img src={post.imageUrl} alt="Post" />
              <p>{post.caption}</p>
              <span className={styles.privacyBadge}>
                {renderPrivacyIcon(post.privacyMode)}
              </span>
            </div>
            <MoreHorizIcon className={styles.postMoreIcon}/>
          </div>
          <div className={styles.postImageContainer}>
            <img src={post.imageUrl} alt="Post" className={styles.postImage} />
          </div>
          <div className={styles.postActions}>
            <div className={styles.actionsLeft}>
              <FavoriteBorderOutlinedIcon className={styles.postActionIcon} />
              <ChatBubbleOutlineOutlinedIcon className={styles.postActionIcon} />
              <MovieFilterOutlinedIcon className={styles.postActionIcon} />
            </div>
          </div>
          <div className={styles.postLikesCount}>
            {post.likesCount ? post.likesCount.toLocaleString() : 0} likes
          </div>
          {post.caption && post.caption.trim() !== '' && (
            <div className={styles.postCaption}>
              <span className={styles.postUsername}>{post.username}</span> {post.caption}
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomNavContainer}>
        <HomeIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/home')} />
        <SearchIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/search')} />
        <AddBoxOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/create')} />
        <MovieFilterOutlinedIcon className={`${styles.icon} ${styles.iconHover}`} onClick={() => handleNavigate('/movies')} />
        <div className={`${styles.profileImage} ${styles.bottomProfile}`} onClick={() => handleNavigate('/profile')}>
          <img src={post.userPhotoURL} alt="Profile" className={styles.profileImage} />
        </div>
      </div>
    </div>
  );
}
