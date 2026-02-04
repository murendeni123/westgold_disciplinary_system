const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Upload file to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder name in storage bucket (e.g., 'students', 'teachers')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToSupabase = async (file, folder) => {
  try {
    // Generate unique filename
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const filePath = `${folder}/${fileName}`;

    console.log(`📤 Uploading file to Supabase Storage: ${filePath}`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600' // Cache for 1 hour
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    console.log('✅ File uploaded successfully:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadToSupabase:', error);
    throw error;
  }
};

/**
 * Delete file from Supabase Storage
 * @param {string} fileUrl - Public URL of file to delete
 * @returns {Promise<void>}
 */
const deleteFromSupabase = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/profile-photos/students/filename.jpg
    const urlParts = fileUrl.split('/profile-photos/');
    if (urlParts.length < 2) {
      console.warn('⚠️ Invalid Supabase URL format:', fileUrl);
      return;
    }

    const filePath = urlParts[1];
    console.log(`🗑️ Deleting file from Supabase Storage: ${filePath}`);

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      throw error;
    }

    console.log('✅ File deleted successfully');
  } catch (error) {
    console.error('❌ Error in deleteFromSupabase:', error);
    // Don't throw - deletion failures shouldn't block operations
  }
};

module.exports = {
  uploadToSupabase,
  deleteFromSupabase
};
