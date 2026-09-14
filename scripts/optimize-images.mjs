import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SKIP_OPTIMIZATION = new Set([
  'pagespeed-score.png',
]);

async function optimizeFile(filePath, { maxWidth, maxHeight, fit = 'inside', quality = 82 } = {}) {
  if (!fs.existsSync(filePath)) return;
  const fileName = path.basename(filePath);
  if (SKIP_OPTIMIZATION.has(fileName.toLowerCase())) return;

  try {
    const buf = fs.readFileSync(filePath);
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) return;

    const isNonWebp = meta.format !== 'webp';
    const isHeavy = buf.length > 150 * 1024; // > 150 KiB
    const needsResize = (maxWidth && meta.width > maxWidth) || (maxHeight && meta.height > maxHeight);
    const needsSquare = (fit === 'cover' && meta.width !== meta.height);

    if (needsResize || needsSquare || isNonWebp || isHeavy) {
      console.log(`[Image Optimizer] Optimizing ${fileName} (${meta.width}x${meta.height}, ${(buf.length / 1024).toFixed(1)} KiB, ${meta.format}) -> max ${maxWidth || 'auto'}x${maxHeight || 'auto'} WebP`);
      
      let transform = sharp(buf);
      if (needsResize || needsSquare) {
        transform = transform.resize({
          width: maxWidth,
          height: maxHeight,
          fit: fit,
          position: 'center',
          withoutEnlargement: true
        });
      }
      
      const optimizedBuf = await transform.webp({ quality }).toBuffer();
      
      // Simpan jika ukuran berkurang atau jika format diubah ke WebP
      if (optimizedBuf.length < buf.length || isNonWebp) {
        fs.writeFileSync(filePath, optimizedBuf);
        const savedPercent = Math.round((1 - optimizedBuf.length / buf.length) * 100);
        console.log(`[Image Optimizer] ✓ Done: ${(optimizedBuf.length / 1024).toFixed(1)} KiB (${savedPercent}% lebih hemat)`);
      }
    }
  } catch (err) {
    console.warn(`[Image Optimizer] Skipped ${filePath}:`, err.message);
  }
}

async function run() {
  console.log('[Image Optimizer] Checking images for optimal web performance...');

  // 1. Optimize Avatar from profile.json (auto-crop square 1:1, max 600x600)
  try {
    const profilePath = path.resolve('src/data/profile.json');
    if (fs.existsSync(profilePath)) {
      const raw = fs.readFileSync(profilePath, 'utf8').replace(/^\uFEFF/, '');
      const profile = JSON.parse(raw);
      if (profile.avatar && typeof profile.avatar === 'string' && profile.avatar.startsWith('/images/')) {
        const avatarPath = path.resolve('public' + profile.avatar);
        await optimizeFile(avatarPath, { maxWidth: 600, maxHeight: 600, fit: 'cover', quality: 80 });
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Profile check error:', e.message);
  }

  // 2. Optimize Favicon from site.json (auto-crop square 1:1, max 192x192)
  try {
    const sitePath = path.resolve('src/data/site.json');
    if (fs.existsSync(sitePath)) {
      const raw = fs.readFileSync(sitePath, 'utf8').replace(/^\uFEFF/, '');
      const site = JSON.parse(raw);
      const profilePath = path.resolve('src/data/profile.json');
      const profile = fs.existsSync(profilePath) ? JSON.parse(fs.readFileSync(profilePath, 'utf8').replace(/^\uFEFF/, '')) : {};

      if (site.favicon && typeof site.favicon === 'string' && site.favicon.startsWith('/images/') && site.favicon !== profile.avatar) {
        const faviconPath = path.resolve('public' + site.favicon);
        await optimizeFile(faviconPath, { maxWidth: 192, maxHeight: 192, fit: 'cover', quality: 85 });
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Site check error:', e.message);
  }

  // 3. Scan all public/images for general oversized images (max 1200x1200)
  try {
    const imagesDir = path.resolve('public/images');
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      for (const file of files) {
        if (/\.(png|jpe?g|webp)$/i.test(file)) {
          const filePath = path.join(imagesDir, file);
          await optimizeFile(filePath, { maxWidth: 1200, maxHeight: 1200, fit: 'inside', quality: 82 });
        }
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Public images check error:', e.message);
  }

  console.log('[Image Optimizer] All images checked.');
}

run();
