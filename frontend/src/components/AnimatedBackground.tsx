import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#F2EBE2]" />
      
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-800/20 to-[#121821]/60" />

      {/* Radial Glow Effect — subtle cyan glow in top-left corner (desktop only) */}
      <div className="hidden lg:block absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
      <div className="hidden lg:block absolute -bottom-40 -right-40 w-80 h-80 bg-accent-cyan/8 rounded-full filter blur-3xl" />
    </div>
  );
};

export default AnimatedBackground;
