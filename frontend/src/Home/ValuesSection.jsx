import React from 'react';
import {
  LuLightbulb,
  LuShieldCheck,
  LuZap,
  LuEye
} from "react-icons/lu";

export default function ValuesSection() {
  return (
    <section style={styles.section}>
      
      {/* 🎥 Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={styles.video}
      >
        <source src="/videos/values-bg.mp4" type="video/mp4" />
      </video>

      {/* 🌫 Overlay */}
      <div style={styles.overlay}></div>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Values that drive us</h2>
          <p style={styles.subtitle}>The core principles behind every feature we build.</p>
        </div>

        {/* Timeline Container */}
        <div style={styles.timelineContainer}>
          {/* Vertical Timeline Line */}
          <div style={styles.timelineLine}></div>

          {/* Timeline Items */}
          <div style={styles.timelineItems}>
            
            {/* Item 1 - Left Side */}
            <div style={styles.timelineItem}>
              <div style={styles.contentLeft}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={styles.iconCircle}>
  <LuLightbulb size={22} color="#ffffff" />
</div>
                    <h3 style={styles.cardTitle}>Simplicity</h3>
                  </div>
                  <p style={styles.cardText}>
                    We believe complexity is the enemy of progress. Our UI is designed to be intuitive for everyone.
                  </p>
                </div>
              </div>
              
              {/* Timeline Dot */}
              <div style={styles.timelineDot}></div>
              
              <div style={styles.emptyRight}></div>
            </div>

            {/* Item 2 - Right Side */}
            <div style={styles.timelineItem}>
              <div style={styles.emptyLeft}></div>
              
              {/* Timeline Dot */}
              <div style={styles.timelineDot}></div>
              
              <div style={styles.contentRight}>
                <div style={styles.card}>
                  <div style={styles.cardHeaderRight}>
                   <div style={styles.iconCircle}>
  <LuShieldCheck size={22} color="#ffffff" />
</div>
                    <h3 style={styles.cardTitle}>Security</h3>
                  </div>
                  <p style={styles.cardText}>
                    Privacy is a human right. We treat your data with the highest level of protection available.
                  </p>
                </div>
              </div>
            </div>

            {/* Item 3 - Left Side */}
            <div style={styles.timelineItem}>
              <div style={styles.contentLeft}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={styles.iconCircle}>
  <LuZap size={22} color="#ffffff" />
</div>
                    <h3 style={styles.cardTitle}>Speed</h3>
                  </div>
                  <p style={styles.cardText}>
                    Time is the most valuable resource. We optimize every workflow to give it back to you.
                  </p>
                </div>
              </div>
              
              {/* Timeline Dot */}
              <div style={styles.timelineDot}></div>
              
              <div style={styles.emptyRight}></div>
            </div>

            {/* Item 4 - Right Side */}
            <div style={styles.timelineItem}>
              <div style={styles.emptyLeft}></div>
              
              {/* Timeline Dot */}
              <div style={styles.timelineDot}></div>
              
              <div style={styles.contentRight}>
                <div style={styles.card}>
                  <div style={styles.cardHeaderRight}>
                    <div style={styles.iconCircle}>
  <LuEye size={22} color="#ffffff" />
</div>
                    <h3 style={styles.cardTitle}>Transparency</h3>
                  </div>
                  <p style={styles.cardText}>
                    Honest communication with our users and within our team is the foundation of our trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Additional styles for better responsiveness */
        @media (max-width: 768px) {
          .content-left, .content-right {
            width: 100% !important;
            padding: 0 !important;
            text-align: left !important;
          }
          
          .card {
            margin: 10px 0 !important;
            width: 100% !important;
          }
          
          .timeline-dot {
            left: 20px !important;
            transform: none !important;
          }
          
          .timeline-line {
            left: 27px !important;
            transform: none !important;
          }
          
          .timeline-item {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          .empty-left, .empty-right {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}

const styles = {
 section: {
    position: "relative",
    padding: "100px 20px",
    overflow: "hidden",
    color: "#ffffff"
  },

  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(13,148,136,0.9), rgba(13,148,136,0.85))",
    
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative'
  },
  header: {
    textAlign: 'center',
    marginBottom: '64px'
  },
  title: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '12px',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '18px',
    color: '#141414',
    maxWidth: '500px',
    margin: '0 auto',
    lineHeight: '1.6',
    fontWeight: '700',
  },
  timelineContainer: {
    position: 'relative',
    maxWidth: '900px',
    margin: '0 auto'
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '2px',
    height: '100%',
    background: '#ffffff',
    zIndex: '1'
  },
  timelineItems: {
    position: 'relative',
    zIndex: '2'
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '48px',
    position: 'relative'
  },
  contentLeft: {
    flex: '1',
    paddingRight: '32px',
    textAlign: 'right'
  },
  contentRight: {
    flex: '1',
    paddingLeft: '32px'
  },
  emptyLeft: {
    flex: '1',
    paddingRight: '32px'
  },
  emptyRight: {
    flex: '1',
    paddingLeft: '32px'
  },
  card: {
    backgroundColor: '#ffffff41',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f3f4f6',
    maxWidth: '400px',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: '12px'
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#f0fdfa00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '16px',
    flexShrink: '0'
  },
  icon: {
    fontSize: '20px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0'
  },
  cardText: {
    fontSize: '16px',
    color: '#282727',
    lineHeight: '1.6',
    margin: '0',
    fontWeight: '700'
  },
  timelineDot: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#14b8a6',
    border: '4px solid #ffffff',
    boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: '3'
  }
};
