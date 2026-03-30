import React from 'react';
import { Code, AlertTriangle } from 'lucide-react';

interface AdvancedPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const AdvancedPanel: React.FC<AdvancedPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Advanced Customization</h2>
        <p className="text-sm text-muted">
          Add custom CSS and JavaScript for advanced styling and functionality
        </p>
      </div>

      {/* Warning */}
      <div className="bg-surface border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Advanced Users Only</p>
          <p>
            Custom CSS and JavaScript can affect the appearance and functionality of your portal. 
            Test thoroughly before publishing. Invalid code may break your interface.
          </p>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Code size={20} className="text-text" />
          <h3 className="text-lg font-medium text-text">Custom CSS</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          Add custom CSS styles to override default styling. Use CSS variables for consistency.
        </p>
        <textarea
          value={customizations.custom_css || ''}
          onChange={(e) => updateCustomization({ custom_css: e.target.value })}
          placeholder={`/* Example CSS */
.custom-header {
  background: var(--primary-color);
  padding: 1rem;
}

.btn-custom {
  border-radius: var(--button-border-radius);
  color: white;
}`}
          className="w-full h-64 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          spellCheck={false}
        />
        <div className="mt-3 text-xs text-muted">
          <p className="mb-2"><strong>Available CSS Variables:</strong></p>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <span>--primary-color</span>
            <span>--secondary-color</span>
            <span>--success-color</span>
            <span>--warning-color</span>
            <span>--danger-color</span>
            <span>--background-color</span>
            <span>--text-primary-color</span>
            <span>--text-secondary-color</span>
            <span>--button-border-radius</span>
            <span>--card-border-radius</span>
            <span>--sidebar-background</span>
            <span>--header-background</span>
          </div>
        </div>
      </div>

      {/* Custom JavaScript */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Code size={20} className="text-text" />
          <h3 className="text-lg font-medium text-text">Custom JavaScript</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          Add custom JavaScript for advanced functionality. Code will be executed after page load.
        </p>
        <textarea
          value={customizations.custom_js || ''}
          onChange={(e) => updateCustomization({ custom_js: e.target.value })}
          placeholder={`// Example JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Custom script loaded');
  
  // Your custom code here
});`}
          className="w-full h-64 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          spellCheck={false}
        />
        <div className="mt-3 text-xs text-muted">
          <p><strong>Best Practices:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Wrap code in DOMContentLoaded event listener</li>
            <li>Avoid modifying core functionality</li>
            <li>Test thoroughly in a development environment first</li>
            <li>Use console.log() for debugging</li>
          </ul>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Email Templates</h3>
        <p className="text-sm text-muted mb-4">
          Customize email headers, footers, and signatures for automated emails
        </p>
        
        <div className="space-y-4">
          {/* Email Header */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email Header HTML
            </label>
            <textarea
              value={customizations.email_header_html || ''}
              onChange={(e) => updateCustomization({ email_header_html: e.target.value })}
              placeholder="<div style='background: #f0f0f0; padding: 20px;'>
  <img src='logo.png' alt='School Logo' />
</div>"
              className="w-full h-32 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Email Footer */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email Footer HTML
            </label>
            <textarea
              value={customizations.email_footer_html || ''}
              onChange={(e) => updateCustomization({ email_footer_html: e.target.value })}
              placeholder="<div style='text-align: center; padding: 20px; color: #666;'>
  <p>&copy; 2024 School Name. All rights reserved.</p>
</div>"
              className="w-full h-32 px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              spellCheck={false}
            />
          </div>

          {/* Email Signature */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email Signature
            </label>
            <textarea
              value={customizations.email_signature || ''}
              onChange={(e) => updateCustomization({ email_signature: e.target.value })}
              placeholder="Best regards,
School Administration Team
contact@school.com"
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          <strong>Security Warning:</strong> Never include sensitive information like passwords or API keys in custom code. 
          All custom code is visible to users with browser developer tools.
        </p>
      </div>
    </div>
  );
};

export default AdvancedPanel;
