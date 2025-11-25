export const validateRegistration = (formData) => {
  const errors = {};

  // First Name
  if (!formData.first_name || !formData.first_name.trim()) {
    errors.first_name = 'First name is required';
  } else if (formData.first_name.length < 2) {
    errors.first_name = 'First name must be at least 2 characters';
  }

  // Last Name
  if (!formData.last_name || !formData.last_name.trim()) {
    errors.last_name = 'Last name is required';
  } else if (formData.last_name.length < 2) {
    errors.last_name = 'Last name must be at least 2 characters';
  }

  // Email
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }

  // Password
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
    errors.password = 'Password must contain uppercase and lowercase letters';
  }

  // Confirm Password
  if (!formData.confirm_password) {
    errors.confirm_password = 'Please confirm your password';
  } else if (formData.password !== formData.confirm_password) {
    errors.confirm_password = 'Passwords do not match';
  }

  // Mobile Number
  if (!formData.mobile_no || !formData.mobile_no.trim()) {
    errors.mobile_no = 'Mobile number is required';
  } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.mobile_no)) {
    errors.mobile_no = 'Invalid mobile number format';
  }

  // City
  if (!formData.city || !formData.city.trim()) {
    errors.city = 'City is required';
  } else if (formData.city.length < 2) {
    errors.city = 'City name must be at least 2 characters';
  }

  return errors;
};

export const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6 && /(?=.*[a-z])(?=.*[A-Z])/.test(password);
};

export const validatePhone = (phone) => {
  return /^[\d\s\-\+\(\)]+$/.test(phone);
};