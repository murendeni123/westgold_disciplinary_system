/**
 * Decodes HTML entities in a string
 * Converts entities like &#x2F; back to their original characters
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};
