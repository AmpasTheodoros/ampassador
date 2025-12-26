# Uploadthing Setup Guide

Το Ampassador χρησιμοποιεί το **Uploadthing** για να ανεβάζει και να αποθηκεύει έγγραφα (PDF, DOCX, TXT).

## 🚀 Quick Setup

### 1. Δημιουργία Uploadthing Account

1. Πηγαίνετε στο [Uploadthing](https://uploadthing.com/)
2. Δημιουργήστε έναν νέο λογαριασμό (free tier: 2GB storage, 10GB bandwidth/month)
3. Δημιουργήστε ένα νέο app

### 2. Environment Variables

Προσθέστε αυτές τις μεταβλητές στο Vercel dashboard (ή στο `.env.local` για local development):

```bash
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UPLOADTHING_APP_ID=your_app_id_here
```

**Πού να βρω αυτά;**
- **UPLOADTHING_SECRET**: Uploadthing Dashboard → Settings → API Keys → Copy Secret Key
- **UPLOADTHING_APP_ID**: Uploadthing Dashboard → Your App → Copy App ID

### 3. Local Development

Για local development, χρειάζεστε και τα δύο:
- `UPLOADTHING_SECRET`: Secret key από το dashboard
- `UPLOADTHING_APP_ID`: App ID από το dashboard

### 4. Production (Vercel)

Προσθέστε και τα δύο environment variables στο Vercel:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Προσθέστε `UPLOADTHING_SECRET` και `UPLOADTHING_APP_ID`
3. Redeploy το project

## 📄 Document Upload Features

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Text files (`.txt`)

### File Limits
- **Max file size**: 16MB per file
- **Max files**: 1 file per upload

### Upload Flow

1. **User uploads file** → Uploadthing stores the file
2. **File URL returned** → System receives the file URL
3. **AI Analysis** → Document is automatically parsed and analyzed
4. **Database record** → Document is saved with AI analysis
5. **Deadlines extracted** → Any deadlines found are automatically created

### Where to Upload

- **Documents Page**: `/dashboard/documents` - Upload any document
- **Matter Details**: Can be added to specific matters (future feature)

## 🔧 API Endpoints

### Upload Endpoint
- **POST** `/api/uploadthing` - Handles file uploads via Uploadthing

### Parse Endpoint
- **POST** `/api/documents/parse` - Analyzes uploaded documents with AI

## 🛠️ Troubleshooting

### "Unauthorized" Error
- Ensure user is authenticated via Clerk
- Ensure user is part of an organization

### "File too large" Error
- Maximum file size is 16MB
- Compress PDFs or split large documents

### Upload Fails
- Check `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set correctly
- Check Uploadthing dashboard for quota limits
- Check browser console for detailed error messages

## 📚 Resources

- [Uploadthing Documentation](https://docs.uploadthing.com/)
- [Uploadthing Dashboard](https://uploadthing.com/dashboard)

