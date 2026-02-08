import React from 'react';
import { ThemeContent } from '../../types/theme.types';

interface ContentSectionProps {
  content: ThemeContent;
  onUpdateContent: (content: ThemeContent) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({ content, onUpdateContent }) => {
  const updateField = (section: keyof ThemeContent, field: string, value: string) => {
    onUpdateContent({
      ...content,
      [section]: {
        ...content[section],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Content & Messaging</h3>
        <p className="text-sm text-gray-600">
          Customize text content and contact information displayed across your portals.
        </p>
      </div>

      {/* Login Page */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Login Page
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Welcome Message
          </label>
          <input
            type="text"
            value={content.loginPage?.welcomeMessage || ''}
            onChange={(e) => updateField('loginPage', 'welcomeMessage', e.target.value)}
            placeholder="Welcome to Our School"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={content.loginPage?.tagline || ''}
            onChange={(e) => updateField('loginPage', 'tagline', e.target.value)}
            placeholder="Excellence in Education"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Text Alignment
          </label>
          <div className="flex gap-3">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateField('loginPage', 'alignment', align)}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition-colors capitalize ${
                  content.loginPage?.alignment === align
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        {/* Login Preview */}
        <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-gray-200">
          <div className={`text-${content.loginPage?.alignment || 'center'}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content.loginPage?.welcomeMessage || 'Welcome to Our School'}
            </h2>
            <p className="text-gray-600">
              {content.loginPage?.tagline || 'Excellence in Education'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Contact Information
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={content.contact?.email || ''}
            onChange={(e) => updateField('contact', 'email', e.target.value)}
            placeholder="contact@school.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={content.contact?.phone || ''}
            onChange={(e) => updateField('contact', 'phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={content.contact?.supportEmail || ''}
            onChange={(e) => updateField('contact', 'supportEmail', e.target.value)}
            placeholder="support@school.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Footer Links */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Footer Links
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Terms of Service URL
          </label>
          <input
            type="url"
            value={content.footer?.termsUrl || ''}
            onChange={(e) => updateField('footer', 'termsUrl', e.target.value)}
            placeholder="https://school.com/terms"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Privacy Policy URL
          </label>
          <input
            type="url"
            value={content.footer?.privacyUrl || ''}
            onChange={(e) => updateField('footer', 'privacyUrl', e.target.value)}
            placeholder="https://school.com/privacy"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
