const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const run = (cmd, cwd = root) => execSync(cmd, { stdio: 'inherit', cwd });

// 1. Bump version
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;
pkg.version = newVersion;
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log(`\n✓ Version bumped to ${newVersion}\n`);

// 2. Update version in browser-ui/package.json and chrome-extension/package.json
for (const sub of ['browser-ui', 'chrome-extension']) {
  const subPkg = path.join(root, sub, 'package.json');
  if (fs.existsSync(subPkg)) {
    const json = JSON.parse(fs.readFileSync(subPkg, 'utf-8'));
    if (json.dependencies && json.dependencies['woolball-client']) {
      json.dependencies['woolball-client'] = 'file:..';
    }
    fs.writeFileSync(subPkg, JSON.stringify(json, null, 2) + '\n');
    console.log(`✓ ${sub}/package.json updated\n`);
  }
}

// 3. Bump chrome extension manifest version
const manifestPath = path.join(root, 'chrome-extension', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const [mMajor, mMinor, mPatch] = manifest.version.split('.').map(Number);
  manifest.version = `${mMajor}.${mMinor}.${mPatch + 1}`;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✓ Chrome extension manifest bumped to ${manifest.version}\n`);
}

// 4. Build worker (esbuild bundle → worker-string.ts)
console.log('── Building worker ──');
run('node scripts/build-worker.js');
console.log('✓ Worker built\n');

// 4. Build lib (tsc)
console.log('── Building lib (tsc) ──');
run('npx --yes tsc');
console.log('✓ Lib built\n');

// 5. Build browser bundle (esbuild → woolball.js)
console.log('── Building browser bundle ──');
run('node scripts/build-lib.js');
console.log('✓ Browser bundle built\n');

// 6. Build browser-ui
console.log('── Building browser-ui ──');
run('npm run build', path.join(root, 'browser-ui'));
console.log('✓ browser-ui built\n');

// 7. Build chrome extension
console.log('── Building chrome extension ──');
const extDir = path.join(root, 'chrome-extension');
if (fs.existsSync(path.join(extDir, 'package.json'))) {
  run('npm install --ignore-scripts', extDir);
  run('npx --yes webpack --mode production', extDir);
  console.log('✓ Chrome extension built\n');
} else {
  console.log('⊘ Chrome extension not found, skipping\n');
}

// 8. Publish to npm
console.log('── Publishing to npm ──');
run('npm publish --auth-type=web');
console.log(`\n✓ woolball-client@${newVersion} published\n`);
