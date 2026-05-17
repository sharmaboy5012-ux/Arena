import React from 'react';

export const FunturnaLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center overflow-hidden">
      {/* Background animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: '#39ff14',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center z-10">
        {/* Outer rotating ring */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Ring 1 - outer */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: '#39ff14',
              borderRightColor: '#39ff1466',
              animation: 'spin 1.5s linear infinite',
            }}
          />

          {/* Ring 2 - middle */}
          <div
            className="absolute inset-3 rounded-full border-2 border-transparent"
            style={{
              borderBottomColor: '#39ff14',
              borderLeftColor: '#39ff1466',
              animation: 'spin 1s linear infinite reverse',
            }}
          />

          {/* Ring 3 - inner glow */}
          <div
            className="absolute inset-6 rounded-full border border-transparent"
            style={{
              borderTopColor: '#39ff1488',
              animation: 'spin 2s linear infinite',
            }}
          />

          {/* Center gaming crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-12 h-12">
              {/* Crosshair lines */}
              <div
                className="absolute top-0 left-1/2 w-0.5 h-3 bg-neon -translate-x-1/2"
                style={{ animation: 'crosshairPulse 1.5s ease-in-out infinite' }}
              />
              <div
                className="absolute bottom-0 left-1/2 w-0.5 h-3 bg-neon -translate-x-1/2"
                style={{ animation: 'crosshairPulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}
              />
              <div
                className="absolute left-0 top-1/2 w-3 h-0.5 bg-neon -translate-y-1/2"
                style={{ animation: 'crosshairPulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }}
              />
              <div
                className="absolute right-0 top-1/2 w-3 h-0.5 bg-neon -translate-y-1/2"
                style={{ animation: 'crosshairPulse 1.5s ease-in-out infinite', animationDelay: '0.6s' }}
              />
              {/* Center dot */}
              <div
                className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-neon"
                style={{ animation: 'centerPulse 1s ease-in-out infinite' }}
              />
            </div>
          </div>

          {/* Orbiting dots */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-neon"
              style={{
                animation: `orbit 2s linear infinite`,
                animationDelay: `${i * 0.5}s`,
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Logo text */}
        <h1
          className="font-orbitron text-2xl font-black tracking-wider mb-3"
          style={{
            animation: 'textGlow 2s ease-in-out infinite',
            color: '#39ff14',
          }}
        >
          FUNTURNA
        </h1>

        {/* Loading text with typing effect */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-gray-400 text-sm">{text}</span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-neon"
                style={{
                  animation: 'dotBounce 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-dark-700 rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-transparent via-neon to-transparent"
            style={{
              animation: 'loadingBar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
        @keyframes crosshairPulse {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) scaleY(1); }
          50% { opacity: 1; transform: translateX(-50%) scaleY(1.3); }
        }
        @keyframes centerPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 5px #39ff14; }
          50% { transform: scale(1.5); box-shadow: 0 0 15px #39ff14, 0 0 30px #39ff1466; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(56px) rotate(0deg) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: rotate(360deg) translateX(56px) rotate(-360deg) scale(0.5); opacity: 0; }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 5px #39ff1466, 0 0 10px #39ff1433; }
          50% { text-shadow: 0 0 15px #39ff14, 0 0 30px #39ff1488, 0 0 45px #39ff1444; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes loadingBar {
          0% { transform: translateX(-100%); width: 50%; }
          50% { width: 30%; }
          100% { transform: translateX(250%); width: 50%; }
        }
      `}</style>
    </div>
  );
};
