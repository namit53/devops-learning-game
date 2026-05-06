document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const errorMsg = document.getElementById('errorMsg');
  const btn = form.querySelector('button');
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;

  const isLoginMode = typeof mode !== 'undefined' && mode === 'login';

  if (!email) {
    errorMsg.textContent = 'Email address is required to proceed.';
    return;
  }
  
  if (!password) {
    errorMsg.textContent = 'Password is required to proceed.';
    return;
  }
  
  if (!isLoginMode && !username) {
    errorMsg.textContent = 'Username is required to proceed.';
    return;
  }
  
  try {
    form.classList.add('loading');
    btn.textContent = 'CONNECTING...';
    errorMsg.textContent = '';
    
    let url = `${window.location.origin}/api/players/register`;
    let body = { username, email, password, age, gender };

    if (isLoginMode) {
      url = `${window.location.origin}/api/players/login`;
      body = { email, password };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Connection failed' }));
      throw new Error(errorData.error || (isLoginMode ? 'Lookup failed.' : 'Registration failed.'));
    }
    
    const data = await response.json();
    
    // Save both the username and email to local storage

    localStorage.setItem('devops_player_username', data.player.username);
    localStorage.setItem('devops_player_email', data.player.email);
    
    btn.textContent = 'ACCESS GRANTED';
    btn.style.color = '#43e08b';
    btn.style.borderColor = '#43e08b';
    
    setTimeout(() => {
      // Redirect them to the Level Hub page to see their progress and launch levels
      window.location.href = 'dashboard.html';
    }, 1000);
    
  } catch (err) {
    console.error(err);
    errorMsg.textContent = err.message || 'Failed to connect to the server.';
    form.classList.remove('loading');
    btn.textContent = isLoginMode ? 'ACCESS CLEARANCE' : 'INITIALIZE';
  }
});
