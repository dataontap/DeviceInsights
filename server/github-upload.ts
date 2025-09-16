import { getUncachableGitHubClient } from '../github-client';
import fs from 'fs';
import path from 'path';

interface GitHubUploadOptions {
  owner: string;
  repo: string;
  branch?: string;
  commitMessage?: string;
  filesToUpload?: string[];
}

export class GitHubUploader {
  private options: GitHubUploadOptions;

  constructor(options: GitHubUploadOptions) {
    this.options = {
      branch: 'main',
      commitMessage: `Automated upload - ${new Date().toISOString()}`,
      filesToUpload: [],
      ...options
    };
  }

  async uploadFiles(): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      console.log('Starting GitHub upload process...');
      const github = await getUncachableGitHubClient();
      
      // Get current user info
      const { data: user } = await github.rest.users.getAuthenticated();
      console.log(`✅ Authenticated as: ${user.login}`);

      // Check if target repository exists or create it
      let targetRepo;
      try {
        const { data: repo } = await github.rest.repos.get({
          owner: this.options.owner,
          repo: this.options.repo
        });
        targetRepo = repo;
        console.log(`✅ Target repository found: ${targetRepo.full_name}`);
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`Repository ${this.options.owner}/${this.options.repo} not found, creating it...`);
          try {
            const { data: newRepo } = await github.rest.repos.createForAuthenticatedUser({
              name: this.options.repo,
              description: '🌍🎙️ DOTM Device Insights Platform - AI-powered IMEI compatibility checker with 30+ languages support and ElevenLabs voice synthesis',
              private: false,
              auto_init: true
            });
            targetRepo = newRepo;
            console.log(`✅ Repository created: ${targetRepo.full_name}`);
          } catch (createError: any) {
            return {
              success: false,
              message: `Failed to create repository: ${createError.message}`
            };
          }
        } else {
          throw error;
        }
      }

      // Get current commit SHA for the branch
      let currentCommitSha;
      try {
        const { data: branch } = await github.rest.repos.getBranch({
          owner: this.options.owner,
          repo: this.options.repo,
          branch: this.options.branch!
        });
        currentCommitSha = branch.commit.sha;
      } catch (error: any) {
        if (error.status === 404) {
          // Branch doesn't exist, get default branch
          const { data: repo } = await github.rest.repos.get({
            owner: this.options.owner,
            repo: this.options.repo
          });
          const { data: defaultBranch } = await github.rest.repos.getBranch({
            owner: this.options.owner,
            repo: this.options.repo,
            branch: repo.default_branch
          });
          currentCommitSha = defaultBranch.commit.sha;
        } else {
          throw error;
        }
      }

      console.log(`Current commit SHA: ${currentCommitSha}`);

      // Create tree with files to upload
      const tree = [];
      
      // Enhanced file selection
      const filesToProcess = this.options.filesToUpload!.length > 0 
        ? this.options.filesToUpload! 
        : [
            'README.md',
            'package.json', 
            'API_DOCUMENTATION.md',
            'CONTRIBUTING.md',
            'LICENSE',
            '.gitignore',
            '.env.example'
          ];

      for (const filePath of filesToProcess) {
        try {
          const fullPath = path.resolve(filePath);
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            tree.push({
              path: filePath,
              mode: '100644' as const,
              type: 'blob' as const,
              content: content
            });
            
            console.log(`✅ Added file to upload: ${filePath} (${content.length} chars)`);
          } else {
            console.warn(`⚠️ File not found: ${filePath}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not read file ${filePath}:`, error);
        }
      }

      if (tree.length === 0) {
        return {
          success: false,
          message: 'No files were prepared for upload. Check if files exist.'
        };
      }

      console.log(`📦 Uploading ${tree.length} files...`);

      // Create new tree
      const { data: newTree } = await github.rest.git.createTree({
        owner: this.options.owner,
        repo: this.options.repo,
        tree: tree,
        base_tree: currentCommitSha
      });

      console.log(`✅ Tree created: ${newTree.sha}`);

      // Create new commit
      const { data: newCommit } = await github.rest.git.createCommit({
        owner: this.options.owner,
        repo: this.options.repo,
        message: this.options.commitMessage!,
        tree: newTree.sha,
        parents: [currentCommitSha]
      });

      console.log(`✅ Commit created: ${newCommit.sha}`);

      // Update branch reference
      await github.rest.git.updateRef({
        owner: this.options.owner,
        repo: this.options.repo,
        ref: `heads/${this.options.branch}`,
        sha: newCommit.sha
      });

      console.log(`✅ Branch updated successfully`);

      return {
        success: true,
        message: `🎉 Successfully uploaded ${tree.length} files to ${this.options.owner}/${this.options.repo}`,
        url: `https://github.com/${this.options.owner}/${this.options.repo}/commit/${newCommit.sha}`
      };

    } catch (error: any) {
      console.error('❌ GitHub upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error.message || 'Unknown error'}. Check console for details.`
      };
    }
  }

  async listRepositories(): Promise<any[]> {
    try {
      const github = await getUncachableGitHubClient();
      const { data: repos } = await github.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 50
      });
      return repos;
    } catch (error) {
      console.error('Error listing repositories:', error);
      return [];
    }
  }

  async checkAccess(): Promise<{ authenticated: boolean; user?: any; repos?: number }> {
    try {
      const github = await getUncachableGitHubClient();
      const { data: user } = await github.rest.users.getAuthenticated();
      const { data: repos } = await github.rest.repos.listForAuthenticatedUser({
        per_page: 1
      });
      
      return {
        authenticated: true,
        user: {
          login: user.login,
          name: user.name,
          email: user.email
        },
        repos: repos.length
      };
    } catch (error) {
      return { authenticated: false };
    }
  }
}

// Test function for manual testing
export async function testGitHubUpload() {
  console.log('Testing GitHub integration...');
  
  const uploader = new GitHubUploader({
    owner: 'your-github-username', // Replace with actual username
    repo: 'dotm-device-checker',    // Replace with actual repo name
    commitMessage: `Test automated upload - ${new Date().toLocaleDateString()}`,
    filesToUpload: ['README.md'] // Start with just README
  });

  // First, check access
  const access = await uploader.checkAccess();
  console.log('GitHub Access Check:', access);

  if (!access.authenticated) {
    console.log('GitHub authentication failed');
    return false;
  }

  // List available repositories
  const repos = await uploader.listRepositories();
  console.log(`Found ${repos.length} repositories`);

  // For safety, let's not automatically upload - just test the connection
  console.log('GitHub integration test completed successfully');
  return true;
}