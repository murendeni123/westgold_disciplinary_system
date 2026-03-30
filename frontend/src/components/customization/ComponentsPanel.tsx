import React from 'react';

interface ComponentsPanelProps {
  customizations: any;
  updateCustomization: (updates: any) => void;
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  customizations,
  updateCustomization,
}) => {
  const borderRadiusOptions = [
    { value: '0px', label: 'None (Square)' },
    { value: '4px', label: 'Small' },
    { value: '8px', label: 'Medium' },
    { value: '12px', label: 'Large' },
    { value: '16px', label: 'Extra Large' },
    { value: '9999px', label: 'Pill' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">UI Components</h2>
        <p className="text-sm text-muted">
          Customize the appearance of buttons, cards, and other interface elements
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Button Border Radius */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Button Corner Radius
          </label>
          <p className="text-xs text-muted mb-3">
            Controls how rounded button corners appear
          </p>
          <select
            value={customizations.button_border_radius}
            onChange={(e) => updateCustomization({ button_border_radius: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {borderRadiusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.value}
              </option>
            ))}
          </select>
        </div>

        {/* Card Border Radius */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Card Corner Radius
          </label>
          <p className="text-xs text-muted mb-3">
            Controls how rounded card corners appear
          </p>
          <select
            value={customizations.card_border_radius}
            onChange={(e) => updateCustomization({ card_border_radius: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {borderRadiusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text mb-4">Preview</h3>
        
        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <p className="text-sm font-medium text-text mb-3">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 text-white font-medium"
                style={{
                  backgroundColor: customizations.primary_color,
                  borderRadius: customizations.button_border_radius,
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 text-white font-medium"
                style={{
                  backgroundColor: customizations.secondary_color,
                  borderRadius: customizations.button_border_radius,
                }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 border-2 font-medium"
                style={{
                  borderColor: customizations.primary_color,
                  color: customizations.primary_color,
                  borderRadius: customizations.button_border_radius,
                }}
              >
                Outline Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <p className="text-sm font-medium text-text mb-3">Cards</p>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 bg-surface border border-gray-200 shadow-sm"
                style={{ borderRadius: customizations.card_border_radius }}
              >
                <h4 className="font-semibold text-text mb-2">Card Title</h4>
                <p className="text-sm text-muted">
                  This is a sample card with your custom corner radius.
                </p>
              </div>
              <div
                className="p-4 bg-surface border border-gray-200 shadow-sm"
                style={{ borderRadius: customizations.card_border_radius }}
              >
                <h4 className="font-semibold text-text mb-2">Card Title</h4>
                <p className="text-sm text-muted">
                  Cards are used throughout the interface for content grouping.
                </p>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div>
            <p className="text-sm font-medium text-text mb-3">Input Fields</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text input"
                className="w-full px-3 py-2 border border-gray-300"
                style={{ borderRadius: customizations.button_border_radius }}
              />
              <select
                className="w-full px-3 py-2 border border-gray-300"
                style={{ borderRadius: customizations.button_border_radius }}
              >
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Consistent corner radius across buttons and cards creates a cohesive design. 
          Most modern interfaces use 8px-12px for a balanced look.
        </p>
      </div>
    </div>
  );
};

export default ComponentsPanel;
