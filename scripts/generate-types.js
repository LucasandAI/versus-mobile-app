// This script can be used to regenerate the Supabase types after database changes
// You'll need to run this manually using Node.js after any database schema updates

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get Supabase project configuration
const configPath = path.join(__dirname, '..', 'supabase', 'config.toml');
if (!fs.existsSync(configPath)) {
  console.error('Error: supabase/config.toml not found');
  process.exit(1);
}

const configContent = fs.readFileSync(configPath, 'utf8');
const projectIdMatch = configContent.match(/project_id\s*=\s*"([^"]+)"/);

if (!projectIdMatch) {
  console.error('Error: Could not find project_id in config.toml');
  process.exit(1);
}

const projectId = projectIdMatch[1];

console.log(`Generating types for Supabase project: ${projectId}`);
console.log('This requires the Supabase CLI to be installed.');

// Command to generate types
const command = `npx supabase gen types typescript --project-id ${projectId} > src/integrations/supabase/types.ts`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
    return;
  }
  
  console.log(`Types generated successfully!`);
  console.log('Types written to src/integrations/supabase/types.ts');
});
