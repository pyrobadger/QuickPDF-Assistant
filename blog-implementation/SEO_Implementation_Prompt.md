# AI Agent Prompt: QuickPDF Assistant SEO Implementation

## Context
You are an AI developer assistant helping implement SEO improvements on quickpdfassistant.in. The website is a WhatsApp-based PDF tool platform. **CRITICAL: Only modify text content and HTML meta tags. Do NOT change CSS, layout, colors, fonts, or any visual elements.**

---

## Task 1: Create robots.txt & sitemap.xml

### robots.txt File
Create a `robots.txt` file in the website root (`/robots.txt`) with the following content:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://quickpdfassistant.in/sitemap.xml
```

### sitemap.xml File
Create a `sitemap.xml` file in the website root (`/sitemap.xml`) with entries for all pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://quickpdfassistant.in/</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quickpdfassistant.in/#features</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quickpdfassistant.in/#pricing</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quickpdfassistant.in/#comparison</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://quickpdfassistant.in/privacy</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://quickpdfassistant.in/terms</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

---

## Task 2: Add Meta Tags & Title Optimization

### Homepage (`/index.html` or main page template)

**Current Title:** Find the existing `<title>` tag and replace with:
```html
<title>Free PDF Merger, Compressor & Converter Online - QuickPDF on WhatsApp</title>
```

**Add Meta Description** (if missing) in `<head>` section:
```html
<meta name="description" content="Free PDF merger, compressor, and converter on WhatsApp. Merge, split, compress, convert PDFs instantly. No app needed, 100% private, works on any phone.">
```

**Add Canonical Tag** in `<head>` section:
```html
<link rel="canonical" href="https://quickpdfassistant.in/">
```

---

## Task 3: Add SoftwareApplication Schema to Homepage

Add this JSON-LD schema in the `<head>` section of the homepage (after the meta tags):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "QuickPDF Assistant",
  "description": "Free PDF merger, compressor, converter, and protection tool available on WhatsApp. No app installation needed.",
  "url": "https://quickpdfassistant.in",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Android, iOS, Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "name": "Free Forever Plan"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "250"
  },
  "author": {
    "@type": "Organization",
    "name": "C FIVE AND H ONE FOODS LLP"
  }
}
</script>
```

---

## Task 4: Add AggregateOffer Schema to Pricing Section

Find the pricing section HTML and add this schema in a `<script type="application/ld+json">` tag right after the pricing HTML:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AggregateOffer",
  "priceCurrency": "INR",
  "offers": [
    {
      "@type": "Offer",
      "name": "QuickPDF Free",
      "price": "0",
      "priceCurrency": "INR",
      "description": "5 operations per day, up to 40MB per document, all features included"
    },
    {
      "@type": "Offer",
      "name": "QuickPDF Pro",
      "price": "99",
      "priceCurrency": "INR",
      "description": "Unlimited operations, up to 100MB per document, priority processing"
    }
  ]
}
</script>
```

---

## Task 5: Add FAQ Schema

Add this FAQ schema in the footer or a dedicated FAQ section (in `<script type="application/ld+json">` tag):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is QuickPDF safe? Are my files stored?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. All files are auto-deleted immediately after processing. We never store, access, or keep your data. Your files are 100% private."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to install an app to use QuickPDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. QuickPDF works directly inside WhatsApp. Just send your PDF files to our WhatsApp bot and it processes them instantly. No app download needed."
      }
    },
    {
      "@type": "Question",
      "name": "What is the maximum file size for QuickPDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Free plan: 40MB per document. Pro plan: 100MB per document. You can also combine multiple files."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use QuickPDF on mobile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! QuickPDF works on any phone with WhatsApp installed. No special requirements, works on Android, iOS, and web."
      }
    },
    {
      "@type": "Question",
      "name": "How long does PDF processing take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most PDFs are processed in seconds. Large files (100+ pages) may take 10-30 seconds depending on file size and complexity."
      }
    },
    {
      "@type": "Question",
      "name": "What PDF tools can I use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "QuickPDF supports: merge PDFs, split PDFs, compress PDFs, convert to/from Word, convert to/from PowerPoint, convert to/from images, and password protection."
      }
    },
    {
      "@type": "Question",
      "name": "Is QuickPDF free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! QuickPDF is free forever with 5 operations per day. Upgrade to Pro for unlimited operations at ₹99/month."
      }
    },
    {
      "@type": "Question",
      "name": "How do I protect a PDF with a password?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Send your PDF to QuickPDF and type 'protect' or 'lock'. QuickPDF will ask for a password and return an encrypted PDF."
      }
    }
  ]
}
</script>
```

---

## Task 6: Optimize Page Meta Tags & Titles for All Pages

### Current Website Pages to Optimize:

#### **Page 1: Homepage** (Already covered in Task 2)

#### **Page 2: Features/Merge & Split Section**
Find the section with "Merge & Split PDFs" heading.

**Meta Title:** 
```html
<title>Merge & Split PDF Files Online Free - QuickPDF Assistant</title>
```

**Meta Description:**
```html
<meta name="description" content="Merge multiple PDFs into one or split specific pages. Works on WhatsApp, no app needed. Instant results, completely free.">
```

**H1 Tag (in page content):** 
Ensure the heading reads:
```html
<h1>Merge & Split PDF Files Online Free - Works on WhatsApp</h1>
```

#### **Page 3: Compress Section**
Find the section with "Smart Compression" heading.

**Meta Title:**
```html
<title>Best PDF Compression Tool Online Free - QuickPDF</title>
```

**Meta Description:**
```html
<meta name="description" content="Compress PDF files to fit email size limits. Free PDF compression online without losing quality. Works instantly on WhatsApp.">
```

**H1 Tag (in page content):**
```html
<h1>Best PDF Compression Tool Online - Shrink Files Instantly</h1>
```

#### **Page 4: Conversion/Format Section**
Find the section with "Format Conversion" heading.

**Meta Title:**
```html
<title>PDF to Word Converter Free Online - Convert PPT to PDF</title>
```

**Meta Description:**
```html
<meta name="description" content="Convert PDFs to Word, PowerPoint, or images. Free online conversion tool on WhatsApp. No software needed.">
```

**H1 Tag (in page content):**
```html
<h1>PDF to Word Converter & Format Conversion Tool</h1>
```

#### **Page 5: Protection/Security Section**
Find the section with "Privacy First" heading.

**Meta Title:**
```html
<title>Free PDF Protection Tool - Password Lock & Encryption</title>
```

**Meta Description:**
```html
<meta name="description" content="Password protect your PDFs. Encrypt and lock PDF files online free. Unlock protected documents instantly.">
```

**H1 Tag (in page content):**
```html
<h1>Secure Your PDFs - Free Password Protection & Encryption</h1>
```

#### **Page 6: Pricing Page**
Find the pricing section.

**Meta Title:**
```html
<title>QuickPDF Pricing - Free Plan & Pro Subscription</title>
```

**Meta Description:**
```html
<meta name="description" content="Start free with 5 daily operations. Upgrade to Pro for unlimited PDF processing at ₹99/month. No hidden fees.">
```

**H1 Tag (in page content):**
```html
<h1>Simple, Honest Pricing - Free Forever or ₹99 Pro</h1>
```

#### **Page 7: Comparison Section** (Why not just use a PDF website?)
Find the "Why not just use a PDF website?" section.

**Meta Title:**
```html
<title>QuickPDF vs Traditional PDF Tools - Why Choose WhatsApp?</title>
```

**Meta Description:**
```html
<meta name="description" content="Compare QuickPDF on WhatsApp vs sketchy online PDF tools. No ads, no paywalls, no account needed, files auto-deleted.">
```

**H1 Tag (in page content):**
```html
<h1>QuickPDF vs Traditional PDF Tools - The Better Alternative</h1>
```

---

## Task 7: Add Canonical Tags to All Pages

Add to the `<head>` of every page:

```html
<!-- Homepage -->
<link rel="canonical" href="https://quickpdfassistant.in/">

<!-- Features page (if separate) -->
<link rel="canonical" href="https://quickpdfassistant.in/#features">

<!-- Pricing page -->
<link rel="canonical" href="https://quickpdfassistant.in/#pricing">

<!-- Comparison section -->
<link rel="canonical" href="https://quickpdfassistant.in/#comparison">

<!-- Privacy page -->
<link rel="canonical" href="https://quickpdfassistant.in/privacy">

<!-- Terms page -->
<link rel="canonical" href="https://quickpdfassistant.in/terms">
```

---

## Task 8: H1, H2, H3 Hierarchy on Homepage

**Do NOT change the visual layout or styling.** Only modify the heading tags and text content.

### Current Structure → Optimized Structure:

**Homepage Hero Section:**
- Change current main heading to include target keyword:
  ```html
  <!-- Before: "Your PDF Powerhouse, right on WhatsApp" -->
  <!-- After: -->
  <h1>Free PDF Merger, Compressor & Converter Online - QuickPDF on WhatsApp</h1>
  <p>Merge, split, compress, and convert PDFs instantly on WhatsApp</p>
  ```

**"Why people love it" Section:**
- Add H2:
  ```html
  <h2>Why Choose QuickPDF for Free PDF Tools?</h2>
  ```

**"Powerful tools, simple conversations" Section:**
- Change to H2:
  ```html
  <h2>Powerful PDF Tools, Simple Conversations</h2>
  ```

**Individual Feature Sections (Merge, Compress, Convert, Protect):**
- Change each to H3 with keywords:
  ```html
  <!-- Merge section -->
  <h3>Merge & Split PDF Files Online Free</h3>
  
  <!-- Compress section -->
  <h3>Best PDF Compression Tool - Shrink Files Online</h3>
  
  <!-- Convert section -->
  <h3>PDF to Word Converter - Format Conversion Free</h3>
  
  <!-- Protect section -->
  <h3>Free PDF Protection Tool - Password Lock & Encryption</h3>
  ```

**"Why not just use a PDF website?" Section:**
- Add H2:
  ```html
  <h2>QuickPDF vs Traditional PDF Tools - Why We're Different</h2>
  ```

**Pricing Section:**
- Add H2:
  ```html
  <h2>Simple, Honest PDF Tool Pricing</h2>
  ```

---

## Task 9: Core Web Vitals Optimization (Text Instructions for Developer)

These are CODE optimizations, not content changes, but relay these to your developer:

### LCP (Largest Contentful Paint) < 2.5s
- **Optimize hero image:** Compress and lazy-load the main banner image
- **Defer non-critical JS:** Move analytics and non-essential scripts to `async` or `defer`
- **Minimize CSS:** Remove unused CSS, inline critical styles

### FID (First Input Delay) < 100ms
- **Reduce JS execution:** Minimize JavaScript bundle size
- **Use Web Workers:** Offload heavy tasks to background threads

### CLS (Cumulative Layout Shift) < 0.1
- **Reserve space for elements:** Set explicit width/height for images and video embeds
- **Avoid injected content:** Ads and dynamic content should not shift layout

**Testing:** Use Google PageSpeed Insights (https://pagespeed.web.dev/) to measure after each change.

---

## Task 10: Add OpenGraph & Twitter Meta Tags (Optional but Recommended)

Add to `<head>` section of homepage:

```html
<!-- Open Graph Tags -->
<meta property="og:title" content="Free PDF Merger, Compressor & Converter - QuickPDF on WhatsApp">
<meta property="og:description" content="Merge, split, compress, convert PDFs instantly on WhatsApp. No app needed, 100% private.">
<meta property="og:url" content="https://quickpdfassistant.in/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://quickpdfassistant.in/og-image.png">

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Free PDF Merger on WhatsApp - QuickPDF">
<meta name="twitter:description" content="Merge, compress, convert PDFs on WhatsApp. No app needed.">
<meta name="twitter:image" content="https://quickpdfassistant.in/og-image.png">
```

---

## Implementation Checklist

- [ ] Create `/robots.txt` file
- [ ] Create `/sitemap.xml` file
- [ ] Submit sitemap to Google Search Console
- [ ] Add/update `<title>` tag on all pages with keywords
- [ ] Add/update `<meta name="description">` on all pages (160 chars)
- [ ] Add `<link rel="canonical">` tags to all pages
- [ ] Add SoftwareApplication schema to homepage
- [ ] Add AggregateOffer schema to pricing section
- [ ] Add FAQ schema (in footer or dedicated section)
- [ ] Update H1, H2, H3 hierarchy with keywords
- [ ] Add OpenGraph & Twitter meta tags
- [ ] Test all pages with Google Search Console
- [ ] Run PageSpeed Insights and optimize CWV issues
- [ ] Validate structured data with Google's Structured Data Testing Tool (https://search.google.com/structured-data/testing-tool/)

---

## Keywords Priority Mapping

**Homepage Focus:**
- "Free PDF merger online India" (800/month)
- "WhatsApp PDF tools" (150/month)

**Feature/Tool Pages:**
- "Merge PDF files online" (900/month)
- "Best PDF compression tool" (650/month)
- "Compress PDF online free" (1100/month)
- "PDF to Word converter free" (1200/month)
- "Convert PPT to PDF online" (400/month)
- "Free PDF protection tool" (320/month)

**Placement Tips:**
- Use keywords naturally in H1, first 100 words, meta description
- Don't keyword stuff or it hurts ranking
- Use synonyms and variations (e.g., "PDF merger" + "merge PDF files")

---

## Files to Update

1. `/index.html` (or homepage template)
2. `robots.txt` (create new)
3. `sitemap.xml` (create new)
4. `/privacy` page (if separate HTML)
5. `/terms` page (if separate HTML)
6. Any feature-specific pages

---

## Testing & Validation

After implementation, validate everything:

1. **Google Search Console:** https://search.google.com/search-console/ → Submit sitemap
2. **Google PageSpeed Insights:** https://pagespeed.web.dev/ → Enter your homepage URL
3. **Structured Data Test:** https://search.google.com/structured-data/testing-tool/ → Validate schema
4. **Mobile-Friendly Test:** https://search.google.com/test/mobile-friendly → Check mobile rendering
5. **Link Checker:** Ensure no broken internal links (404s)

---

## Expected Impact Timeline

- **Week 1:** Robots.txt, sitemap, meta tags live. Crawl improvements.
- **Week 2:** Schema validation complete. Rich snippet eligibility.
- **Month 1:** Google re-indexes updated pages. Metadata shows in SERPs.
- **Month 2-3:** Keywords begin ranking. Organic traffic increases 10-20%.
- **Month 6:** 50%+ traffic increase expected if combined with blog content.

---

## Notes for Developer

- **Do NOT change:** Colors, fonts, layout, images (unless optimization)
- **Only change:** HTML text content, meta tags, heading tags, add `<script>` schema blocks
- **Be careful with:** Anchor tags, links. Ensure no broken links after changes.
- **Test locally first:** Make these changes on a staging environment before production.
- **Use Git:** Commit these changes with clear messages for rollback if needed.

---

**Questions?** Review the SEO Roadmap document for full context and strategy explanation.
