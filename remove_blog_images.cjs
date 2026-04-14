const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const blogDir = path.join(publicDir, 'blog');

// 1. Process blog HTML files
const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

for (const file of blogFiles) {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove <img> tags
    content = content.replace(/<img[^>]*>/gi, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Removed images from ${file}`);
}

// 2. Process index.html (landing page) for blog images only
const indexPath = path.join(publicDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace blog card images in index.html specifically: 
// It looks like <img src="/blog/images/..." ...>
indexContent = indexContent.replace(/<img\s+src="\/blog\/images\/[^>]*>/gi, '');

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Removed blog images from index.html');
