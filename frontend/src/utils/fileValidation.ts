export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File, maxSizeMB: number = 5): FileValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).`
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
    };
  }

  return { valid: true };
};

export const validateExcelFile = (file: File, maxSizeMB: number = 10): FileValidationResult => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  const allowedExtensions = ['.xls', '.xlsx', '.csv'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload an Excel file (.xls, .xlsx) or CSV file.`
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: `File is empty. Please choose a valid file.`
    };
  }

  return { valid: true };
};

export const validatePDFFile = (file: File, maxSizeMB: number = 10): FileValidationResult => {
  const allowedTypes = ['application/pdf'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a PDF file.`
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
    };
  }

  return { valid: true };
};

export const validateLogoFile = (file: File): FileValidationResult => {
  const result = validateImageFile(file, 2);
  
  if (!result.valid) {
    return result;
  }

  return new Promise<FileValidationResult>((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > 2000 || img.height > 2000) {
        resolve({
          valid: false,
          error: 'Image dimensions too large. Maximum size is 2000x2000 pixels.'
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to load image. Please try a different file.'
      });
    };
    img.src = URL.createObjectURL(file);
  }) as any;
};
