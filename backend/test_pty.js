const pty = require('node-pty');

const ptyProcess = pty.spawn('docker', ['run', '-it', '--rm', 'ubuntu:22.04', 'bash', '-c', `
cat > /usr/local/bin/git <<'EOF'
#!/bin/bash
if [ "$1" = "rebase" ]; then
  echo "Interactive Rebase"
  while true; do
    read -p "> " cmd arg
    if [ "$cmd" = "done" ]; then break; fi
    echo "Got: $cmd $arg"
  done
  echo "Finished"
fi
EOF
chmod +x /usr/local/bin/git
git rebase -i
`], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env
});

ptyProcess.onData((data) => {
  console.log('OUTPUT:', JSON.stringify(data));
});

setTimeout(() => { ptyProcess.write('drop a17c9e4\r'); }, 3000);
setTimeout(() => { ptyProcess.write('done\r'); }, 5000);
setTimeout(() => { process.exit(0); }, 7000);
