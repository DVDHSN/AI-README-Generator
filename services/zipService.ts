// Fix: Import JSZipObject for explicit typing.
import JSZip, { JSZipObject } from 'jszip';
import { isFileRelevant, createGitignoreFilter } from './fileFilterService';

const MAX_TOTAL_CONTENT_SIZE = 1.5 * 1024 * 1024; // 1.5MB

export const getZipContent = async (
  zipFile: File,
  onProgress?: (message: string) => void
): Promise<string> => {
  onProgress?.('Step 1/5: Unzipping repository archive...');
  const zip = await JSZip.loadAsync(zipFile);

  onProgress?.('Step 2/5: Analyzing repository structure...');
  let isPathIgnored = (path: string) => false;
  let gitignoreParsed = false;
  // Fix: Explicitly type 'file' as JSZipObject. This resolves multiple errors where properties
  // like 'name', 'dir', and 'async' were being accessed on an 'unknown' type.
  const gitignoreFile = Object.values(zip.files).find((file: JSZipObject) => file.name.endsWith('.gitignore'));

  if (gitignoreFile && !gitignoreFile.dir) {
    try {
      const gitignoreContent = await gitignoreFile.async('string');
      isPathIgnored = createGitignoreFilter(gitignoreContent);
      gitignoreParsed = true;
    } catch (e) {
      console.warn("Could not parse .gitignore from ZIP. Falling back to default excludes.", e);
    }
  }

  onProgress?.('Step 3/5: Identifying relevant files...');
  // Fix: Explicitly type 'file' as JSZipObject. This resolves multiple errors where properties
  // like '_data', 'dir', and 'name' were being accessed on an 'unknown' type.
  const filesToProcess = Object.values(zip.files)
    .filter((file: JSZipObject) => {
      // isFileRelevant expects size in bytes. We estimate from string length.
      // This is an approximation, but sufficient for this filtering step.
      const estimatedSize = file._data.uncompressedSize || 0;
      return !file.dir && isFileRelevant(file.name, estimatedSize, isPathIgnored, gitignoreParsed);
    });

  onProgress?.(`Step 4/5: Reading content of ${filesToProcess.length} files...`);
  let totalContentSize = 0;
  const fileContents: { path: string; content: string }[] = [];

  for (const file of filesToProcess) {
    try {
      const content = await file.async('string');
      // Skip binary files that might have been misidentified
      if (content.includes('\uFFFD')) {
          continue;
      }
      if (totalContentSize + content.length <= MAX_TOTAL_CONTENT_SIZE) {
        fileContents.push({ path: file.name, content });
        totalContentSize += content.length;
      } else {
        console.warn("Reached maximum total content size. Skipping remaining files.");
        break;
      }
    } catch (error) {
        console.warn(`Could not read file ${file.name} from zip:`, error);
    }
  }
  
  onProgress?.('Step 5/5: Assembling context for AI...');
  if (fileContents.length === 0) {
    throw new Error("Could not find any relevant text-based files to analyze in the ZIP archive.");
  }

  return fileContents
    .map(file => `// File: ${file.path}\n\n${file.content}\n\n---\n\n`)
    .join('');
};
