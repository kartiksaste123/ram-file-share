const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Checking build process...');

// Check if client directory exists
const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
  console.error('Client directory does not exist!');
  process.exit(1);
}

console.log('Client directory exists.');

// Check if package.json exists in client directory
const clientPackageJson = path.join(clientDir, 'package.json');
if (!fs.existsSync(clientPackageJson)) {
  console.error('package.json does not exist in client directory!');
  process.exit(1);
}

console.log('package.json exists in client directory.');

// Try to install dependencies
console.log('Installing dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully.');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

// Try to build the client
console.log('Building client...');
try {
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('Client built successfully.');
} catch (error) {
  console.error('Error building client:', error.message);
  process.exit(1);
}

// Check if build directory exists
const buildDir = path.join(clientDir, 'build');
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist after build!');
  process.exit(1);
}

console.log('Build directory exists.');

// List contents of build directory
console.log('Contents of build directory:');
const files = fs.readdirSync(buildDir);
files.forEach(file => {
  console.log(`- ${file}`);
});

console.log('Build process completed successfully!'); 