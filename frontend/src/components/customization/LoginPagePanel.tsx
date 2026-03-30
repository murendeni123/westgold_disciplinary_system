import React from 'react';
import Input from '../Input';

interface LoginPagePanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const LoginPagePanel: React.FC<LoginPagePanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Login Page</h2>
        <p className="text-sm text-muted">
          Customize the welcome message and appearance of your login page
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Welcome Message */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Welcome Message
          </label>
          <p className="text-xs text-muted mb-3">
            Main greeting displayed on the login page
          </p>
          <input
            type="text"
            value={customizations.login_welcome_message || ''}
            onChange={(e) => updateCustomization({ login_welcome_message: e.target.value })}
            placeholder="Welcome to Our School"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Tagline
          </label>
          <p className="text-xs text-muted mb-3">
            Subtitle or motto displayed below the welcome message
          </p>
          <input
            type="text"
            value={customizations.login_tagline || ''}
            onChange={(e) => updateCustomization({ login_tagline: e.target.value })}
            placeholder="Excellence in Education"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Background Color
          </label>
          <p className="text-xs text-muted mb-3">
            Background color for the login page
          </p>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: customizations.login_background_color }}
            />
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="color"
                value={customizations.login_background_color}
                onChange={(e) => updateCustomization({ login_background_color: e.target.value })}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customizations.login_background_color}
                onChange={(e) => updateCustomization({ login_background_color: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        <div
          className="rounded-lg p-8 flex items-center justify-center min-h-[300px]"
          style={{ backgroundColor: customizations.login_background_color }}
        >
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-border rounded-lg mx-auto mb-4"></div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {customizations.login_welcome_message || 'Welcome to Our School'}
            </h1>
            <p className="text-lg text-muted mb-8">
              {customizations.login_tagline || 'Excellence in Education'}
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
              <button
                className="w-full px-4 py-2 text-white font-medium rounded-lg"
                style={{ backgroundColor: customizations.primary_color }}
                disabled
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Keep your welcome message concise and welcoming. 
          A good tagline reinforces your school's values and mission.
        </p>
      </div>
    </div>
  );
};

export default LoginPagePanel;
