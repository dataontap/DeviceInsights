
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const sql = neon(process.env.DATABASE_URL);

async function updateApiKeys() {
  try {
    console.log('Updating API keys with new email addresses...');
    
    // Get all API keys ordered by ID
    const existingKeys = await sql`
      SELECT id, email, name 
      FROM api_keys 
      ORDER BY id 
      LIMIT 3
    `;
    
    console.log('Found existing keys:', existingKeys);
    
    if (existingKeys.length < 3) {
      console.error(`Only found ${existingKeys.length} API keys, need at least 3`);
      return;
    }
    
    // Update key #1 to rbm@dotmobile.app
    await sql`
      UPDATE api_keys 
      SET email = 'rbm@dotmobile.app', name = 'RBM DotMobile'
      WHERE id = ${existingKeys[0].id}
    `;
    console.log(`Updated key #1 (ID: ${existingKeys[0].id}) to rbm@dotmobile.app`);
    
    // Update key #2 to aa@dotmobile.app
    await sql`
      UPDATE api_keys 
      SET email = 'aa@dotmobile.app', name = 'AA DotMobile'
      WHERE id = ${existingKeys[1].id}
    `;
    console.log(`Updated key #2 (ID: ${existingKeys[1].id}) to aa@dotmobile.app`);
    
    // Update key #3 to aakstinas@oxio.io
    await sql`
      UPDATE api_keys 
      SET email = 'aakstinas@oxio.io', name = 'Aakstinas OXIO'
      WHERE id = ${existingKeys[2].id}
    `;
    console.log(`Updated key #3 (ID: ${existingKeys[2].id}) to aakstinas@oxio.io`);
    
    // Verify updates
    const updatedKeys = await sql`
      SELECT id, email, name, created_at 
      FROM api_keys 
      ORDER BY id 
      LIMIT 3
    `;
    
    console.log('\nUpdated API keys:');
    updatedKeys.forEach((key, index) => {
      console.log(`#${index + 1}: ${key.email} (${key.name}) - ID: ${key.id}`);
    });
    
    console.log('\nAPI keys updated successfully!');
    
  } catch (error) {
    console.error('Error updating API keys:', error);
  }
}

updateApiKeys();
