import React from "react";

export default function TrustedOrganizations() {
  const organizations = [
    { 
      name: "Paymentology", 
      logo: (
        <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="20" fill="#3B82F6"/>
          <path d="M25 35C25 32.2386 27.2386 30 30 30C32.7614 30 35 27.7614 35 25" stroke="white" strokeWidth="3"/>
          <text x="55" y="37" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="600" fill="#1e40af">paymentology</text>
        </svg>
      )
    },
    { 
      name: "NCPL", 
      logo: (
        <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="15" width="15" height="30" fill="#FF6B35" rx="2"/>
          <rect x="30" y="15" width="15" height="30" fill="#F7931E" rx="2"/>
          <rect x="50" y="15" width="15" height="30" fill="#FBB040" rx="2"/>
          <rect x="70" y="15" width="15" height="30" fill="#00A8E1" rx="2"/>
          <text x="95" y="37" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" fill="#2D3748">NCPL</text>
        </svg>
      )
    },
    { 
      name: "VDCapital", 
      logo: (
        <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="160" height="40" stroke="#1e40af" strokeWidth="2" rx="4" fill="white"/>
          <text x="90" y="38" fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#1e40af" textAnchor="middle">VDCapital</text>
        </svg>
      )
    },
    { 
      name: "StartupFuel", 
      logo: (
        <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="15" width="85" height="30" fill="#000000"/>
          <rect x="100" y="15" width="90" height="30" fill="#FF3B30"/>
          <text x="52" y="37" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="white" textAnchor="middle">STARTUP</text>
          <text x="145" y="37" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="white" textAnchor="middle">FUEL</text>
        </svg>
      )
    },
    { 
      name: "Topland", 
      logo: (
        <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 35L30 20L40 35L30 30Z" fill="#0066CC"/>
          <path d="M30 30L40 35L50 25L40 28Z" fill="#0099FF"/>
          <text x="65" y="37" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="600" fill="#0066CC">Topland</text>
        </svg>
      )
    },
    { 
      name: "GoDaddy", 
      logo: (
        <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="30" r="18" fill="#1BDBDB"/>
          <path d="M22 30C22 26.6863 24.6863 24 28 24C31.3137 24 34 26.6863 34 30" stroke="white" strokeWidth="3"/>
          <circle cx="24" cy="26" r="2" fill="white"/>
          <circle cx="32" cy="26" r="2" fill="white"/>
          <text x="55" y="37" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#1BDBDB">GoDaddy</text>
        </svg>
      )
    },
    { 
      name: "Stripe", 
      logo: (
        <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 25C35 22 40 22 45 25M30 35C35 32 40 32 45 35" stroke="#635BFF" strokeWidth="3" strokeLinecap="round"/>
          <text x="60" y="37" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="600" fill="#635BFF">Stripe</text>
        </svg>
      )
    },
    { 
      name: "Amazon", 
      logo: (
        <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="20" y="35" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700" fill="#FF9900">amazon</text>
          <path d="M25 42Q80 48 135 42" stroke="#FF9900" strokeWidth="3" fill="none"/>
          <path d="M130 40L135 42L133 47" fill="#FF9900"/>
        </svg>
      )
    },
    { 
      name: "Microsoft", 
      logo: (
        <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="18" width="12" height="12" fill="#F25022"/>
          <rect x="29" y="18" width="12" height="12" fill="#7FBA00"/>
          <rect x="15" y="32" width="12" height="12" fill="#00A4EF"/>
          <rect x="29" y="32" width="12" height="12" fill="#FFB900"/>
          <text x="50" y="37" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" fill="#5E5E5E">Microsoft</text>
        </svg>
      )
    },
    { 
      name: "Salesforce", 
      logo: (
        <svg viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="8" fill="#00A1E0"/>
          <circle cx="40" cy="22" r="10" fill="#00A1E0"/>
          <circle cx="35" cy="35" r="9" fill="#00A1E0"/>
          <circle cx="50" cy="32" r="7" fill="#00A1E0"/>
          <text x="65" y="37" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" fill="#00A1E0">Salesforce</text>
        </svg>
      )
    },
    { 
      name: "Adobe", 
      logo: (
        <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 15L35 45L50 15" stroke="#FF0000" strokeWidth="4" fill="none"/>
          <text x="65" y="37" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#FF0000">Adobe</text>
        </svg>
      )
    },
    { 
      name: "Oracle", 
      logo: (
        <svg viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="35" cy="30" rx="22" ry="15" stroke="#FF0000" strokeWidth="3" fill="none"/>
          <text x="65" y="37" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#FF0000">ORACLE</text>
        </svg>
      )
    },
  ];

  // Double the items for seamless loop
  const items = [...organizations, ...organizations];

  return (
    <div style={{
      width: '100%',
      padding: '60px 20px',
      // background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto 50px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#000000ff',
          letterSpacing: '2px',
          marginBottom: '12px',
          textTransform: 'uppercase'
        }}>
          TRUSTED BY
        </div>
        <h2 style={{
          fontSize: '30px',
          fontWeight: '500',
          color: '#0d9488',
          margin: '0 0 16px'
        }}>
          Leading Organizations Worldwide
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          margin: 0,
          lineHeight: '1.6'
        }}>
          Join thousands of companies that trust our platform for their business needs
        </p>
      </div>

      {/* Scrolling Logos Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        padding: '20px 0',
        background: '#ffffff',
        // borderTop: '1px solid #e2e8f0',
        // borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Left Fade */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '100px',
          background: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* Right Fade */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '100px',
          background: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* Scrolling Content */}
        <div style={{
          display: 'flex',
          gap: '60px',
          animation: 'scroll 40s linear infinite',
          width: 'fit-content'
        }}>
          {items.map((org, index) => (
            <div
              key={index}
              style={{
                minWidth: '200px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {org.logo}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      {/* <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        maxWidth: '1000px',
        margin: '60px auto 0',
        padding: '0 20px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
        }}
        >
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            500+
          </div>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Global Partners
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
        }}
        >
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            99.9%
          </div>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Uptime Guarantee
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
        }}
        >
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            24/7
          </div>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Premium Support
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
        }}
        >
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            10M+
          </div>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Active Users
          </div> 
        </div>
      </div>*/}

      {/* CSS Animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}