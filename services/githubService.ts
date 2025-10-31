const RELEVANT_EXTENSIONS = new Set([
  // Source code
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs', 'cs', 'php', 'rb', 'swift', 'kt', 'kts',
  'c', 'cpp', 'h', 'hpp', 'm', 'mm',
  // Web
  'html', 'css', 'scss', 'less', 'vue', 'svelte',
  // Config
  'json', 'yaml', 'yml', 'toml', 'xml', 'env', 'ini', 'cfg',
  // Scripts
  'sh', 'bash', 'ps1',
  // Docs
  'md', 'mdx', 'txt',
  // Data
  'sql',
  // Other
  'dockerfile', 'gitignore',
]);

const RELEVANT_FILENAMES = new Set([
  'package.json', 'composer.json', 'pom.xml', 'build.gradle', 'requirements.txt', 'gemfile',
  'dockerfile', 'docker-compose.yml', 'vite.config.js', 'vite.config.ts', 'webpack.config.js',
  'tailwind.config.js', 'next.config.js', 'remix.config.js', 'tsconfig.json', 'pyproject.toml',
  'cargo.toml', 'go.mod', 'readme.md',
]);

const EXCLUDED_DIRECTORIES = new Set([
  'node_modules', 'vendor', 'dist', 'build', 'target', '.git', '.vscode', '.idea',
  '__pycache__', 'env', 'venv', 'public', 'assets',
]);

const EXCLUDED_FILENAMES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock',
]);

const MAX_FILE_SIZE = 100 * 1024; // 100KB
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

export const getRepoContent = async (repoUrl: string): Promise<string> => {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL.');
  }
  const { owner, repo } = parsed;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };

  // 1. Get default branch
  const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoInfoRes.ok) {
    if (repoInfoRes.status === 404) throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
    if (repoInfoRes.status === 403) throw new Error('GitHub API rate limit exceeded. Please wait a bit and try again.');
    throw new Error(`Failed to fetch repository info. Status: ${repoInfoRes.status}`);
  }
  const repoData = await repoInfoRes.json();
  const defaultBranch = repoData.default_branch;

  // 2. Get file tree
  const treeInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
   if (!treeInfoRes.ok) {
    throw new Error(`Failed to fetch repository file tree. Status: ${treeInfoRes.status}`);
  }
  const treeData = await treeInfoRes.json();

  if (treeData.truncated) {
    console.warn('Repository file tree is truncated. Some files may be missing from the analysis.');
  }

  // 3. Filter files
  const filesToFetch = treeData.tree
    .filter((file: any) => {
      if (file.type !== 'blob' || file.size > MAX_FILE_SIZE || file.size === 0) {
        return false;
      }
      const pathParts = file.path.split('/');
      const filename = pathParts[pathParts.length - 1];
      const extension = filename.split('.').pop()?.toLowerCase() ?? '';
      
      if (EXCLUDED_FILENAMES.has(filename) || pathParts.some(part => EXCLUDED_DIRECTORIES.has(part))) {
        return false;
      }

      return RELEVANT_FILENAMES.has(filename) || RELEVANT_EXTENSIONS.has(extension);
    });
  
  // 4. Fetch file contents in parallel
  let totalContentSize = 0;
  const fileContentPromises = filesToFetch.map(async (file: any) => {
    try {
      const fileInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`, { headers });
      if (!fileInfoRes.ok) {
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
  
  const finalContents: {path: string, content: string}[] = [];
  for (const file of resolvedContents) {
      if (totalContentSize + file.content.length > MAX_TOTAL_CONTENT_SIZE) {
          console.warn("Reached maximum total content size. Skipping remaining files.");
          break;
      }
      finalContents.push(file);
      totalContentSize += file.content.length;
  }
  
  // 5. Format into a single string
  if (finalContents.length === 0) {
      throw new Error("Could not find any relevant files to analyze in the repository. Please make sure the repository is not empty and contains supported file types.");
  }
  
  return finalContents
    .map(file => `// File: ${file.path}\n\n${file.content}\n\n---\n\n`)
    .join('');
};