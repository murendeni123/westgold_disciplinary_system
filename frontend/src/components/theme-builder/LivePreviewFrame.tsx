import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  Home,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
} from 'lucide-react';
import { DesignTokens, ThemeAssets, PortalType, PreviewPage } from '../../types/theme.types';

interface LivePreviewFrameProps {
  tokens: DesignTokens;
  assets: ThemeAssets;
  portal: PortalType;
  page: PreviewPage;
}

const LivePreviewFrame: React.FC<LivePreviewFrameProps> = ({ tokens, assets, portal, page }) => {
  const iframeRef = useRef<HTMLDivElement>(null);

  // Apply design tokens as CSS variables
  useEffect(() => {
    if (!iframeRef.current) return;

    const root = iframeRef.current;

    // Colors
    root.style.setProperty('--primary', tokens.colors.primary);
    root.style.setProperty('--secondary', tokens.colors.secondary);
    root.style.setProperty('--success', tokens.colors.success);
    root.style.setProperty('--warning', tokens.colors.warning);
    root.style.setProperty('--danger', tokens.colors.danger);
    root.style.setProperty('--background', tokens.colors.background);
    root.style.setProperty('--surface', tokens.colors.surface);
    root.style.setProperty('--text-primary', tokens.colors.textPrimary);
    root.style.setProperty('--text-secondary', tokens.colors.textSecondary);
    root.style.setProperty('--border', tokens.colors.border);

    // Typography
    root.style.setProperty('--font-primary', tokens.typography.fontPrimary);
    root.style.setProperty('--font-secondary', tokens.typography.fontSecondary);
    root.style.setProperty('--font-size-base', tokens.typography.baseFontSize);

    // Components
    root.style.setProperty('--button-radius', tokens.components.buttonRadius);
    root.style.setProperty('--card-radius', tokens.components.cardRadius);
    root.style.setProperty('--input-radius', tokens.components.inputRadius);
    root.style.setProperty('--border-width', tokens.components.borderWidth);

    // Layout
    root.style.setProperty('--sidebar-width', tokens.layout.sidebarWidth);
    root.style.setProperty('--header-height', tokens.layout.headerHeight);
  }, [tokens]);

  const renderPreviewContent = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPreview tokens={tokens} assets={assets} portal={portal} />;
      case 'login':
        return <LoginPreview tokens={tokens} assets={assets} />;
      case 'students':
        return <StudentsPreview tokens={tokens} assets={assets} portal={portal} />;
      default:
        return <DashboardPreview tokens={tokens} assets={assets} portal={portal} />;
    }
  };

  return (
    <div
      ref={iframeRef}
      className="w-full h-full overflow-auto"
      style={{
        fontFamily: tokens.typography.fontPrimary,
        fontSize: tokens.typography.baseFontSize,
        backgroundColor: tokens.colors.background,
      }}
    >
      {renderPreviewContent()}
    </div>
  );
};

// =====================================================
// DASHBOARD PREVIEW
// =====================================================

interface PreviewProps {
  tokens: DesignTokens;
  assets: ThemeAssets;
  portal: PortalType;
}

const DashboardPreview: React.FC<PreviewProps> = ({ tokens, assets, portal }) => {
  const getPortalColor = () => {
    switch (portal) {
      case 'admin':
        return tokens.colors.primary;
      case 'teacher':
        return tokens.colors.success;
      case 'parent':
        return tokens.colors.secondary;
      default:
        return tokens.colors.primary;
    }
  };

  const stats = [
    { label: 'Total Students', value: '1,234', icon: Users, color: tokens.colors.primary },
    { label: 'Active Cases', value: '45', icon: FileText, color: tokens.colors.warning },
    { label: 'Resolved', value: '189', icon: Award, color: tokens.colors.success },
    { label: 'This Month', value: '+12%', icon: TrendingUp, color: tokens.colors.secondary },
  ];

  return (
    <div className="flex h-full" style={{ backgroundColor: tokens.colors.background }}>
      {/* Sidebar */}
      <div
        className="flex flex-col"
        style={{
          width: tokens.layout.sidebarWidth,
          backgroundColor: getPortalColor(),
          color: 'white',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 p-6 border-b border-white/10"
          style={{ height: tokens.layout.headerHeight }}
        >
          {assets.logo ? (
            <img src={assets.logo} alt="Logo" className="h-8 w-8 object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"
              style={{ borderRadius: tokens.components.buttonRadius }}
            >
              <Home size={20} />
            </div>
          )}
          <span
            className="font-bold text-lg"
            style={{ fontFamily: tokens.typography.fontSecondary }}
          >
            School Portal
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Users, label: 'Students', active: false },
            { icon: BookOpen, label: 'Classes', active: false },
            { icon: Calendar, label: 'Calendar', active: false },
            { icon: FileText, label: 'Reports', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              style={{
                backgroundColor: item.active ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: tokens.components.buttonRadius,
                fontSize: tokens.typography.baseFontSize,
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 border-b"
          style={{
            height: tokens.layout.headerHeight,
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderWidth: tokens.components.borderWidth,
          }}
        >
          <div className="flex items-center gap-4">
            <button className="lg:hidden">
              <Menu size={24} style={{ color: tokens.colors.textPrimary }} />
            </button>
            <h1
              className="text-2xl font-bold"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.typography.fontSecondary,
                fontWeight: tokens.typography.fontWeights.bold,
              }}
            >
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: tokens.colors.textSecondary }}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border"
                style={{
                  borderRadius: tokens.components.inputRadius,
                  borderColor: tokens.colors.border,
                  borderWidth: tokens.components.borderWidth,
                  fontSize: tokens.typography.baseFontSize,
                  backgroundColor: tokens.colors.surface,
                  color: tokens.colors.textPrimary,
                }}
              />
            </div>
            <button className="relative">
              <Bell size={24} style={{ color: tokens.colors.textPrimary }} />
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                style={{ backgroundColor: tokens.colors.danger }}
              >
                3
              </span>
            </button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: getPortalColor() }}
            >
              SA
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border"
                style={{
                  backgroundColor: tokens.colors.surface,
                  borderRadius: tokens.components.cardRadius,
                  borderColor: tokens.colors.border,
                  borderWidth: tokens.components.borderWidth,
                  boxShadow:
                    tokens.components.shadowLevel === 'none'
                      ? 'none'
                      : tokens.components.shadowLevel === 'sm'
                      ? '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                      : tokens.components.shadowLevel === 'medium'
                      ? '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      : tokens.components.shadowLevel === 'lg'
                      ? '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${stat.color}20`,
                      borderRadius: tokens.components.buttonRadius,
                    }}
                  >
                    <stat.icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
                <p
                  className="text-sm mb-1"
                  style={{
                    color: tokens.colors.textSecondary,
                    fontSize: tokens.typography.baseFontSize,
                  }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{
                    color: tokens.colors.textPrimary,
                    fontWeight: tokens.typography.fontWeights.bold,
                  }}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity Card */}
          <div
            className="p-6 border"
            style={{
              backgroundColor: tokens.colors.surface,
              borderRadius: tokens.components.cardRadius,
              borderColor: tokens.colors.border,
              borderWidth: tokens.components.borderWidth,
            }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{
                color: tokens.colors.textPrimary,
                fontFamily: tokens.typography.fontSecondary,
                fontWeight: tokens.typography.fontWeights.semibold,
              }}
            >
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-4 pb-4 border-b last:border-0" style={{ borderColor: tokens.colors.border }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: getPortalColor() }}
                  >
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: tokens.colors.textPrimary, fontWeight: tokens.typography.fontWeights.medium }}>
                      New incident reported
                    </p>
                    <p className="text-sm" style={{ color: tokens.colors.textSecondary }}>
                      2 minutes ago
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 text-white"
                    style={{
                      backgroundColor: getPortalColor(),
                      borderRadius: tokens.components.buttonRadius,
                      fontSize: tokens.typography.baseFontSize,
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// LOGIN PREVIEW
// =====================================================

const LoginPreview: React.FC<Omit<PreviewProps, 'portal'>> = ({ tokens, assets }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundColor: tokens.colors.background,
        backgroundImage: assets.loginBackground ? `url(${assets.loginBackground})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="w-full max-w-md p-8 border backdrop-blur-sm"
        style={{
          backgroundColor: `${tokens.colors.surface}f0`,
          borderRadius: tokens.components.cardRadius,
          borderColor: tokens.colors.border,
          borderWidth: tokens.components.borderWidth,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {assets.logo ? (
            <img src={assets.logo} alt="Logo" className="h-16 mx-auto mb-4" />
          ) : (
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: tokens.colors.primary }}
            >
              <Home size={32} className="text-white" />
            </div>
          )}
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: tokens.colors.textPrimary,
              fontFamily: tokens.typography.fontSecondary,
              fontWeight: tokens.typography.fontWeights.bold,
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: tokens.colors.textSecondary }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label
              className="block mb-2 font-medium"
              style={{ color: tokens.colors.textPrimary, fontSize: tokens.typography.baseFontSize }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 border"
              style={{
                borderRadius: tokens.components.inputRadius,
                borderColor: tokens.colors.border,
                borderWidth: tokens.components.borderWidth,
                fontSize: tokens.typography.baseFontSize,
                backgroundColor: tokens.colors.surface,
                color: tokens.colors.textPrimary,
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2 font-medium"
              style={{ color: tokens.colors.textPrimary, fontSize: tokens.typography.baseFontSize }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border"
              style={{
                borderRadius: tokens.components.inputRadius,
                borderColor: tokens.colors.border,
                borderWidth: tokens.components.borderWidth,
                fontSize: tokens.typography.baseFontSize,
                backgroundColor: tokens.colors.surface,
                color: tokens.colors.textPrimary,
              }}
            />
          </div>

          <button
            className="w-full py-3 text-white font-semibold"
            style={{
              backgroundColor: tokens.colors.primary,
              borderRadius: tokens.components.buttonRadius,
              fontSize: tokens.typography.baseFontSize,
              fontWeight: tokens.typography.fontWeights.semibold,
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STUDENTS PREVIEW
// =====================================================

const StudentsPreview: React.FC<PreviewProps> = ({ tokens, assets, portal }) => {
  const getPortalColor = () => {
    switch (portal) {
      case 'admin':
        return tokens.colors.primary;
      case 'teacher':
        return tokens.colors.success;
      case 'parent':
        return tokens.colors.secondary;
      default:
        return tokens.colors.primary;
    }
  };

  const students = [
    { name: 'John Doe', grade: '10A', status: 'Active', incidents: 2 },
    { name: 'Jane Smith', grade: '10B', status: 'Active', incidents: 0 },
    { name: 'Mike Johnson', grade: '10A', status: 'Active', incidents: 1 },
  ];

  return (
    <div className="flex h-full" style={{ backgroundColor: tokens.colors.background }}>
      {/* Sidebar (simplified) */}
      <div
        className="w-64 p-4"
        style={{
          backgroundColor: getPortalColor(),
          color: 'white',
        }}
      >
        <div className="font-bold text-lg mb-8">School Portal</div>
        <nav className="space-y-2">
          <div className="px-4 py-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            Students
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{
              color: tokens.colors.textPrimary,
              fontFamily: tokens.typography.fontSecondary,
            }}
          >
            Students
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div
            className="border rounded-lg overflow-hidden"
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
            }}
          >
            <table className="w-full">
              <thead style={{ backgroundColor: `${getPortalColor()}10` }}>
                <tr>
                  <th className="px-6 py-3 text-left" style={{ color: tokens.colors.textPrimary }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left" style={{ color: tokens.colors.textPrimary }}>
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left" style={{ color: tokens.colors.textPrimary }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left" style={{ color: tokens.colors.textPrimary }}>
                    Incidents
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} className="border-t" style={{ borderColor: tokens.colors.border }}>
                    <td className="px-6 py-4" style={{ color: tokens.colors.textPrimary }}>
                      {student.name}
                    </td>
                    <td className="px-6 py-4" style={{ color: tokens.colors.textSecondary }}>
                      {student.grade}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: `${tokens.colors.success}20`,
                          color: tokens.colors.success,
                        }}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: tokens.colors.textPrimary }}>
                      {student.incidents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreviewFrame;
