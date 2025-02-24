import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const CustomDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 12,
    padding: theme.spacing(2),
    backgroundColor: '#f9f9f9',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
}));

const ConfirmDialog = ({ open, title, message, onClose, onConfirm }) => {
  return (
    <CustomDialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 'bold', color: '#333' }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 16, color: '#555' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ padding: '8px 24px' }}>
        <Button onClick={onClose} variant="outlined" color="primary" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus sx={{ textTransform: 'none' }}>
          Delete
        </Button>
      </DialogActions>
    </CustomDialog>
  );
};

export default ConfirmDialog;
