const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'public', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Revert <head> links to absolute
    content = content.replace(/href="\.\.\/favicon/g, 'href="/favicon');
    content = content.replace(/href="\.\.\/site\.webmanifest"/g, 'href="/site.webmanifest"');
    content = content.replace(/href="\.\.\/apple-touch/g, 'href="/apple-touch');
    content = content.replace(/href="\.\.\/styles\.css"/g, 'href="/styles.css"');
    content = content.replace(/href="blog-styles\.css"/g, 'href="/blog/blog-styles.css"');
    content = content.replace(/src="\.\.\/script\.js"/g, 'src="/script.js"');

    // Revert navigation and image links to absolute
    content = content.replace(/href="\.\.\/#features"/g, 'href="/#features"');
    content = content.replace(/href="\.\.\/#comparison"/g, 'href="/#comparison"');
    content = content.replace(/href="\.\.\/#pricing"/g, 'href="/#pricing"');
    content = content.replace(/src="images\//g, 'src="/blog/images/');
    
    // Revert intra-blog and other links to absolute
    // Wait, replacing href=" with href="/blog is tricky because it might replace href="/something_else".
    // Let's do it specifically for the blog files:
    const htmlFiles = ['merge-pdf-mobile.html', 'best-pdf-tools-students.html', 'pdf-compression-guide.html', 'pdf-security-encryption.html', 'pdf-to-word-conversion.html', 'whatsapp-document-management.html'];
    
    for (const htmlFile of htmlFiles) {
        content = content.replaceAll(`href="${htmlFile}"`, `href="/blog/${htmlFile}"`);
    }

    content = content.replace(/href="\.\.\/blog"/g, 'href="/blog"');
    
    // Home and privacy
    content = content.replace(/href="\.\.\/"/g, 'href="/"');
    content = content.replace(/href="\.\.\/privacy"/g, 'href="/privacy"');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Reverted paths in ${file}`);
}
