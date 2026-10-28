/**
 * CivicTrack AI - Project Syntax & Integrity Checker (syntax_check.js)
 * Executes syntax validation on all project JavaScript files using Node.js compiler.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDirs = ['js', 'tests'];
let totalChecked = 0;
let errors = 0;

console.log('\n======================================================');
console.log('CivicTrack AI - Project Syntax Validation Suite');
console.log('======================================================\n');

targetDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relPath = path.relative(path.join(__dirname, '..'), fullPath);
    try {
      execSync(`node -c "${fullPath}"`);
      console.log(`[PASS] ${relPath}`);
      totalChecked++;
    } catch (err) {
      console.error(`[FAIL] ${relPath}: Syntax error`);
      errors++;
    }
  });
});

console.log(`\nSummary: ${totalChecked} files verified. ${errors} syntax errors.\n`);

if (errors > 0) {
  process.exit(1);
} else {
  console.log('All files passed syntax validation successfully.\n');
  process.exit(0);
}
