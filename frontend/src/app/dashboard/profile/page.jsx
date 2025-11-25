// ===== 8. Enhanced Profile Page with Picture Upload =====
// src/app/dashboard/profile/page.jsx

'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/user/ProfilePage.module.css';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { server } from '@/server/servert';
import { toast } from 'react-toastify';
import { loadUser } from '@/store/actions/auth.action';
import Image from 'next/image';

export default function ProfilePage() {
  const {user} = useSelector((state) => state.user);
  const dispatch = useDispatch()
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    mobile_no: user.mobile_no,
    city: user.city,
    role: user.role,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

// console.log(user)

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${server}/user/profile`, formData , {
        withCredentials: true
      })

      // console.log(res)
      
      if (res.data.success) {
        toast.success(res.data.message);
        setIsEditing(false);
        dispatch(loadUser());
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
     toast.error('Password must be at least 6 characters');
      return;
    }
    

    try {
      const res = await axios.put(`${server}/user/change-password`, {
        currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
      }, {
        withCredentials: true
      })
      
      if (res.data.message) {
        toast.success(res.data.message);
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response.data.message);
    }
  };
// console.log(user)


  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file'); // Use toast instead of alert
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size should be less than 5MB'); // Use toast instead of alert
    return;
  }

  setUploadingImage(true);

  try {
    const formData = new FormData();
    formData.append('profilePicture', file); // Must match multer field name

    const res = await axios.post(`${server}/user/profile-picture`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data' // Important for file upload
      }
    });

    // console.log(res);
    
    if (res.data.success) {
      toast.success(res.data.message);
      dispatch(loadUser()); // Refresh user data
    } else {
      toast.error(res.data.error || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error.response?.data?.error || 'Failed to upload image');
  } finally {
    setUploadingImage(false);
  }
};


  if (!user) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <Image
              src={user?.profile_picture || '/placeholder-avatar.png'} 
              alt="Profile" 
              className={styles.avatar}
              width={50}
              height={50}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={styles.changePhotoBtn}
              disabled={uploadingImage}
            >
              {uploadingImage ? '⏳' : '📷'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className={styles.userInfo}>
            <h1>{user?.first_name} {user?.last_name}</h1>
            <p className={styles.role}>{user?.role}</p>
            <p className={styles.email}>{user?.email}</p>
          </div>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.formCard}>
            <h2>Edit Profile Information</h2>
            
            <div className={styles.row}>
              <div className={styles.group}>
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.group}>
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className={styles.group}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.group}>
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile_no || ''}
                  onChange={(e) => setFormData({...formData, mobile_no: e.target.value})}
                  required
                />
              </div>
              <div className={styles.group}>
                <label>City *</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className={styles.group}>
              <label>Role</label>
              <select
                value={formData.role || 'student'}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
                <option value="technician">Technician</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className={styles.profileDetails}>
          <div className={styles.detailCard}>
            <h2>Profile Information</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Mobile Number</label>
                <p>{user?.mobile_no}</p>
              </div>
              <div className={styles.detailItem}>
                <label>City</label>
                <p>{user?.city}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Role</label>
                <p className={styles.roleBadge}>{user?.role}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Member Since</label>
                <p>{new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Last Updated</label>
                <p>{new Date(user?.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h2>Security</h2>
            <p className={styles.securityText}>Keep your account secure by using a strong password</p>
            <button onClick={() => setShowPasswordModal(true)} className={styles.changePasswordBtn}>
              🔒 Change Password
            </button>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              <div className={styles.group}>
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>

              <div className={styles.group}>
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength="6"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className={styles.group}>
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength="6"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}