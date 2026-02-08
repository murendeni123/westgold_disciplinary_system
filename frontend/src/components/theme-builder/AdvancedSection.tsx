import React, { useState } from 'react';
import { Code, AlertTriangle, Shield } from 'lucide-react';
import { AdvancedOverrides } from '../../types/theme.types';

interface AdvancedSectionProps {
  advancedOverrides: AdvancedOverrides;
  onUpdateAdvanced: (overrides: AdvancedOverrides) => void;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  advancedOverrides,
  onUpdateAdvanced,
}) => {
  const [showWarning, setShowWarning] = useState(true);

  const updateField = (field: keyof AdvancedOverrides, value: string) => {
    onUpdateAdvanced({
      ...advancedOverrides,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Customization</h3>
        <p className="text-sm text-gray-600">
          Add custom CSS and JavaScript for advanced styling and functionality.
        </p>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-1">Platform Admin Only</h4>
              <p className="text-sm text-orange-800 mb-3">
                Custom CSS and JavaScript can affect the functionality and appearance of your entire
                application. Only use this feature if you understand web development. Invalid code may
                break your portal.
              </p>
              <ul className="text-sm text-orange-800 space-y-1 mb-3">
                <li>• CSS is scoped to prevent global conflicts</li>
                <li>• JavaScript is disabled by default for security</li>
                <li>• Unsafe patterns (eval, expression) are blocked</li>
                <li>• Changes apply after publishing</li>
              </ul>
              <button
                onClick={() => setShowWarning(false)}
                className="text-sm text-orange-900 font-medium hover:text-orange-700"
              >
                I understand, proceed →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Code size={18} className="text-gray-600" />
          <label className="block text-sm font-medium text-gray-900">
            Custom CSS
          </label>
        </div>
        <p className="text-xs text-gray-600">
          Add custom CSS styles to override or extend the default theme. Styles are scoped to prevent
          conflicts.
        </p>

        <div className="relative">
          <textarea
            value={advancedOverrides.customCss || ''}
            onChange={(e) => updateField('customCss', e.target.value)}
            placeholder={`/* Example: Custom button styles */
.custom-button {
  background: linear-gradient(to right, #667eea, #764ba2);
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
}

/* Example: Custom card hover effect */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}`}
            rows={16}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-gray-50"
            spellCheck={false}
          />
          <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
            CSS
          </div>
        </div>

        {/* CSS Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield size={16} />
            CSS Best Practices
          </h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use specific class names to avoid conflicts</li>
            <li>• Avoid !important unless absolutely necessary</li>
            <li>• Test thoroughly before publishing</li>
            <li>• Use CSS variables for consistency: var(--primary-color)</li>
            <li>• Avoid modifying core layout styles</li>
          </ul>
        </div>
      </div>

      {/* Custom JavaScript (Disabled) */}
      <div className="space-y-4 opacity-50 pointer-events-none">
        <div className="flex items-center gap-2">
          <Code size={18} className="text-gray-600" />
          <label className="block text-sm font-medium text-gray-900">
            Custom JavaScript
          </label>
          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
            Disabled for Security
          </span>
        </div>
        <p className="text-xs text-gray-600">
          Custom JavaScript is disabled by default for security reasons. Contact platform support to
          enable this feature.
        </p>

        <textarea
          value={advancedOverrides.customJs || ''}
          disabled
          placeholder="// Custom JavaScript is disabled for security"
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* Scoped Styles Preview */}
      {advancedOverrides.customCss && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            CSS Preview
          </h4>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <style>{advancedOverrides.customCss}</style>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Preview how your custom CSS affects elements:
              </p>
              <div className="custom-button inline-block cursor-pointer">
                Custom Button
              </div>
              <div className="card p-4 bg-white border border-gray-200 rounded-lg">
                <h5 className="font-semibold mb-2">Custom Card</h5>
                <p className="text-sm text-gray-600">Hover over this card to see custom effects</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Defaults */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all custom CSS? This cannot be undone.')) {
              onUpdateAdvanced({
                customCss: '',
                customJs: '',
              });
            }
          }}
          className="px-4 py-2 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
          Clear All Custom Code
        </button>
      </div>
    </div>
  );
};

export default AdvancedSection;
