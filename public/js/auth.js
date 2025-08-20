/**
 * Authentication JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const token = localStorage.getItem('auth_token');
  if (token) {
    // Redirect to main application if on login/register page
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
      window.location.href = 'index.html';
    }
  } else {
    // Redirect to login if trying to access protected pages
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
      window.location.href = 'login.html';
    }
  }
  
  // Check for registration success message
  if (window.location.pathname.includes('login.html') && window.location.search.includes('registered=true')) {
    const successElement = document.getElementById('login-success');
    if (successElement) {
      successElement.textContent = 'Registration successful! Please login with your credentials.';
    }
  }
  
  // Login form handling
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorElement = document.getElementById('login-error');
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          errorElement.textContent = data.error || 'Login failed';
          return;
        }
        
        // Store token and user info
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to main application
        window.location.href = 'index.html';
      } catch (error) {
        errorElement.textContent = 'An error occurred. Please try again.';
        console.error('Login error:', error);
      }
    });
  }
  
  // Registration form handling
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const errorElement = document.getElementById('register-error');
      
      // Validate passwords match
      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          errorElement.textContent = data.error || 'Registration failed';
          return;
        }
        
        // Redirect to login page
        window.location.href = 'login.html?registered=true';
      } catch (error) {
        errorElement.textContent = 'An error occurred. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
});