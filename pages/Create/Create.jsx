import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MovieFilterOutlinedIcon from '@mui/icons-material/MovieFilterOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { auth, db } from '../../config/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import styles from './Create.module.css';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';

export default function Create() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [userPhotoURL, setUserPhotoURL] = useState('src/assets/DefaultProfilePic/Default.jpg');
  const [username, setUsername] = useState('username'); 
  const [currentUserId, setCurrentUserId] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]); 
  const [showConfirmation, setShowConfirmation] = useState(false); 
  const [caption, setCaption] = useState('');
  const [privacyMode, setPrivacyMode] = useState('Public');
  
  // Cloudinary details
  const cloudName = "djqcoypqf";
  const uploadPreset = "PostImages";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setUserPhotoURL(user.photoURL || 'src/assets/DefaultProfilePic/Default.jpg');
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username || 'username');
        } else {
          setUsername('username');
        }
      } else {
        setCurrentUserId(null);
        setUserPhotoURL('src/assets/DefaultProfilePic/Default.jpg');
        setUsername('username');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleSelectFromComputer = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFilesSelected(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  };

  const handleFilesSelected = async (files) => {
    const acceptedFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (acceptedFiles.length === 0) return;
    const firstFile = acceptedFiles[0];

    try {
      const formData = new FormData();
      formData.append('file', firstFile);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to upload");
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      const filePreviews = [{
        file: firstFile,
        url: URL.createObjectURL(firstFile),
        imageUrlFromCloudinary: imageUrl
      }];

      setPreviewFiles(filePreviews);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      alert("Failed to upload image.");
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setPreviewFiles([]);
    setCaption('');
  };

  const handleShare = async () => {
    if (!currentUserId) {
      alert("User not logged in.");
      return;
    }
    if (previewFiles.length === 0 || !previewFiles[0].imageUrlFromCloudinary) {
      alert("No image to post.");
      return;
    }
    try {
      const postsRef = collection(db, "posts");
      await addDoc(postsRef, {
        userId: currentUserId,
        username: username,
        imageUrl: previewFiles[0].imageUrlFromCloudinary,
        caption: caption.trim(),
        privacyMode: privacyMode,
        createdAt: serverTimestamp()
      });
      alert("Post shared successfully!");
      setShowConfirmation(false);
      setPreviewFiles([]);
      setCaption('');
      setPrivacyMode('Public');
      navigate('/home');
    } catch (err) {
      console.error("Error creating post document:", err);
      alert("Failed to create post.");
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Sidebar */}
      <Sidebar userPhotoURL={userPhotoURL} currentUserId={currentUserId}/>

      {/* Create Content Area */}
      <div className={styles.createWrapper}>
        {!showConfirmation && (
          <>
            <div className={styles.createHeader}>
              <h2>Create new post</h2>
            </div>
            <div 
              className={styles.createContent} 
              onDragOver={handleDragOver} 
              onDrop={handleDrop}
            >
              <p className={styles.createText}>Drag photos and videos here</p>
              <button className={styles.createButton} onClick={handleSelectFromComputer}>
                Select from computer
              </button>
              <input 
                type="file" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          </>
        )}

        {showConfirmation && previewFiles.length > 0 && (
          <div className={styles.confirmationUI}>
            <div className={styles.confirmationUIHeader}>
              <ArrowBackIosNewIcon className={styles.backIcon} onClick={handleBack} />
              <h2>Create new post</h2>
              <span className={styles.shareLink} onClick={handleShare}>Share</span>
            </div>
            <div className={styles.confirmationUIContent}>
              <div className={styles.confirmationImageContainer}>
                {previewFiles[0].file.type.startsWith('image/') ? (
                  <img src={previewFiles[0].url} alt="Selected" className={styles.confirmationImg}/>
                ) : (
                  <video src={previewFiles[0].url} className={styles.confirmationImg} controls />
                )}
              </div>
              <div className={styles.confirmationSidePanel}>
                <div className={styles.confirmationUserInfo}>
                  <img src={userPhotoURL} alt="User Profile" className={styles.confirmationUserPic} />
                  <span className={styles.confirmationUsername}>{username}</span>
                </div>
                <textarea 
                  className={styles.captionInput} 
                  placeholder="Write a caption..." 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                ></textarea>
                <div className={styles.captionLength}>{caption.length}/2200</div>
                <div className={styles.confirmationOptions}>
                <FormControl fullWidth sx={{ 
                  '& .MuiInputBase-root': { color: 'white' },  // Text inside the input
                  '& .MuiInputLabel-root': { color: 'white' },   // Label color
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } // Outline border color
                }}>
                  <InputLabel id="privacy-mode-label">Privacy</InputLabel>
                  <Select
                    labelId="privacy-mode-label"
                    value={privacyMode}
                    label="Privacy"
                    onChange={(e) => setPrivacyMode(e.target.value)}
                  >
                    <MenuItem value="Public">Public</MenuItem>
                    <MenuItem value="Private">Private</MenuItem>
                    <MenuItem value="Friends Only">Friends Only</MenuItem>
                  </Select>
                </FormControl>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
