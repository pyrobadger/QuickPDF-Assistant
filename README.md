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
## ⚙ System Design Diagram

<img width="1560" height="1571" alt="high-low" src="https://github.com/user-attachments/assets/80566e44-3a3b-42df-a881-6eb59c29b76b" />


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

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or later)
- [Supabase](https://supabase.com/) (PostgreSQL database)
- WhatsApp Business API credentials (via Meta Developer Portal)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pyrobadger/QuickPDF-Assistant.git
   cd QuickPDF-Assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   sudo apt install libreoffice
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_VERIFY_TOKEN=your_verify_token
   PORT=3000
   ```

4. **Run the application**:
   ```bash
   npm start
   ```

## 🌐 Deployment

The project's frontend is optimized for **Vercel**. Simply connect your GitHub repository to Vercel, and it will handle the environment variables and serverless function routing automatically.

The project's backend is deployed on **Digital Ocean**. Create a droplet, install required dependencies, and clone the repo. Host the backend using pm2, configure the networking accordingly.

---

Built with ❤️ by [pyrobadger](https://github.com/pyrobadger)
