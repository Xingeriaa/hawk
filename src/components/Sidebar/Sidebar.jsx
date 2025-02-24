import React from 'react';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import styles from './Sidebar.module.css';

const Sidebar = ({ userPhotoURL }) => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className={styles.sidebar}>
      <img 
        src="/src/assets/logo-square.png" 
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
      <SettingsIcon className={`${styles.icon} ${styles.settingsIcon}`} onClick={() => handleNavigate('/setting')} />
      <div className={styles.profileSidebarProfile} onClick={() => handleNavigate('/profile')}>
        <img src={userPhotoURL} alt="Profile" className={styles.profileImage} />
      </div>
    </div>
  );
};

export default Sidebar;
