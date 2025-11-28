#!/usr/bin/env node
// build/generate-credentials.js
// This script generates credentials.js at build time using environment variables.
// It is called by the build pipeline and creates a secure, dynamic credentials file.

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not set. ' +
    'credentials.js may be incomplete. Ensure these are set in your build environment.'
  );
}

const credentialsContent = `// Auto-generated at build time from environment variables.
// Do NOT commit this file to version control.

window.SUPABASE_URL = '${supabaseUrl}';
window.SUPABASE_ANON_KEY = '${supabaseAnonKey}';
`;

// Write credentials.js to the project root (where index.html is).
const outputPath = path.join(__dirname, '..', 'credentials.js');

try {
  fs.writeFileSync(outputPath, credentialsContent, { encoding: 'utf8' });
  console.log(`✓ Generated credentials.js at ${outputPath}`);
} catch (err) {
  console.error(`✗ Failed to write credentials.js: ${err.message}`);
  process.exit(1);
}
