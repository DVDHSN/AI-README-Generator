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

export const createGitignoreFilter = (content: string): ((path: string) => boolean) => {
    const rules = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(rule => rule.endsWith('/') ? rule.slice(0, -1) : rule)
        .map(rule => rule.startsWith('/') ? rule.substring(1) : rule) // Remove leading slashes
        .filter(Boolean);
        
    return (path: string): boolean => {
        const segments = path.split('/');
        // Check for direct directory match or if any segment is a filename match
        return rules.some(rule => {
            // "node_modules" should match "node_modules/file.js"
            if (path.startsWith(rule)) return true;
            // "file.js" should match "src/file.js"
            return segments.includes(rule);
        });
    };
};

export const isFileRelevant = (
    path: string, 
    size: number, 
    gitignoreFilter: (path: string) => boolean,
    hasGitignore: boolean
): boolean => {
    if (size > MAX_FILE_SIZE || size === 0) {
        return false;
    }

    // Rule 1: Apply .gitignore rules if parsed
    if (gitignoreFilter(path)) {
        return false;
    }

    const pathParts = path.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Rule 2: Apply hardcoded excludes
    if (EXCLUDED_FILENAMES.has(filename)) return false;
    if (!hasGitignore && pathParts.some(part => EXCLUDED_DIRECTORIES.has(part))) return false;

    // Rule 3: Keep only relevant files based on name/extension
    const extension = filename.split('.').pop()?.toLowerCase() ?? '';
    return RELEVANT_FILENAMES.has(filename) || RELEVANT_EXTENSIONS.has(extension);
};