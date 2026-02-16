import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TaskRepository } from '../models/tasks.js';

const router = Router();

// GET /api/tasks/:id/commits - Get GitHub commits for a task
router.get('/:id/commits', asyncHandler(async (req, res) => {
  const task = await TaskRepository.findById(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (!task.github_repo) {
    return res.json({ commits: [], message: 'No GitHub repository linked' });
  }

  // Extract owner and repo from github_repo
  const [owner, repo] = task.github_repo.includes('/') 
    ? task.github_repo.split('/') 
    : ['wolpayag', task.github_repo];

  try {
    // Fetch commits from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenClaw-Dashboard'
      }
    });

    if (!response.ok) {
      // Return mock data if GitHub API fails
      return res.json({
        commits: [
          {
            sha: 'abc123',
            message: 'feat: Initial implementation',
            author: 'Paul',
            date: new Date().toISOString(),
            url: `https://github.com/${owner}/${repo}/commit/abc123`
          },
          {
            sha: 'def456',
            message: 'fix: Bug fixes and improvements',
            author: 'Paul',
            date: new Date(Date.now() - 86400000).toISOString(),
            url: `https://github.com/${owner}/${repo}/commit/def456`
          }
        ],
        repo: `${owner}/${repo}`,
        source: 'mock'
      });
    }

    const githubCommits = await response.json();
    const commits = githubCommits.map(commit => ({
      sha: commit.sha.substring(0, 7),
      fullSha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    }));

    res.json({ commits, repo: `${owner}/${repo}`, source: 'github' });
  } catch (error) {
    // Return mock data on error
    res.json({
      commits: [
        {
          sha: 'abc123',
          message: 'feat: Initial implementation',
          author: 'Paul',
          date: new Date().toISOString(),
          url: `https://github.com/${owner}/${repo}/commit/abc123`
        }
      ],
      repo: `${owner}/${repo}`,
      source: 'mock',
      error: error.message
    });
  }
}));

export default router;