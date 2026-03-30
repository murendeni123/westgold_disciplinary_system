import React from 'react';
import Input from '../Input';

interface ContactPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const ContactPanel: React.FC<ContactPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Contact Information</h2>
        <p className="text-sm text-muted">
          Add contact details and important links for your school
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Contact Email
          </label>
          <p className="text-xs text-muted mb-3">
            General contact email for inquiries
          </p>
          <input
            type="email"
            value={customizations.contact_email || ''}
            onChange={(e) => updateCustomization({ contact_email: e.target.value })}
            placeholder="contact@school.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Contact Phone
          </label>
          <p className="text-xs text-muted mb-3">
            Main phone number for the school
          </p>
          <input
            type="tel"
            value={customizations.contact_phone || ''}
            onChange={(e) => updateCustomization({ contact_phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Support Email */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Support Email
          </label>
          <p className="text-xs text-muted mb-3">
            Technical support email address
          </p>
          <input
            type="email"
            value={customizations.support_email || ''}
            onChange={(e) => updateCustomization({ support_email: e.target.value })}
            placeholder="support@school.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-text mb-4">Legal Links</h3>
          
          {/* Terms URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-2">
              Terms of Service URL
            </label>
            <p className="text-xs text-muted mb-3">
              Link to your terms and conditions
            </p>
            <input
              type="url"
              value={customizations.terms_url || ''}
              onChange={(e) => updateCustomization({ terms_url: e.target.value })}
              placeholder="https://school.com/terms"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Privacy URL */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Privacy Policy URL
            </label>
            <p className="text-xs text-muted mb-3">
              Link to your privacy policy
            </p>
            <input
              type="url"
              value={customizations.privacy_url || ''}
              onChange={(e) => updateCustomization({ privacy_url: e.target.value })}
              placeholder="https://school.com/privacy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        <div className="bg-surface rounded-lg p-6">
          <h4 className="font-semibold text-text mb-4">Contact Us</h4>
          <div className="space-y-3 text-sm">
            {customizations.contact_email && (
              <div className="flex items-center space-x-2">
                <span className="text-muted">Email:</span>
                <a href={`mailto:${customizations.contact_email}`} className="text-blue-600 hover:underline">
                  {customizations.contact_email}
                </a>
              </div>
            )}
            {customizations.contact_phone && (
              <div className="flex items-center space-x-2">
                <span className="text-muted">Phone:</span>
                <a href={`tel:${customizations.contact_phone}`} className="text-blue-600 hover:underline">
                  {customizations.contact_phone}
                </a>
              </div>
            )}
            {customizations.support_email && (
              <div className="flex items-center space-x-2">
                <span className="text-muted">Support:</span>
                <a href={`mailto:${customizations.support_email}`} className="text-blue-600 hover:underline">
                  {customizations.support_email}
                </a>
              </div>
            )}
          </div>
          
          {(customizations.terms_url || customizations.privacy_url) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex space-x-4 text-sm">
                {customizations.terms_url && (
                  <a href={customizations.terms_url} className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>
                )}
                {customizations.privacy_url && (
                  <a href={customizations.privacy_url} className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Contact information will be displayed in the footer and help sections. 
          Make sure all links are valid and point to the correct pages.
        </p>
      </div>
    </div>
  );
};

export default ContactPanel;
