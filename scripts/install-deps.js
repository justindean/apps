import { execSync } from 'child_process';

console.log('Installing dependencies with pnpm...');
try {
  execSync('pnpm install', {
    cwd: '/vercel/share/v0-project',
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  console.log('Dependencies installed successfully');
} catch (e) {
  console.error('pnpm install failed, trying npm...');
  try {
    execSync('npm install', {
      cwd: '/vercel/share/v0-project',
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    console.log('Dependencies installed with npm');
  } catch (e2) {
    console.error('npm install also failed:', e2.message);
  }
}

// Verify vite is installed
try {
  const vitePath = execSync('ls -la node_modules/.bin/vite 2>/dev/null || echo "NOT FOUND"', {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf-8'
  });
  console.log('Vite binary:', vitePath.trim());

  const viteVersion = execSync('node_modules/.bin/vite --version 2>/dev/null || echo "FAILED"', {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf-8'
  });
  console.log('Vite version:', viteVersion.trim());
} catch (e) {
  console.error('Verification failed:', e.message);
}
