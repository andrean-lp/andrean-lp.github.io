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

  // 3. Generate and optimize responsive WebP covers for featured projects (max 680x383 WebP)
  try {
    const imagesDir = path.resolve('public/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const coverMappings = [
      { target: 'storiq-cover.webp', fallbackSource: 'public/blog-placeholder-1.jpg' },
      { target: 'erni-cover.webp', fallbackSource: 'public/blog-placeholder-2.jpg' },
    ];

    for (const mapping of coverMappings) {
      const targetPath = path.resolve(imagesDir, mapping.target);
      const fallbackPath = path.resolve(mapping.fallbackSource);

      const srcToUse = fs.existsSync(targetPath) ? targetPath : (fs.existsSync(fallbackPath) ? fallbackPath : null);
      if (srcToUse) {
        const buf = fs.readFileSync(srcToUse);
        const optimizedBuf = await sharp(buf)
          .resize({ width: 680, height: 383, fit: 'cover', position: 'center' })
          .webp({ quality: 80 })
          .toBuffer();
        fs.writeFileSync(targetPath, optimizedBuf);
        console.log(`[Image Optimizer] ✓ Generated responsive cover: public/images/${mapping.target} (${(optimizedBuf.length / 1024).toFixed(1)} KiB)`);
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Featured cover generation error:', e.message);
  }

  // 4. Compact root placeholder images in public/
  try {
    const publicDir = path.resolve('public');
    const rootFiles = fs.readdirSync(publicDir);
    for (const file of rootFiles) {
      if (/^blog-placeholder-.*\.jpe?g$/i.test(file)) {
        const fp = path.join(publicDir, file);
        try {
          const buf = fs.readFileSync(fp);
          const meta = await sharp(buf).metadata();
          if (meta.width > 680 || buf.length > 20 * 1024) {
            const opt = await sharp(buf)
              .resize({ width: 680, height: 383, fit: 'cover', position: 'center' })
              .jpeg({ quality: 78, mozjpeg: true })
              .toBuffer();
            fs.writeFileSync(fp, opt);
            console.log(`[Image Optimizer] ✓ Compacted root placeholder: public/${file} (${(opt.length / 1024).toFixed(1)} KiB)`);
          }
        } catch {}
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Root placeholders check error:', e.message);
  }

  // 5. Scan all public/images for general oversized images (max 1000x1000)
  try {
    const imagesDir = path.resolve('public/images');
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      for (const file of files) {
        if (/\.(png|jpe?g|webp)$/i.test(file)) {
          const filePath = path.join(imagesDir, file);
          await optimizeFile(filePath, { maxWidth: 1000, maxHeight: 1000, fit: 'inside', quality: 82 });
        }
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Public images check error:', e.message);
  }

  // 6. Optimize Testimonial Images from src/data/testimonials.json (max 1600px, auto-WebP)
  try {
    const testiPath = path.resolve('src/data/testimonials.json');
    if (fs.existsSync(testiPath)) {
      const raw = fs.readFileSync(testiPath, 'utf8').replace(/^\uFEFF/, '');
      const testiData = JSON.parse(raw);
      const items = testiData.items || [];
      let updated = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.image && typeof item.image === 'string') {
          const imgRel = item.image.replace(/^\//, '');
          const imgDisk = path.resolve('public', imgRel);

          if (fs.existsSync(imgDisk)) {
            const buf = fs.readFileSync(imgDisk);
            const meta = await sharp(buf).metadata();
            const ext = path.extname(imgDisk).toLowerCase();

            if (meta.width > 1600 || meta.height > 1600 || ext !== '.webp' || buf.length > 100 * 1024) {
              const baseName = path.basename(imgDisk, ext);
              const targetWebpName = `${baseName}.webp`;
              const targetWebpPath = path.join(path.dirname(imgDisk), targetWebpName);

              const optimizedBuf = await sharp(buf)
                .resize({
                  width: meta.width > 1600 ? 1600 : undefined,
                  height: meta.height > 1600 ? 1600 : undefined,
                  fit: 'inside',
                  withoutEnlargement: true,
                })
                .webp({ quality: 82 })
                .toBuffer();

              fs.writeFileSync(targetWebpPath, optimizedBuf);
              console.log(`[Image Optimizer] ✓ Optimized testimonial image: ${targetWebpName} (${(optimizedBuf.length / 1024).toFixed(1)} KiB)`);

              const newWebpUrl = (item.image.startsWith('/') ? '/' : '') + path.relative('public', targetWebpPath).replace(/\\/g, '/');
              if (item.image !== newWebpUrl) {
                item.image = newWebpUrl;
                updated = true;
              }
            }
          }
        }
      }

      if (updated) {
        fs.writeFileSync(testiPath, JSON.stringify(testiData, null, 2), 'utf8');
        console.log('[Image Optimizer] ✓ Updated testimonials.json with optimized WebP paths.');
      }
    }
  } catch (e) {
    console.warn('[Image Optimizer] Testimonials check error:', e.message);
  }

  console.log('[Image Optimizer] All images checked.');
}

run();
