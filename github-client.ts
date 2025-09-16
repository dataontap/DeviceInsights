import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  try {
    // Check if we have cached valid token
    if (connectionSettings && connectionSettings.settings?.expires_at && 
        new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
      return connectionSettings.settings.access_token;
    }

    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) {
      throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
    }

    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('No Replit identity token found. Make sure GitHub is connected in Replit.');
    }

    console.log('Fetching GitHub connection from Replit...');
    const response = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub connection: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings) {
      throw new Error('GitHub connection not found. Please connect GitHub in Replit settings.');
    }

    // Try different token locations
    const accessToken = connectionSettings.settings?.access_token || 
                       connectionSettings.settings?.oauth?.credentials?.access_token ||
                       connectionSettings.settings?.oauth?.access_token;

    if (!accessToken) {
      console.error('Connection settings:', JSON.stringify(connectionSettings, null, 2));
      throw new Error('GitHub access token not found in connection settings');
    }

    console.log('GitHub access token retrieved successfully');
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}