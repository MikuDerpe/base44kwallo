import React from 'react';

export default function AnimatedAurora({ 
  colorStops = ["#3A29FF", "#FF94B4", "#FF3232"],
  blend = 0.5,
  amplitude = 1.0,
  speed = 0.5,
  className = ""
}) {
  const animationDuration = `${20 / speed}s`;
  
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <style>{`
        @keyframes aurora-1 {
          0%, 100% {
            transform: translateX(-10%) translateY(-10%) rotate(0deg) scale(1);
            opacity: ${0.3 + blend * 0.4};
          }
          33% {
            transform: translateX(20%) translateY(20%) rotate(120deg) scale(${1 + amplitude * 0.3});
            opacity: ${0.5 + blend * 0.3};
          }
          66% {
            transform: translateX(-20%) translateY(10%) rotate(240deg) scale(${0.9 + amplitude * 0.2});
            opacity: ${0.4 + blend * 0.35};
          }
        }
        
        @keyframes aurora-2 {
          0%, 100% {
            transform: translateX(10%) translateY(10%) rotate(0deg) scale(1);
            opacity: ${0.4 + blend * 0.3};
          }
          33% {
            transform: translateX(-15%) translateY(-20%) rotate(-120deg) scale(${1.1 + amplitude * 0.2});
            opacity: ${0.6 + blend * 0.2};
          }
          66% {
            transform: translateX(15%) translateY(-10%) rotate(-240deg) scale(${0.95 + amplitude * 0.15});
            opacity: ${0.45 + blend * 0.25};
          }
        }
        
        @keyframes aurora-3 {
          0%, 100% {
            transform: translateX(0%) translateY(15%) rotate(0deg) scale(1);
            opacity: ${0.35 + blend * 0.35};
          }
          33% {
            transform: translateX(10%) translateY(-15%) rotate(90deg) scale(${1.15 + amplitude * 0.25});
            opacity: ${0.55 + blend * 0.25};
          }
          66% {
            transform: translateX(-10%) translateY(5%) rotate(180deg) scale(${0.85 + amplitude * 0.3});
            opacity: ${0.4 + blend * 0.3};
          }
        }
        
        .aurora-blob {
          filter: blur(40px);
        }
      `}</style>
      
      {/* Aurora Blob 1 */}
      <div 
        className="aurora-blob absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorStops[0]} 0%, transparent 70%)`,
          animation: `aurora-1 ${animationDuration} ease-in-out infinite`,
        }}
      />
      
      {/* Aurora Blob 2 */}
      <div 
        className="aurora-blob absolute top-1/2 right-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorStops[1]} 0%, transparent 70%)`,
          animation: `aurora-2 ${animationDuration} ease-in-out infinite`,
          animationDelay: `${-parseFloat(animationDuration) / 3}s`,
        }}
      />
      
      {/* Aurora Blob 3 */}
      <div 
        className="aurora-blob absolute bottom-1/4 left-1/2 w-[550px] h-[550px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorStops[2]} 0%, transparent 70%)`,
          animation: `aurora-3 ${animationDuration} ease-in-out infinite`,
          animationDelay: `${-parseFloat(animationDuration) * 2 / 3}s`,
        }}
      />
      
      {/* Overlay gradient for better blending */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}