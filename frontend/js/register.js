document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const errorMsg = document.getElementById('errorMsg');
  const btn = form.querySelector('button');
  
  const username = document.getElementById('username').value.trim();
  const age = document.getElementById('age').value;
  const gender = document.getElementById('gender').value;
  
  if (!username) {
    errorMsg.textContent = 'Username is required to proceed.';
    return;
  }
  
  try {
    form.classList.add('loading');
    btn.textContent = 'CONNECTING...';
    errorMsg.textContent = '';
    
    const response = await fetch('http://localhost:3000/api/players/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, age, gender })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed. Is the backend running?');
    }
    
    const data = await response.json();
    
    // Save to local storage for the game logic to know who is playing
    localStorage.setItem('devops_player_username', data.player.username);
    
    btn.textContent = 'ACCESS GRANTED';
    btn.style.color = '#43e08b';
    btn.style.borderColor = '#43e08b';
    
    setTimeout(() => {
      window.location.href = 'crawl.html';
    }, 1000);
    
  } catch (err) {
    console.error(err);
    errorMsg.textContent = err.message || 'Failed to connect to the server.';
    form.classList.remove('loading');
    btn.textContent = 'INITIALIZE';
  }
});
