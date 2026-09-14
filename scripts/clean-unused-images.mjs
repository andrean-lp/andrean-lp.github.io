import fs from 'node:fs';
import path from 'node:path';

// Direktori & file yang dicek untuk mencari referensi gambar aktif
const SCAN_DIRS = [
  'src/content',
  'src/data',
  'src/pages',
  'src/components',
  'src/layouts',
];

const SCAN_FILES = [
  'README.md',
  'public/site.webmanifest',
  'astro.config.mjs',
  'public/robots.txt',
];

const IMAGES_DIR = path.resolve('public/images');
const MEDIA_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.avif']);
const PROTECTED_FILES = new Set([
  'pagespeed-score.png',
]);

function getFilesRecursively(dir) {
  const fullPath = path.resolve(dir);
  if (!fs.existsSync(fullPath)) return [];

  const results = [];
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(entryPath));
    } else if (entry.isFile()) {
      if (/\.(md|mdx|json|astro|js|ts|jsx|tsx|html|yml|yaml|txt|webmanifest)$/i.test(entry.name)) {
        results.push(entryPath);
      }
    }
  }

  return results;
}

export function cleanUnusedImages() {
  console.log('[Media Cleaner] Memeriksa gambar di public/images yang sudah tidak terpakai...');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('[Media Cleaner] Folder public/images belum ada.');
    return [];
  }

  const mediaFiles = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter(entry => entry.isFile() && !entry.name.startsWith('.') && MEDIA_EXTS.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name);

  if (mediaFiles.length === 0) {
    console.log('[Media Cleaner] Tidak ada file gambar di public/images.');
    return [];
  }

  const filesToScan = [];
  for (const dir of SCAN_DIRS) {
    filesToScan.push(...getFilesRecursively(dir));
  }
  for (const f of SCAN_FILES) {
    const fp = path.resolve(f);
    if (fs.existsSync(fp)) {
      filesToScan.push(fp);
    }
  }

  const combinedContent = filesToScan
    .map(filePath => {
      try {
        return fs.readFileSync(filePath, 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');

  const lowerContent = combinedContent.toLowerCase();
  const deletedFiles = [];

  for (const filename of mediaFiles) {
    const rawName = filename.toLowerCase();
    const encodedName = encodeURIComponent(filename).toLowerCase();
    const decodedName = decodeURIComponent(filename).toLowerCase();

    const isProtected = PROTECTED_FILES.has(rawName);
    const isUsed = isProtected ||
                   lowerContent.includes(rawName) ||
                   lowerContent.includes(encodedName) ||
                   lowerContent.includes(decodedName);

    if (!isUsed) {
      const filePath = path.join(IMAGES_DIR, filename);
      try {
        fs.unlinkSync(filePath);
        deletedFiles.push(filename);
        console.log(`[Media Cleaner] 🗑️ Menghapus gambar tak terpakai: public/images/${filename}`);
      } catch (err) {
        console.error(`[Media Cleaner] Gagal menghapus ${filename}:`, err.message);
      }
    } else {
      console.log(`[Media Cleaner] ✓ Gambar aktif (sedang digunakan): public/images/${filename}`);
    }
  }

  if (deletedFiles.length > 0) {
    console.log(`[Media Cleaner] Total ${deletedFiles.length} gambar tak terpakai berhasil dibersihkan.`);
  } else {
    console.log('[Media Cleaner] Semua gambar saat ini aktif digunakan.');
  }

  return deletedFiles;
}

cleanUnusedImages();
