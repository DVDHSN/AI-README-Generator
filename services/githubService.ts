import { isFileRelevant, createGitignoreFilter } from './fileFilterService';

const MAX_TOTAL_CONTENT_SIZE = 1.5 * 1024 * 1024; // 1.5MB to stay safely within context limits

const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;
    const parts = urlObj.pathname.split('/').filter(p => p);
    if (parts.length < 2) return null;
    const repo = parts[1].replace(/\.git$/, '');
    return { owner: parts[0], repo: repo };
  } catch (e) {
    return null;
  }
};

const handleFetchError = (res: Response, context: string): void => {
    if (res.status === 404) throw new Error(`${context}: Repository not found. Please check the URL. If it's a private repository, provide a Personal Access Token.`);
    if (res.status === 401) throw new Error(`${context}: Invalid Personal Access Token. Please check your token and its permissions.`);
    if (res.status === 403) {
        const rateLimitReset = res.headers.get('x-ratelimit-reset');
        if (rateLimitReset) {
          const resetTime = new Date(parseInt(rateLimitReset, 10) * 1000);
          const now = new Date();
          const minutesToWait = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);
          const waitMessage = minutesToWait > 0 ? `Please try again in about ${minutesToWait} minute(s).` : 'Please try again shortly.';
          throw new Error(`${context}: GitHub API rate limit exceeded. ${waitMessage} Using a PAT can increase your rate limit.`);
        }
        throw new Error(`${context}: GitHub API rate limit exceeded or access forbidden. For private repos, a PAT with 'repo' scope is required.`);
    }
    throw new Error(`${context}: Failed to fetch data from GitHub. Status: ${res.status}`);
};

export const getRepoContent = async (
  repoUrl: string, 
  token?: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL.');
  }
  const { owner, repo } = parsed;

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Get default branch
  onProgress?.('Step 1/5: Fetching repository info...');
  const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoInfoRes.ok) handleFetchError(repoInfoRes, 'Fetching repository info');
  
  const repoData = await repoInfoRes.json();
  const defaultBranch = repoData.default_branch;

  // 2. Fetch and parse .gitignore and file tree
  onProgress?.('Step 2/5: Analyzing repository structure...');
  let isPathIgnored = (path: string) => false;
  let gitignoreParsed = false;
  try {
      const gitignoreRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.gitignore?ref=${defaultBranch}`, { headers });
      if (gitignoreRes.ok) {
          const gitignoreData = await gitignoreRes.json();
          if (gitignoreData.content) {
              const gitignoreContent = atob(gitignoreData.content);
              isPathIgnored = createGitignoreFilter(gitignoreContent);
              gitignoreParsed = true;
          }
      }
  } catch (e) {
      console.warn("Could not fetch or parse .gitignore. Falling back to default excludes.", e);
  }

  const treeInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
  if (!treeInfoRes.ok) handleFetchError(treeInfoRes, 'Fetching file tree');
  
  const treeData = await treeInfoRes.json();
  if (treeData.truncated) {
    console.warn('Repository file tree is truncated. Some files may be missing from the analysis.');
  }

  // 3. Filter files
  onProgress?.('Step 3/5: Identifying relevant files...');
  const filesToFetch = treeData.tree
    .filter((file: any) => 
        file.type === 'blob' && isFileRelevant(file.path, file.size, isPathIgnored, gitignoreParsed)
    );
  
  // 4. Fetch file contents in parallel
  onProgress?.(`Step 4/5: Fetching content of ${filesToFetch.length} files...`);
  let totalContentSize = 0;
  const fileContentPromises = filesToFetch.map(async (file: any) => {
    try {
      const fileInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`, { headers });
      if (!fileInfoRes.ok) {
        // Don't fail all for one file, but log the warning
        console.warn(`Could not fetch file blob: ${file.path}. Status: ${fileInfoRes.status}`);
        return null;
      }
      const fileData = await fileInfoRes.json();
      if (fileData.encoding === 'base64') {
          const content = atob(fileData.content);
          return { path: file.path, content };
      }
      return null;
    } catch (error) {
        console.warn(`Error fetching file content for ${file.path}:`, error);
        return null;
    }
  });

  const resolvedContents = (await Promise.all(fileContentPromises)).filter(Boolean) as { path: string; content: string }[];
  
  // 5. Assemble content
  onProgress?.('Step 5/5: Assembling context for AI...');
  const finalContents: {path: string, content: string}[] = [];
  for (const file of resolvedContents) {
      if (totalContentSize + file.content.length > MAX_TOTAL_CONTENT_SIZE) {
          console.warn("Reached maximum total content size. Skipping remaining files.");
          break;
      }
      finalContents.push(file);
      totalContentSize += file.content.length;
  }
  
  // 6. Format into a single string
  if (finalContents.length === 0) {
      throw new Error("Could not find any relevant files to analyze in the repository. Please check the repo, your token permissions, and the file types.");
  }
  
  return finalContents
    .map(file => `// File: ${file.path}\n\n${file.content}\n\n---\n\n`)
    .join('');
};