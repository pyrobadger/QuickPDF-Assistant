# QuickPDF Assistant 📄
### PDF Powerhouse on WhatsApp

QuickPDF Assistant is a specialized WhatsApp bot designed to handle complex PDF tasks like merging, splitting, compressing, and converting files, all without leaving your WhatsApp chat. No extra apps needed!

---

> [!TIP]
> **QuickPDF Assistant is LIVE!** 🚀  
> Anyone can use the bot for **FREE** right now.  
> Check it out here: **[www.quickpdfassistant.in](https://www.quickpdfassistant.in)**
> Or message us directly on: **[WhatsApp](https://wa.me/7021763298/?text=Hi%20!)**

---
## ⚙ System Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/quickpdf-sys-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/quickpdf-sys-light.png">
  <img alt="System Architecture" src="public/images/system-design-light.png">
</picture>


---

## ✨ Features

- **📂 Merge PDFs**: Combine multiple PDF files into one in seconds. 
- **✂️ Split PDFs**: Extract specific pages or split larger documents into smaller ones.
- **📉 Compress PDFs**: Reduce file sizes significantly while maintaining quality.
- **🖼️ Convert Images to PDF**: Turn your photos, screenshots, and scans into a single, professional PDF.
- **🔄 Convert PDFs to Images**: Extract pages from your PDF as high-quality images.
- **⚡ Fast & Secure**: Instant processing with a focus on user privacy.

## 🛠️ Tech Stack

- **Backend**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **Database**: [Supabase PostgreSQL](https://supabase.com/) (Logging & Waitlist)
- **PDF Core**: [pdf-lib](https://pdf-lib.js.org/)
- **Document Processing**: [libreOffice](https://www.libreoffice.org/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)
- **API Client**: [Axios](https://axios-http.com/)
- **Deployment**: [Vercel](https://vercel.com/) & [Digital Ocean](https://www.digitalocean.com/)

## 📂 Project Structure

- `index.js`: Main server entry point and API routes.
- `api/`: Vercel serverless functions (for specific integrations).
- `controllers/`: Core bot logic and processing handlers (`botController.js`).
- `routes/`: Express routes for webhooks and API endpoints.
- `services/`: Business logic, database connections, and helper scripts.
- `public/`: Premium Landing Page with theme switching (Light/Dark mode).
- `tmp/`: Temporary folder for downloading files.

## 🌐 Deployment

The project's frontend is optimized for **Vercel**. 

The project's backend is deployed on **Digital Ocean**. 

---

Built with ❤️ by [pyrobadger](https://github.com/pyrobadger)
