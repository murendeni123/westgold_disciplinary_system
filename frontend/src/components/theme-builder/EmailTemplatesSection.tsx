import React, { useState } from 'react';
import { Mail, Eye } from 'lucide-react';
import { EmailTemplates } from '../../types/theme.types';

interface EmailTemplatesSectionProps {
  emailTemplates: EmailTemplates;
  onUpdateEmailTemplates: (templates: EmailTemplates) => void;
}

const EmailTemplatesSection: React.FC<EmailTemplatesSectionProps> = ({
  emailTemplates,
  onUpdateEmailTemplates,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const updateField = (field: keyof EmailTemplates, value: string) => {
    onUpdateEmailTemplates({
      ...emailTemplates,
      [field]: value,
    });
  };

  const sampleEmailContent = `
    <h2>Incident Report Notification</h2>
    <p>Dear Parent/Guardian,</p>
    <p>This is to inform you that an incident has been recorded for your child.</p>
    <p><strong>Date:</strong> February 8, 2026</p>
    <p><strong>Type:</strong> Minor Disruption</p>
    <p><strong>Description:</strong> Talking during class time</p>
    <p>Please contact us if you have any questions.</p>
  `;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Templates</h3>
        <p className="text-sm text-gray-600">
          Customize the header, footer, and signature for all automated emails sent from the system.
        </p>
      </div>

      {/* Header HTML */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Email Header HTML
          </label>
          <p className="text-xs text-gray-600 mb-3">
            HTML content displayed at the top of all emails (logo, branding)
          </p>
          <textarea
            value={emailTemplates.headerHtml || ''}
            onChange={(e) => updateField('headerHtml', e.target.value)}
            placeholder='<div style="text-align: center; padding: 20px;"><img src="https://school.com/logo.png" alt="School Logo" /></div>'
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>
      </div>

      {/* Footer HTML */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Email Footer HTML
          </label>
          <p className="text-xs text-gray-600 mb-3">
            HTML content displayed at the bottom of all emails (contact info, links)
          </p>
          <textarea
            value={emailTemplates.footerHtml || ''}
            onChange={(e) => updateField('footerHtml', e.target.value)}
            placeholder='<div style="text-align: center; padding: 20px; color: #666;"><p>© 2026 School Name. All rights reserved.</p></div>'
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>
      </div>

      {/* Signature */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Email Signature
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Default signature for emails sent by staff
          </p>
          <textarea
            value={emailTemplates.signature || ''}
            onChange={(e) => updateField('signature', e.target.value)}
            placeholder="Best regards,&#10;School Administration&#10;contact@school.com"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Preview Toggle */}
      <div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye size={18} />
          <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
        </button>
      </div>

      {/* Email Preview */}
      {showPreview && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
            <Mail size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Email Preview</span>
          </div>
          <div className="p-6">
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              {emailTemplates.headerHtml && (
                <div
                  className="border-b border-gray-200"
                  dangerouslySetInnerHTML={{ __html: emailTemplates.headerHtml }}
                />
              )}

              {/* Content */}
              <div className="p-6">
                <div dangerouslySetInnerHTML={{ __html: sampleEmailContent }} />
                
                {/* Signature */}
                {emailTemplates.signature && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {emailTemplates.signature}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              {emailTemplates.footerHtml && (
                <div
                  className="border-t border-gray-200"
                  dangerouslySetInnerHTML={{ __html: emailTemplates.footerHtml }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesSection;
