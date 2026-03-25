import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const PremiumBannerSlider = ({ navigate }) => {
  const [banners, setBanners] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [pauseBanner, setPauseBanner] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load banners from backend
  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/banners/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      // Transform backend data to frontend format
      const transformedBanners = response.data.map(banner => ({
        id: banner._id || banner.id,
        title: banner.title || banner.name || '',
        subtitle: banner.subtitle || banner.category || '',
        description: banner.description || '',
        image: banner.image_url
  ? `${API_BASE_URL}${banner.image_url}`
  : '',

        link: banner.link_url || banner.action_url || banner.link || '',
        buttonText: banner.button_text || banner.cta_text || 'Learn More',
        order: banner.order || banner.position || 0,
        isActive: banner.is_active !== false,
        startDate: banner.start_date,
        endDate: banner.end_date,
        backgroundColor: banner.background_color || '',
        textColor: banner.text_color || '#ffffff',
        buttonColor: banner.button_color || '#fbbf24',
        buttonTextColor: banner.button_text_color || '#1f2937',
        features: banner.features || [],
        tags: banner.tags || []
      })).sort((a, b) => a.order - b.order); // Sort by order
      
      setBanners(transformedBanners);
      
    } catch (err) {
      console.error("Failed to load banners:", err);
      setError("Failed to load banners. Please try again.");
      
      // Fallback to sample banners
      setBanners([
        {
          id: '1',
          title: 'Professional Document Signing',
          subtitle: 'Premium Feature',
          description: 'Streamline your workflow with our advanced e-signature solution',
          image: '',
          link: '/sign-up',
          buttonText: 'Get Started',
          backgroundColor: 'linear-gradient(135deg, #eae666 0%, #5bafc2 100%)'
        },
        {
          id: '2',
          title: 'AI-Powered Templates',
          subtitle: 'New',
          description: 'Generate professional documents instantly with AI assistance',
          image: '',
          link: '/templates',
          buttonText: 'Explore Templates',
          backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Auto-advance banner
  useEffect(() => {
    if (banners.length <= 1 || pauseBanner || isTransitioning) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [activeBanner, pauseBanner, isTransitioning, banners.length]);

  const handlePrevious = () => {
    if (isTransitioning || banners.length <= 1) return;
    setIsTransitioning(true);
    setActiveBanner(prev => prev === 0 ? banners.length - 1 : prev - 1);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleNext = () => {
    if (isTransitioning || banners.length <= 1) return;
    setIsTransitioning(true);
    setActiveBanner(prev => prev === banners.length - 1 ? 0 : prev + 1);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleDotClick = (index) => {
    if (isTransitioning || index === activeBanner || banners.length <= 1) return;
    setIsTransitioning(true);
    setActiveBanner(index);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleBannerClick = (banner) => {
    if (banner.link) {
      navigate(banner.link);
      
      // Track banner click in backend
      trackBannerClick(banner.id);
    }
  };

  const trackBannerClick = async (bannerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/banners/${bannerId}/click`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
    } catch (err) {
      console.error("Failed to track banner click:", err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        maxWidth: '1000px',
        margin: '0 auto',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #f2c81f00 0%, #fef3c700 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 600,
          animation: 'pulse 2s infinite',
        }}>
          Loading banners...
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Render error state
  if (error && banners.length === 0) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #667eea00 0%, #764ba200 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      }}>
        <div style={{
          color: '#ffffff',
          fontSize: '18px',
          textAlign: 'center',
          padding: '20px',
        }}>
          {error}
          <button 
            onClick={loadBanners}
            style={{
              marginTop: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render if no banners
  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[activeBanner];

  return (
    <div 
      className="banner-slider-container"
      onMouseEnter={() => setPauseBanner(true)}
      onMouseLeave={() => setPauseBanner(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        maxWidth: '1200px',
        margin: '30px auto',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        background: currentBanner.backgroundColor || 'linear-gradient(135deg, #66eaa400 0%, #4ba28c00 100%)',
      }}
    >
      {/* Banner Slides */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === activeBanner ? 1 : 0,
              transform: index === activeBanner ? 'scale(1)' : 'scale(1.05)',
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: index === activeBanner ? 'auto' : 'none',
            }}
          >
            {/* Background Image with Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: banner.image
  ? `url(${banner.image}) center / cover no-repeat`
  : banner.backgroundColor || 'linear-gradient(135deg, #667eea00 0%, #764ba200 100%)',

              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)',
              }} />
            </div>

            {/* Content */}
            <div style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 80px',
              maxWidth: '1400px',
              margin: '0 auto',
            }}>
              <div style={{
                maxWidth: '600px',
                color: banner.textColor || '#ffffff',
                animation: index === activeBanner ? 'slideInLeft 0.8s ease-out' : 'none',
              }}>
                {/* Subtitle */}
                {banner.subtitle && (
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: banner.buttonColor || '#fbbf24',
                    marginBottom: '16px',
                    opacity: 0.9,
                  }}>
                    {banner.subtitle}
                  </div>
                )}

                {/* Title */}
                <h2 style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: '20px',
                  textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}>
                  {banner.title}
                </h2>

                {/* Description */}
                {banner.description && (
                  <p style={{
                    fontSize: '18px',
                    lineHeight: 1.6,
                    marginBottom: '32px',
                    color: 'rgba(255,255,255,0.9)',
                    maxWidth: '500px',
                  }}>
                    {banner.description}
                  </p>
                )}

                {/* CTA Button */}
                {banner.link && (
                  <button
                    onClick={() => handleBannerClick(banner)}
                    style={{
                      background: banner.buttonColor ? 
                        `linear-gradient(135deg, ${banner.buttonColor} 0%, ${darkenColor(banner.buttonColor, 20)} 100%)` :
                        'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      border: 'none',
                      padding: '16px 36px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: banner.buttonTextColor || '#1f2937',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    {banner.buttonText || 'Learn More'}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z"/>
                    </svg>
                  </button>
                )}

                {/* Tags */}
                {banner.tags && banner.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '24px',
                  }}>
                    {banner.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.9)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            {/* <ChevronLeft size={24} color="#ffffff" /> */}
          </button>

          <button
            onClick={handleNext}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            {/* <ChevronRight size={24} color="#ffffff" /> */}
          </button>
        </>
      )}

      {/* Progress Bar */}
      {banners.length > 1 && !pauseBanner && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '80px',
          right: '80px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          zIndex: 10,
        }}>
          <div
            style={{
              height: '100%',
              background: currentBanner.buttonColor ? 
                `linear-gradient(90deg, ${currentBanner.buttonColor} 0%, ${darkenColor(currentBanner.buttonColor, 20)} 100%)` :
                'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
              width: '100%',
              transformOrigin: 'left',
              animation: 'progressBar 5s linear',
            }}
          />
        </div>
      )}

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          zIndex: 10,
        }}>
          {banners.map((banner, index) => (
            <button
              key={banner.id || index}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
              style={{
                width: index === activeBanner ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === activeBanner 
                  ? (currentBanner.buttonColor ? 
                      `linear-gradient(90deg, ${currentBanner.buttonColor} 0%, ${darkenColor(currentBanner.buttonColor, 20)} 100%)` :
                      'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)')
                  : 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0,
                boxShadow: index === activeBanner ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (index !== activeBanner) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.width = '20px';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== activeBanner) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                  e.target.style.width = '8px';
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Banner Counter */}
      {banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px',
          borderRadius: '20px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 10,
        }}>
          {activeBanner + 1} / {banners.length}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progressBar {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to darken a color
function darkenColor(color, percent) {
  if (color.startsWith('#')) {
    let r = parseInt(color.substr(1, 2), 16);
    let g = parseInt(color.substr(3, 2), 16);
    let b = parseInt(color.substr(5, 2), 16);
    
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return color;
}

export default PremiumBannerSlider;