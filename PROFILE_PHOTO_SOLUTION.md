# Profile Photo Persistence Solution

## Current Issue Analysis

### What's Working ✅
- Photo upload endpoint is functional (`POST /api/students/:id/photo`)
- Multer is correctly configured with diskStorage
- Photos are saved to `backend/uploads/students/` directory
- Photo paths are correctly saved to database (e.g., `/uploads/students/photo-1769647147877-639403676.jpeg`)
- Server serves uploaded files via `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`

### The Real Problem ❌
**Render uses ephemeral filesystem** - any files uploaded to the container are **lost when the container restarts** (which happens on every deployment, scaling, or crash recovery).

This is why photos appear to work initially but then show "photo not found" later.

## Solution: Cloud Storage Integration

### Recommended Approach: Supabase Storage

Since you're already using Supabase for the database, use **Supabase Storage** for persistent file storage.

#### Benefits:
- ✅ Persistent storage (files never lost)
- ✅ CDN-backed (fast global delivery)
- ✅ Already integrated with your auth system
- ✅ Free tier: 1GB storage
- ✅ Public URLs that work everywhere
- ✅ No additional services needed

### Implementation Steps:

#### 1. Update Backend Photo Upload

```javascript
// backend/middleware/supabaseUpload.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const uploadToSupabase = async (file, folder) => {
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath);

  return publicUrl;
};

module.exports = { uploadToSupabase };
```

#### 2. Update Student Photo Route

```javascript
// backend/routes/students.js
const multer = require('multer');
const { uploadToSupabase } = require('../middleware/supabaseUpload');

// Use memory storage instead of disk storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/:id/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Supabase Storage
    const publicUrl = await uploadToSupabase(req.file, 'students');

    // Save public URL to database
    await schemaRun(req, 'UPDATE students SET photo_path = $1 WHERE id = $2', [publicUrl, req.params.id]);
    
    const student = await schemaGet(req, 'SELECT * FROM students WHERE id = $1', [req.params.id]);
    res.json({ message: 'Photo uploaded successfully', student });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### 3. Create Supabase Storage Bucket

Run this in Supabase SQL Editor:

```sql
-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

-- Set up RLS policies for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
```

### Alternative: AWS S3 / Cloudinary

If you prefer other cloud storage:

**AWS S3:**
- More expensive but highly reliable
- Requires AWS account setup
- Use `aws-sdk` or `@aws-sdk/client-s3`

**Cloudinary:**
- Specialized for images (automatic optimization)
- Free tier: 25GB storage, 25GB bandwidth
- Very easy to integrate

## Migration Plan

1. ✅ Set up Supabase Storage bucket
2. ✅ Update backend upload middleware
3. ✅ Update student/teacher photo routes
4. ✅ Test photo upload and verify URL is saved
5. ✅ Deploy to Render
6. ✅ Verify photos persist after deployment
7. (Optional) Migrate existing photos from local storage to Supabase

## Environment Variables Needed

Add to Render:
```
SUPABASE_URL=https://kkmvxmbnmjbrwtfaihas.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Testing Checklist

- [ ] Upload photo for student
- [ ] Verify photo displays in frontend
- [ ] Redeploy backend on Render
- [ ] Verify photo still displays after deployment
- [ ] Upload photo for teacher
- [ ] Verify teacher photo persists
