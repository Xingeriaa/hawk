import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase'; // Adjust path if needed
import styles from './Comment.module.css';

/**
 * Helper to convert Firestore Timestamp or Date string to "5m", "2h", "3d" format.
 * Adjust logic as needed if you store createdAt differently.
 */
function getRelativeTime(createdAt) {
  if (!createdAt) return '';
  
  // If Firestore returns a Timestamp object, convert it:
  // createdAt = createdAt.toDate() // if needed
  const now = new Date();
  const posted = new Date(createdAt);
  const diffMs = now - posted;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

/**
 * A fully functional Comment component that:
 * 1. Fetches comments from `posts/{postId}/comments`.
 * 2. Displays them in a list.
 * 3. Allows adding new comments if `currentUser` is provided.
 */
export default function Comment({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // 1. Fetch existing comments from Firestore subcollection
  useEffect(() => {
    async function fetchComments() {
      if (!postId) return;
      try {
        // Reference to the subcollection: posts/{postId}/comments
        const commentsRef = collection(db, 'posts', postId, 'comments');
        // Example: order by 'createAt' ascending
        const q = query(commentsRef, orderBy('createAt', 'asc'));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setComments(fetched);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }

    fetchComments();
  }, [postId]);

  // 2. Add a new comment
  async function handleAddComment() {
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert('You must be logged in to comment.');
      return;
    }

    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, {
        userId: currentUser.uid, // or store displayName if you have it
        userPhotoURL: currentUser.photoURL || '/src/assets/DefaultProfilePic/Default.jpg',
        value: newComment.trim(),
        createAt: serverTimestamp(),
        likeCount: 0,
      });

      setNewComment('');

      // Re-fetch the comments or use real-time approach with onSnapshot
      const q = query(commentsRef, orderBy('createAt', 'asc'));
      const snapshot = await getDocs(q);
      const updated = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComments(updated);

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  return (
    <div className={styles.commentSection}>
      {/* Display existing comments */}
      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <p className={styles.noComment}>No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div className={styles.commentItem} key={comment.id}>
              <img
                className={styles.commentAvatar}
                src={comment.userPhotoURL || '/src/assets/DefaultProfilePic/Default.jpg'}
                alt="Avatar"
              />
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>
                    {comment.userId || 'Unknown User'}
                  </span>
                  <span className={styles.commentTime}>
                    {getRelativeTime(comment.createAt)}
                  </span>
                </div>
                <div className={styles.commentText}>
                  {comment.value}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment input box */}
      <div className={styles.commentForm}>
        <textarea
          className={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          className={styles.commentButton}
          onClick={handleAddComment}
        >
          Post
        </button>
      </div>
    </div>
  );
}

Comment.propTypes = {
  // The doc ID of the post whose comments we want
  postId: PropTypes.string.isRequired,
  // The currently logged in user (if any)
  currentUser: PropTypes.shape({
    uid: PropTypes.string,
    photoURL: PropTypes.string,
  }),
};
