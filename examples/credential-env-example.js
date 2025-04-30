// Example of using credential management with environment variables
const { WorkflowManager } = require('../dist');
require('dotenv').config();

/**
 * Example of using the n8n-tdd-framework with environment variable credentials
 */
async function main() {
  try {
    console.log('n8n Credential Management Example');
    console.log('----------------------------------');
    
    // Create a workflow manager
    const manager = new WorkflowManager();
    
    // Connect to n8n
    await manager.connect();
    
    // List all credentials from environment variables
    const envCredentials = manager.listCredentialsFromEnv();
    console.log(`Found ${envCredentials.length} credential(s) in environment variables:`);
    
    envCredentials.forEach(cred => {
      console.log(`- ${cred.name} (${cred.type})`);
    });
    
    // Check if a specific credential exists
    const apiCredName = 'API';
    if (manager.hasCredentialInEnv(apiCredName)) {
      console.log(`\nFound ${apiCredName} credential in environment variables`);
      
      // Create the credential in n8n
      try {
        const credential = await manager.createCredentialFromEnv(apiCredName);
        console.log(`Created credential with ID: ${credential.id}`);
        
        // Clean up - delete the credential
        await manager.deleteCredential(credential.id);
        console.log(`Deleted credential with ID: ${credential.id}`);
      } catch (error) {
        console.error(`Error creating credential: ${error.message}`);
      }
    } else {
      console.log(`\n${apiCredName} credential not found in environment variables`);
      console.log('Make sure you have defined the following environment variables:');
      console.log(`N8N_CREDENTIAL_${apiCredName}_TYPE=httpBasicAuth`);
      console.log(`N8N_CREDENTIAL_${apiCredName}_USERNAME=your-username`);
      console.log(`N8N_CREDENTIAL_${apiCredName}_PASSWORD=your-password`);
    }
    
    // Disconnect from n8n
    await manager.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
