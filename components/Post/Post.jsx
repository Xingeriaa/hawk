import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import styles from './Post.module.css';

function getRelativeTime(createdAt) {
  if (!createdAt) return '';
  const now = new Date();
  const posted = new Date(createdAt);
  const diffMs = now - posted;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
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

export default function Post({ post, currentUserId, onDeletePost }) {
  const navigate = useNavigate();

  const handleNavigateToProfile = () => {
    navigate(`/profile/${post.username}`);
  };

  return (
    <div className={styles.postContainer}>
      <div className={styles.postHeader}>
        <img 
          src={post.userPhotoURL || '/src/assets/DefaultProfilePic/Default.jpg'} 
          alt="User" 
          className={styles.postUserPic}
          onClick={handleNavigateToProfile}
        />
        <div className={styles.postUserInfo} onClick={handleNavigateToProfile}>
          <span className={styles.postUsername}>{post.username}</span>
          <span className={styles.postTime}>{getRelativeTime(post.createdAt)}</span>
        </div>
        <div className={styles.postMoreIcon}>
          <MoreHorizIcon />
        </div>
      </div>
      <div className={styles.postImageContainer}>
        <img src={post.imageUrl} alt="Post" className={styles.postImage} />
      </div>
      <div className={styles.postActions}>
        <div className={styles.actionsLeft}>
          <FavoriteBorderOutlinedIcon className={styles.postActionIcon} />
          <ChatBubbleOutlineOutlinedIcon className={styles.postActionIcon} />
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
      <div className={styles.privacyBadge}>
        {renderPrivacyIcon(post.privacyMode)}
      </div>
    </div>
  );
}

Post.propTypes = {
  post: PropTypes.shape({
    username: PropTypes.string,
    userPhotoURL: PropTypes.string,
    imageUrl: PropTypes.string,
    likesCount: PropTypes.number,
    caption: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    privacyMode: PropTypes.string,
  }).isRequired,
  currentUserId: PropTypes.string,
  onDeletePost: PropTypes.func,
};
