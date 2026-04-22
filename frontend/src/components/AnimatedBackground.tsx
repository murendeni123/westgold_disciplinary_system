import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />

      {/* Static decorative shapes — no animation to avoid GPU/RAF overhead on mobile */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-3xl rotate-12" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full" />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-2xl -rotate-12" />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-pink-400/15 to-purple-400/15 rounded-full" />
    </div>
  );
};

export default AnimatedBackground;
