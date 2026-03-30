# School Customization System - Usage Guide

**Version:** 2.0 (Enhanced Legacy System)  
**Date:** February 9, 2026  
**Status:** ✅ Ready for Testing

---

## 🎉 What's New

The School Customization system has been completely rebuilt with:

✅ **Modern UI** - Clean, intuitive interface matching platform design  
✅ **Live Preview** - See changes in real-time before saving  
✅ **Auto-Save** - Changes save automatically after 2 seconds  
✅ **Accessibility Checker** - Validates color contrast ratios  
✅ **8 Customization Sections** - Comprehensive branding control  
✅ **Device Preview** - Test on desktop, tablet, and mobile  
✅ **Portal Preview** - Preview Admin, Teacher, and Parent views  

---

## 📍 How to Access

### As Platform Admin:

1. Login to Platform Admin portal
2. Navigate to **Schools** page
3. Click on any school to view details
4. Click the **"Customize"** button (purple gradient)
5. Customization interface opens

**Direct URL:** `/platform/schools/:schoolId/customize`

---

## 🎨 Customization Sections

### 1. **Branding**
Upload and manage visual assets:
- **School Logo** - Displayed in sidebar and header (200x60px recommended)
- **Favicon** - Browser tab icon (32x32px recommended)

**Supported Formats:** PNG, JPG, SVG, ICO  
**Max Size:** 5MB for logo, 1MB for favicon

### 2. **Colors**
Customize the color palette:
- Primary Color (buttons, links)
- Secondary Color (accents)
- Success, Warning, Danger colors
- Background colors
- Text colors

**Features:**
- Color picker with hex input
- Live preview of all colors
- Accessibility contrast checker (WCAG AA)
- Warnings for poor contrast ratios

### 3. **Typography**
Choose fonts and sizes:
- Primary Font (body text)
- Secondary Font (headings)
- Base Font Size (14px-18px)

**Available Fonts:**
- Inter, Roboto, Open Sans, Lato
- Montserrat, Poppins, Raleway
- Ubuntu, Nunito, Playfair Display
- Merriweather, Source Sans Pro

### 4. **Components**
Customize UI element styling:
- Button corner radius (0px-16px or pill)
- Card corner radius (0px-16px or pill)

**Preview:** See buttons, cards, and inputs with your settings

### 5. **Layout**
Set layout colors:
- Sidebar background color
- Header background color

**Preview:** Interactive layout mockup

### 6. **Login Page**
Customize the login experience:
- Welcome message
- Tagline/motto
- Background color

**Preview:** Full login page mockup

### 7. **Contact Info**
Add school contact details:
- Contact email
- Contact phone
- Support email
- Terms of Service URL
- Privacy Policy URL

### 8. **Advanced**
For technical users:
- Custom CSS (with CSS variable reference)
- Custom JavaScript
- Email template HTML (header, footer, signature)

**⚠️ Warning:** Advanced section requires technical knowledge

---

## 💾 Saving Changes

### Auto-Save
- Changes save automatically after 2 seconds of inactivity
- "Unsaved changes" indicator shows when edits are pending
- No manual save needed for most edits

### Manual Save
- Click **"Save Changes"** button in header
- Useful for immediate save without waiting
- Disabled when no changes pending

### Reset to Defaults
- Click **"Reset"** button in header
- Restores all settings to default values
- Requires confirmation (cannot be undone)

---

## 👁️ Live Preview

### Device Sizes
Toggle between:
- **Desktop** (full width)
- **Tablet** (768px)
- **Mobile** (375px)

### Portal Types
Switch preview between:
- **Admin Portal** - School administrator view
- **Teacher Portal** - Teacher dashboard view
- **Parent Portal** - Parent dashboard view

### Preview Features
- Real-time updates as you edit
- Applies all CSS variables
- Shows logo and branding
- Displays color scheme
- Renders with selected fonts

### Toggle Preview
- Click **"Hide Preview"** to maximize editing space
- Click **"Show Preview"** to see changes

---

## 🎯 Best Practices

### Colors
1. **Use your brand colors** for primary and secondary
2. **Maintain contrast** - Aim for 4.5:1 ratio minimum
3. **Test on different screens** - Colors may appear different
4. **Keep it simple** - Too many colors can be overwhelming

### Typography
1. **Stick to 2 fonts max** - One for body, one for headings
2. **Use web-safe fonts** - Ensure cross-browser compatibility
3. **Test readability** - 16px is standard for body text
4. **Consider accessibility** - Some fonts are harder to read

### Branding
1. **Use transparent PNGs** for logos with backgrounds
2. **Optimize file sizes** - Smaller files load faster
3. **Test on dark/light backgrounds** - Ensure visibility
4. **Keep aspect ratios** - Avoid distorted logos

### Advanced CSS/JS
1. **Test thoroughly** - Invalid code can break the interface
2. **Use CSS variables** - Maintains consistency with theme
3. **Avoid !important** - Can cause conflicts
4. **Comment your code** - Makes future edits easier

---

## 🔧 Technical Details

### API Endpoints Used
```
GET    /api/school-customizations/:schoolId
PUT    /api/school-customizations/:schoolId
POST   /api/school-customizations/:schoolId/logo
POST   /api/school-customizations/:schoolId/favicon
DELETE /api/school-customizations/:schoolId/logo
DELETE /api/school-customizations/:schoolId/favicon
```

### Database Table
**Table:** `public.school_customizations`  
**Storage:** Individual columns (not JSON)  
**Assets:** Files stored in `/uploads/schools/:schoolId/`

### CSS Variables Applied
```css
--primary-color
--secondary-color
--success-color
--warning-color
--danger-color
--background-color
--text-primary-color
--text-secondary-color
--button-border-radius
--card-border-radius
--sidebar-background
--header-background
--primary-font
--secondary-font
--base-font-size
```

### How Changes Apply
1. Platform admin saves customizations
2. Data stored in `school_customizations` table
3. Regular users login to school portal
4. `SchoolThemeContext` loads on mount
5. Fetches customizations from API
6. Applies CSS variables to `document.documentElement`
7. Theme visible across all pages immediately

---

## 🐛 Troubleshooting

### Changes Not Showing
1. **Check auto-save** - Wait 2 seconds after editing
2. **Manual save** - Click "Save Changes" button
3. **Clear browser cache** - Hard refresh (Cmd+Shift+R)
4. **Check console** - Look for API errors

### Logo Not Displaying
1. **Check file format** - Must be image file
2. **Check file size** - Max 5MB
3. **Check upload success** - Look for success toast
4. **Try different browser** - Rule out browser issues

### Colors Not Applying
1. **Check hex format** - Must be valid hex code (#000000)
2. **Check contrast** - May need adjustment
3. **Clear cache** - Force reload
4. **Check custom CSS** - May be overriding

### Preview Not Updating
1. **Toggle preview off/on** - Refresh preview
2. **Switch device size** - Forces re-render
3. **Check browser console** - Look for errors
4. **Reload page** - Fresh start

---

## 📊 Feature Comparison

### Old System vs New System

| Feature | Old System | New System |
|---------|-----------|------------|
| UI Design | Basic forms | Modern panels |
| Live Preview | ❌ None | ✅ Real-time |
| Auto-Save | ❌ No | ✅ Yes (2s) |
| Accessibility Check | ❌ No | ✅ Yes |
| Device Preview | ❌ No | ✅ Desktop/Tablet/Mobile |
| Portal Preview | ❌ No | ✅ Admin/Teacher/Parent |
| Color Picker | ❌ Text input only | ✅ Visual picker |
| Font Preview | ❌ No | ✅ Live preview |
| Asset Management | ❌ Basic | ✅ Upload/Replace/Delete |
| Validation | ❌ No | ✅ Yes |

---

## 🚀 Testing Checklist

Before deploying to production, test:

- [ ] Upload logo and favicon
- [ ] Change all color values
- [ ] Test color contrast warnings
- [ ] Change fonts and font size
- [ ] Adjust border radius values
- [ ] Update layout colors
- [ ] Edit login page text
- [ ] Add contact information
- [ ] Test custom CSS (optional)
- [ ] Preview on all device sizes
- [ ] Preview all portal types
- [ ] Verify auto-save works
- [ ] Test manual save button
- [ ] Test reset to defaults
- [ ] Login as regular user and verify changes apply
- [ ] Test on different browsers
- [ ] Check mobile responsiveness

---

## 📝 Notes

### Backward Compatibility
- Uses existing `school_customizations` table
- No data migration required
- Works with existing API endpoints
- Compatible with current `SchoolThemeContext`

### Performance
- Auto-save debounced to prevent excessive API calls
- Images optimized on upload
- CSS variables for efficient styling
- Minimal re-renders in preview

### Security
- Platform admin authentication required
- File type validation on uploads
- File size limits enforced
- SQL injection protection
- XSS protection on custom CSS/JS

---

## 🎓 Training Tips

### For Platform Admins
1. Start with **Branding** - Upload logo and favicon first
2. Move to **Colors** - Set primary and secondary colors
3. Check **Accessibility** - Ensure good contrast
4. Test **Preview** - Verify changes look good
5. Save and **test as user** - Login to school portal

### For School Staff
- Changes made by platform admin apply automatically
- No action needed from school staff
- Changes visible immediately after login
- Contact platform admin for customization requests

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review console errors
- Test in different browser
- Contact platform administrator

---

**Last Updated:** February 9, 2026  
**System Version:** 2.0  
**Status:** Production Ready
