const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'public', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
    const filePath = path.join(blogDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace <head> links
    content = content.replace(/href="\/favicon/g, 'href="../favicon');
    content = content.replace(/href="\/site\.webmanifest"/g, 'href="../site.webmanifest"');
    content = content.replace(/href="\/apple-touch/g, 'href="../apple-touch');
    content = content.replace(/href="\/styles\.css"/g, 'href="../styles.css"');
    content = content.replace(/href="\/blog\/blog-styles\.css"/g, 'href="blog-styles.css"');
    content = content.replace(/src="\/script\.js"/g, 'src="../script.js"');

    // Replace navigation and image links
    content = content.replace(/href="\/#features"/g, 'href="../#features"');
    content = content.replace(/href="\/#comparison"/g, 'href="../#comparison"');
    content = content.replace(/href="\/#pricing"/g, 'href="../#pricing"');
    content = content.replace(/src="\/blog\/images\//g, 'src="images/');
    
    // Replace intra-blog and other links
    content = content.replace(/href="\/blog\//g, 'href="');
    content = content.replace(/href="\/blog"/g, 'href="../blog"');
    content = content.replace(/href="\/"/g, 'href="../"');
    content = content.replace(/href="\/privacy"/g, 'href="../privacy"');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
}
