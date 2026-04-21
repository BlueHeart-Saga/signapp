import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Heart,
  Eye,
  Share2,
  Bookmark,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  Globe,
  Code,
  FileText,
  Video,
  Zap,
  Clock,
  User,
  Mail,
  Linkedin,
  Twitter,
  Github,
  Facebook,
  Youtube,
  Coffee,
  Rocket,
  Shield,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Menu,
  X
} from 'lucide-react';

const Community = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const communityStats = [
    { icon: <Users size={24} />, label: 'Members', value: '50K+', change: '+12%' },
    { icon: <MessageSquare size={24} />, label: 'Discussions', value: '25K+', change: '+8%' },
    { icon: <Star size={24} />, label: 'Solutions', value: '10K+', change: '+15%' },
    { icon: <TrendingUp size={24} />, label: 'Active', value: '2.5K', change: '+5%' }
  ];

  const tabs = [
    { id: 'all', label: 'All Topics', count: 245 },
    { id: 'announcements', label: 'Announcements', count: 12 },
    { id: 'questions', label: 'Questions', count: 89 },
    { id: 'showcase', label: 'Showcase', count: 42 },
    { id: 'ideas', label: 'Feature Ideas', count: 34 },
    { id: 'tutorials', label: 'Tutorials', count: 68 }
  ];

  const featuredTopics = [
    {
      id: 1,
      title: 'How to implement webhooks for real-time notifications',
      author: 'Alex Chen',
      authorRole: 'Senior Developer',
      authorAvatar: 'https://i.pravatar.cc/150?img=1',
      category: 'tutorials',
      replies: 42,
      likes: 156,
      views: '2.1k',
      solved: true,
      trending: true,
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'API rate limiting and best practices for high-volume applications',
      author: 'Sarah Johnson',
      authorRole: 'Tech Lead',
      authorAvatar: 'https://i.pravatar.cc/150?img=2',
      category: 'questions',
      replies: 18,
      likes: 89,
      views: '1.5k',
      solved: true,
      trending: true,
      time: '5 hours ago'
    },
    {
      id: 3,
      title: 'Showcase: Our document workflow automation using SafeSign API',
      author: 'Mike Rodriguez',
      authorRole: 'Product Manager',
      authorAvatar: 'https://i.pravatar.cc/150?img=3',
      category: 'showcase',
      replies: 24,
      likes: 112,
      views: '1.8k',
      solved: false,
      trending: true,
      time: '1 day ago'
    }
  ];

  const topics = [
    {
      id: 4,
      title: 'Best practices for secure document storage after signing',
      author: 'David Kim',
      authorAvatar: 'https://i.pravatar.cc/150?img=4',
      category: 'questions',
      replies: 8,
      likes: 34,
      views: '450',
      solved: false,
      time: '3 hours ago'
    },
    {
      id: 5,
      title: 'Feature Request: Bulk document processing enhancements',
      author: 'Emma Wilson',
      authorAvatar: 'https://i.pravatar.cc/150?img=5',
      category: 'ideas',
      replies: 15,
      likes: 67,
      views: '620',
      solved: false,
      time: '6 hours ago'
    },
    {
      id: 6,
      title: 'Tutorial: Integrating SafeSign with React applications',
      author: 'James Miller',
      authorAvatar: 'https://i.pravatar.cc/150?img=6',
      category: 'tutorials',
      replies: 23,
      likes: 98,
      views: '890',
      solved: true,
      time: '1 day ago'
    },
    {
      id: 7,
      title: 'Announcement: New API version 2.1 released',
      author: 'SafeSign Team',
      authorAvatar: 'https://i.pravatar.cc/150?img=7',
      category: 'announcements',
      replies: 32,
      likes: 145,
      views: '1.2k',
      solved: false,
      time: '2 days ago'
    },
    {
      id: 8,
      title: 'How to handle document versioning with multiple signers',
      author: 'Lisa Wang',
      authorAvatar: 'https://i.pravatar.cc/150?img=8',
      category: 'questions',
      replies: 12,
      likes: 45,
      views: '540',
      solved: true,
      time: '2 days ago'
    },
    {
      id: 9,
      title: 'Showcase: Our legal department\'s transformation with SafeSign',
      author: 'Robert Chen',
      authorAvatar: 'https://i.pravatar.cc/150?img=9',
      category: 'showcase',
      replies: 19,
      likes: 78,
      views: '710',
      solved: false,
      time: '3 days ago'
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Live Q&A: API Best Practices',
      date: 'Jan 25, 2025',
      time: '2:00 PM EST',
      type: 'webinar',
      speaker: 'Alex Chen',
      attendees: 245,
      featured: true
    },
    {
      id: 2,
      title: 'Community Hackathon',
      date: 'Feb 1-2, 2025',
      time: 'All Day',
      type: 'hackathon',
      speaker: 'Community',
      attendees: 150,
      featured: false
    },
    {
      id: 3,
      title: 'Office Hours: Security Features',
      date: 'Jan 28, 2025',
      time: '11:00 AM EST',
      type: 'office-hours',
      speaker: 'Sarah Johnson',
      attendees: 120,
      featured: false
    }
  ];

  const topContributors = [
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Senior Developer',
      avatar: 'https://i.pravatar.cc/150?img=1',
      points: 5420,
      solutions: 124,
      streak: 45,
      level: 'Expert'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Tech Lead',
      avatar: 'https://i.pravatar.cc/150?img=2',
      points: 4210,
      solutions: 98,
      streak: 32,
      level: 'Expert'
    },
    {
      id: 3,
      name: 'Mike Rodriguez',
      role: 'Product Manager',
      avatar: 'https://i.pravatar.cc/150?img=3',
      points: 3560,
      solutions: 76,
      streak: 28,
      level: 'Advanced'
    }
  ];

  const resources = [
    {
      title: 'API Documentation',
      icon: <Code size={20} />,
      color: '#0f766e',
      link: '/docs',
      description: 'Complete API reference'
    },
    {
      title: 'GitHub Repository',
      icon: <Github size={20} />,
      color: '#333',
      link: 'https://github.com/safesign',
      description: 'Open-source libraries'
    },
    {
      title: 'Video Tutorials',
      icon: <Video size={20} />,
      color: '#ff0000',
      link: '/tutorials',
      description: 'Step-by-step guides'
    },
    {
      title: 'Blog',
      icon: <FileText size={20} />,
      color: '#8b5cf6',
      link: '/blog',
      description: 'Latest updates'
    }
  ];

  const socialLinks = [
    { platform: 'Twitter', icon: <Twitter size={20} />, handle: '@SafeSignHQ', followers: '15.2K' },
    { platform: 'LinkedIn', icon: <Linkedin size={20} />, followers: '28.5K' },
    { platform: 'GitHub', icon: <Github size={20} />, stars: '2.4K' },
    { platform: 'YouTube', icon: <Youtube size={20} />, subscribers: '8.7K' }
  ];

  const filteredTopics = activeTab === 'all' 
    ? topics 
    : topics.filter(topic => topic.category === activeTab);

  const getCategoryColor = (category) => {
    const colors = {
      announcements: '#3b82f6',
      questions: '#10b981',
      showcase: '#8b5cf6',
      ideas: '#f59e0b',
      tutorials: '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      announcements: <Sparkles size={14} />,
      questions: <MessageSquare size={14} />,
      showcase: <Star size={14} />,
      ideas: <Zap size={14} />,
      tutorials: <FileText size={14} />
    };
    return icons[category] || <MessageSquare size={14} />;
  };

  return (
    <div className="safe-community">
      {/* Hero Section */}
      <section className="safe-community-hero">
        <div className="safe-community-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <Users size={20} />
              <span>Welcome to SafeSign Community</span>
            </div>
            <h1 className="safe-hero-title">Connect, Learn & Grow Together</h1>
            <p className="safe-hero-subtitle">
              Join thousands of developers, businesses, and e-signature enthusiasts sharing knowledge,
              solving problems, and building amazing things with SafeSign
            </p>
            
            {/* Stats */}
            <div className="safe-hero-stats">
              {communityStats.map((stat, index) => (
                <div key={index} className="safe-stat-card">
                  <div className="safe-stat-icon">
                    {stat.icon}
                  </div>
                  <div className="safe-stat-content">
                    <div className="safe-stat-value">{stat.value}</div>
                    <div className="safe-stat-label">{stat.label}</div>
                    <div className="safe-stat-change">
                      <TrendingUp size={12} />
                      {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="safe-community-main">
        <div className="safe-community-container">
          <div className="safe-community-layout">
            {/* Left Column - Main Content */}
            <div className="safe-community-content">
              {/* Featured Topics */}
              <section className="safe-featured-topics">
                <div className="safe-section-header">
                  <div className="safe-section-title-group">
                    <Sparkles size={24} />
                    <h2 className="safe-section-title">Featured Discussions</h2>
                  </div>
                  <button className="safe-view-all-btn">
                    View All
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="safe-featured-grid">
                  {featuredTopics.map(topic => (
                    <div key={topic.id} className="safe-featured-card">
                      {topic.trending && (
                        <div className="safe-trending-badge">
                          <TrendingUp size={12} />
                          Trending
                        </div>
                      )}
                      
                      <div className="safe-featured-header">
                        <div className="safe-topic-category" style={{ color: getCategoryColor(topic.category) }}>
                          {getCategoryIcon(topic.category)}
                          <span>{topic.category}</span>
                        </div>
                        {topic.solved && (
                          <div className="safe-solved-badge">
                            <CheckCircle size={14} />
                            Solved
                          </div>
                        )}
                      </div>
                      
                      <h3 className="safe-topic-title">{topic.title}</h3>
                      <p className="safe-topic-excerpt">
                        Explore best practices and implementation strategies for integrating SafeSign webhooks...
                      </p>
                      
                      <div className="safe-topic-meta">
                        <div className="safe-author-info">
                          <img src={topic.authorAvatar} alt={topic.author} className="safe-author-avatar" />
                          <div className="safe-author-details">
                            <div className="safe-author-name">{topic.author}</div>
                            <div className="safe-author-role">{topic.authorRole}</div>
                          </div>
                        </div>
                        <div className="safe-topic-stats">
                          <span className="safe-stat-item">
                            <MessageSquare size={14} />
                            {topic.replies}
                          </span>
                          <span className="safe-stat-item">
                            <Heart size={14} />
                            {topic.likes}
                          </span>
                          <span className="safe-stat-item">
                            <Eye size={14} />
                            {topic.views}
                          </span>
                        </div>
                      </div>
                      
                      <div className="safe-topic-actions">
                        <button className="safe-action-btn">
                          <MessageSquare size={16} />
                          Join Discussion
                        </button>
                        <button className="safe-action-btn safe-action-secondary">
                          <Bookmark size={16} />
                          Save
                        </button>
                        <button className="safe-action-btn safe-action-secondary">
                          <Share2 size={16} />
                          Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tabs & Topics */}
              <section className="safe-topics-section">
                <div className="safe-tabs-container">
                  <div className="safe-tabs-list">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        className={`safe-tab ${activeTab === tab.id ? 'safe-tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <span className="safe-tab-label">{tab.label}</span>
                        <span className="safe-tab-count">{tab.count}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="safe-tools-bar">
                    <div className="safe-search-box">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="safe-search-input"
                      />
                    </div>
                    
                    <div className="safe-filters-wrapper">
                      <button 
                        className="safe-filter-btn"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter size={18} />
                        Filter
                        <ChevronDown className={`safe-filter-arrow ${showFilters ? 'safe-arrow-open' : ''}`} />
                      </button>
                      
                      <button className="safe-new-topic-btn">
                        <Plus size={18} />
                        New Topic
                      </button>
                    </div>
                  </div>
                </div>

                {/* Topics List */}
                <div className="safe-topics-list">
                  {filteredTopics.map(topic => (
                    <div key={topic.id} className="safe-topic-card">
                      <div className="safe-topic-main">
                        <div className="safe-topic-info">
                          <div className="safe-topic-category-small" style={{ backgroundColor: `${getCategoryColor(topic.category)}15` }}>
                            <span style={{ color: getCategoryColor(topic.category) }}>
                              {getCategoryIcon(topic.category)}
                            </span>
                            <span>{topic.category}</span>
                          </div>
                          
                          <h3 className="safe-topic-title-small">{topic.title}</h3>
                          
                          <div className="safe-topic-author">
                            <img src={topic.authorAvatar} alt={topic.author} className="safe-author-avatar-small" />
                            <span className="safe-author-name-small">{topic.author}</span>
                            <span className="safe-topic-time">
                              <Clock size={12} />
                              {topic.time}
                            </span>
                          </div>
                        </div>
                        
                        <div className="safe-topic-stats-small">
                          <div className="safe-stat-group">
                            <div className="safe-stat-value-small">{topic.replies}</div>
                            <div className="safe-stat-label-small">Replies</div>
                          </div>
                          <div className="safe-stat-group">
                            <div className="safe-stat-value-small">{topic.likes}</div>
                            <div className="safe-stat-label-small">Likes</div>
                          </div>
                          <div className="safe-stat-group">
                            <div className="safe-stat-value-small">{topic.views}</div>
                            <div className="safe-stat-label-small">Views</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="safe-topic-actions-small">
                        {topic.solved && (
                          <div className="safe-solved-indicator">
                            <CheckCircle size={14} />
                            Solved
                          </div>
                        )}
                        <button className="safe-reply-btn">
                          <MessageSquare size={16} />
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column - Sidebar */}
            <aside className="safe-community-sidebar">
              {/* Events */}
              <div className="safe-sidebar-card">
                <div className="safe-sidebar-header">
                  <Calendar size={20} />
                  <h3 className="safe-sidebar-title">Upcoming Events</h3>
                </div>
                
                <div className="safe-events-list">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className={`safe-event-card ${event.featured ? 'safe-event-featured' : ''}`}>
                      {event.featured && (
                        <div className="safe-featured-tag">
                          <Star size={12} />
                          Featured
                        </div>
                      )}
                      
                      <div className="safe-event-info">
                        <h4 className="safe-event-title">{event.title}</h4>
                        <div className="safe-event-meta">
                          <span className="safe-event-date">
                            <Calendar size={12} />
                            {event.date}
                          </span>
                          <span className="safe-event-time">
                            <Clock size={12} />
                            {event.time}
                          </span>
                        </div>
                        <div className="safe-event-speaker">
                          <User size={12} />
                          {event.speaker}
                        </div>
                      </div>
                      
                      <div className="safe-event-actions">
                        <div className="safe-event-attendees">
                          <Users size={12} />
                          {event.attendees} attending
                        </div>
                        <button className="safe-rsvp-btn">
                          RSVP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="safe-view-calendar-btn">
                  View Full Calendar
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Top Contributors */}
              <div className="safe-sidebar-card">
                <div className="safe-sidebar-header">
                  <Award size={20} />
                  <h3 className="safe-sidebar-title">Top Contributors</h3>
                </div>
                
                <div className="safe-contributors-list">
                  {topContributors.map(contributor => (
                    <div key={contributor.id} className="safe-contributor-card">
                      <div className="safe-contributor-info">
                        <div className="safe-contributor-avatar">
                          <img src={contributor.avatar} alt={contributor.name} />
                          <div className="safe-contributor-level">
                            {contributor.level === 'Expert' ? '👑' : '⭐'}
                          </div>
                        </div>
                        <div className="safe-contributor-details">
                          <h4 className="safe-contributor-name">{contributor.name}</h4>
                          <p className="safe-contributor-role">{contributor.role}</p>
                          <div className="safe-contributor-stats">
                            <span className="safe-contributor-points">
                              <TrendingUp size={12} />
                              {contributor.points} pts
                            </span>
                            <span className="safe-contributor-streak">
                              <Zap size={12} />
                              {contributor.streak} day streak
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="safe-contributor-actions">
                        <button className="safe-follow-btn">
                          Follow
                        </button>
                        <button className="safe-message-btn">
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="safe-sidebar-card">
                <div className="safe-sidebar-header">
                  <FileText size={20} />
                  <h3 className="safe-sidebar-title">Resources</h3>
                </div>
                
                <div className="safe-resources-list">
                  {resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.link}
                      className="safe-resource-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="safe-resource-icon" style={{ backgroundColor: `${resource.color}15` }}>
                        <span style={{ color: resource.color }}>
                          {resource.icon}
                        </span>
                      </div>
                      <div className="safe-resource-info">
                        <div className="safe-resource-title">{resource.title}</div>
                        <div className="safe-resource-desc">{resource.description}</div>
                      </div>
                      <ExternalLink size={14} className="safe-resource-arrow" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="safe-sidebar-card">
                <div className="safe-sidebar-header">
                  <Globe size={20} />
                  <h3 className="safe-sidebar-title">Join Us Online</h3>
                </div>
                
                <div className="safe-social-links">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href="#"
                      className="safe-social-link"
                    >
                      <div className="safe-social-icon">
                        {social.icon}
                      </div>
                      <div className="safe-social-info">
                        <div className="safe-social-platform">{social.platform}</div>
                        <div className="safe-social-followers">
                          {social.handle || ''} {social.followers}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="safe-community-cta">
                <h3 className="safe-cta-title">Ready to Contribute?</h3>
                <p className="safe-cta-text">
                  Share your knowledge, ask questions, and help others in the community
                </p>
                <button className="safe-cta-btn">
                  <Plus size={18} />
                  Start New Discussion
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Community Guidelines */}
      <section className="safe-guidelines-section">
        <div className="safe-community-container">
          <div className="safe-guidelines-header">
            <Shield size={28} />
            <h2 className="safe-guidelines-title">Community Guidelines</h2>
          </div>
          
          <div className="safe-guidelines-grid">
            <div className="safe-guideline-card">
              <div className="safe-guideline-icon safe-icon-positive">
                <CheckCircle size={20} />
              </div>
              <h3 className="safe-guideline-title">Be Respectful</h3>
              <p className="safe-guideline-desc">
                Treat all community members with respect and kindness
              </p>
            </div>
            
            <div className="safe-guideline-card">
              <div className="safe-guideline-icon safe-icon-help">
                <MessageSquare size={20} />
              </div>
              <h3 className="safe-guideline-title">Help Others</h3>
              <p className="safe-guideline-desc">
                Share your knowledge and help fellow community members
              </p>
            </div>
            
            <div className="safe-guideline-card">
              <div className="safe-guideline-icon safe-icon-constructive">
                <Zap size={20} />
              </div>
              <h3 className="safe-guideline-title">Stay Constructive</h3>
              <p className="safe-guideline-desc">
                Provide constructive feedback and suggestions
              </p>
            </div>
            
            <div className="safe-guideline-card">
              <div className="safe-guideline-icon safe-icon-warning">
                <AlertCircle size={20} />
              </div>
              <h3 className="safe-guideline-title">No Spam</h3>
              <p className="safe-guideline-desc">
                Avoid promotional content and spam messages
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="safe-newsletter-section">
        <div className="safe-community-container">
          <div className="safe-newsletter-content">
            <div className="safe-newsletter-text">
              <h2 className="safe-newsletter-title">Stay Updated</h2>
              <p className="safe-newsletter-subtitle">
                Get weekly community highlights, product updates, and expert insights
              </p>
            </div>
            <div className="safe-newsletter-form">
              <div className="safe-email-input">
                <Mail size={20} />
                <input type="email" placeholder="Enter your email" />
              </div>
              <button className="safe-subscribe-btn">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Base Styles */
        .safe-community {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #111827;
        }

        .safe-community-container {
          
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-community-hero {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          padding: 4rem 0;
          position: relative;
        }

        .safe-hero-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .safe-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
        }

        .safe-hero-title {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          margin: 0 0 1rem;
          line-height: 1.2;
        }

        .safe-hero-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto 3rem;
          max-width: 600px;
          line-height: 1.6;
        }

        /* Stats */
        .safe-hero-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }

        @media (min-width: 768px) {
          .safe-hero-stats {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-stat-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          backdrop-filter: blur(8px);
          transition: all 0.3s;
        }

        .safe-stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.15);
        }

        .safe-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          margin: 0 auto 1rem;
          color: white;
        }

        .safe-stat-content {
          text-align: center;
        }

        .safe-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
        }

        .safe-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
        }

        .safe-stat-change {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 600;
        }

        /* Main Content */
        .safe-community-main {
          padding: 3rem 0;
        }

        /* Desktop – content + right sidebar */
.safe-community-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

/* Tablet / Small Laptop */
@media (max-width: 1100px) {
  .safe-community-layout {
    grid-template-columns: 2fr 1fr;
  }
}

/* Mobile – stack */
@media (max-width: 768px) {
  .safe-community-layout {
    grid-template-columns: 1fr;
  }

  .safe-community-sidebar {
    position: relative;   /* remove sticky on mobile */
    top: auto;
  }
}


        /* Featured Topics */
        .safe-featured-topics {
          margin-bottom: 3rem;
        }

        .safe-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .safe-section-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #0f766e;
        }

        .safe-section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .safe-view-all-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-view-all-btn:hover {
          background: #e5e7eb;
          color: #0f766e;
        }

        .safe-featured-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .safe-featured-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .safe-featured-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          position: relative;
          transition: all 0.3s;
        }

        .safe-featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
          border-color: #0f766e;
        }

        .safe-trending-badge {
          position: absolute;
          top: -0.75rem;
          right: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #fef3c7;
          color: #92400e;
          padding: 0.375rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-featured-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .safe-topic-category {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .safe-solved-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-topic-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }

        .safe-topic-excerpt {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .safe-topic-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          margin-bottom: 1.5rem;
        }

        .safe-author-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .safe-author-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #f3f4f6;
        }

        .safe-author-details {
          flex: 1;
        }

        .safe-author-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.125rem;
        }

        .safe-author-role {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-topic-stats {
          display: flex;
          gap: 1rem;
        }

        .safe-stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .safe-topic-actions {
          display: flex;
          gap: 0.75rem;
        }

        .safe-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-action-btn:hover {
          background: #0f766e;
        }

        .safe-action-secondary {
          background: #f3f4f6;
          color: #4b5563;
        }

        .safe-action-secondary:hover {
          background: #e5e7eb;
          color: #0f766e;
        }

        /* Tabs */
        .safe-tabs-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .safe-tabs-list {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .safe-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f9fafb;
          color: #6b7280;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .safe-tab:hover {
          background: #f3f4f6;
        }

        .safe-tab-active {
          background: #0f766e;
          color: white;
        }

        .safe-tab-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
        }

        .safe-tools-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .safe-search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
        }

        .safe-search-box svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .safe-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          font-size: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          outline: none;
          transition: all 0.2s;
        }

        .safe-search-input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .safe-filters-wrapper {
          display: flex;
          gap: 0.75rem;
        }

        .safe-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-filter-btn:hover {
          border-color: #0f766e;
          color: #0f766e;
        }

        .safe-filter-arrow {
          transition: transform 0.2s;
        }

        .safe-arrow-open {
          transform: rotate(180deg);
        }

        .safe-new-topic-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-new-topic-btn:hover {
          background: #0f766e;
          transform: translateY(-2px);
        }

        /* Topics List */
        .safe-topics-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-topic-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: all 0.3s;
        }

        .safe-topic-card:hover {
          border-color: #0f766e;
          transform: translateX(4px);
        }

        .safe-topic-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .safe-topic-info {
          flex: 1;
        }

        .safe-topic-category-small {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .safe-topic-title-small {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }

        .safe-topic-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-author-avatar-small {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .safe-topic-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .safe-topic-stats-small {
          display: flex;
          gap: 1.5rem;
        }

        .safe-stat-group {
          text-align: center;
        }

        .safe-stat-value-small {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.125rem;
        }

        .safe-stat-label-small {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-topic-actions-small {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .safe-solved-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-reply-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-reply-btn:hover {
          background: #e5e7eb;
          color: #0f766e;
        }

        /* Sidebar */
        .safe-community-sidebar {
          position: sticky;
          top: 2rem;
        }

        .safe-sidebar-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .safe-sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          color: #0f766e;
        }

        .safe-sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        /* Events */
        .safe-events-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .safe-event-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          position: relative;
        }

        .safe-event-featured {
          background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
          border-color: #0f766e;
        }

        .safe-featured-tag {
          position: absolute;
          top: -0.5rem;
          right: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #fef3c7;
          color: #92400e;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-event-info {
          margin-bottom: 1rem;
        }

        .safe-event-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-event-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .safe-event-speaker {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #4b5563;
        }

        .safe-event-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .safe-event-attendees {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-rsvp-btn {
          padding: 0.375rem 0.75rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-rsvp-btn:hover {
          background: #0f766e;
        }

        .safe-view-calendar-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-view-calendar-btn:hover {
          background: #e5e7eb;
          color: #0f766e;
        }

        /* Contributors */
        .safe-contributors-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-contributor-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
        }

        .safe-contributor-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .safe-contributor-avatar {
          position: relative;
        }

        .safe-contributor-avatar img {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .safe-contributor-level {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: white;
          border-radius: 50%;
          width: 1rem;
          height: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.5rem;
          border: 2px solid #f9fafb;
        }

        .safe-contributor-details {
          flex: 1;
        }

        .safe-contributor-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.125rem;
        }

        .safe-contributor-role {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 0.5rem;
        }

        .safe-contributor-stats {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .safe-contributor-actions {
          display: flex;
          gap: 0.5rem;
        }

        .safe-follow-btn {
          padding: 0.375rem 0.75rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-follow-btn:hover {
          background: #0f766e;
        }

        .safe-message-btn {
          padding: 0.375rem;
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-message-btn:hover {
          background: #e5e7eb;
          color: #0f766e;
        }

        /* Resources */
        .safe-resources-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-resource-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-resource-link:hover {
          background: #f9fafb;
          color: #0f766e;
          transform: translateX(4px);
        }

        .safe-resource-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safe-resource-info {
          flex: 1;
        }

        .safe-resource-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: inherit;
          margin-bottom: 0.125rem;
        }

        .safe-resource-desc {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-resource-arrow {
          color: #9ca3af;
        }

        /* Social Links */
        .safe-social-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .safe-social-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4b5563;
          text-decoration: none;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .safe-social-link:hover {
          background: #f9fafb;
          transform: translateX(4px);
        }

        .safe-social-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #4b5563;
          flex-shrink: 0;
        }

        .safe-social-info {
          flex: 1;
        }

        .safe-social-platform {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.125rem;
        }

        .safe-social-followers {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Community CTA */
        .safe-community-cta {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          border-radius: 1rem;
          padding: 1.5rem;
          text-align: center;
          color: white;
        }

        .safe-cta-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .safe-cta-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .safe-cta-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: white;
          color: #0f766e;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Guidelines */
        .safe-guidelines-section {
          padding: 4rem 0;
          background: #f9fafb;
        }

        .safe-guidelines-header {
          text-align: center;
          margin-bottom: 3rem;
          color: #0f766e;
        }

        .safe-guidelines-title {
          font-size: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin: 1rem 0;
        }

        .safe-guidelines-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .safe-guidelines-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .safe-guideline-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s;
        }

        .safe-guideline-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        .safe-guideline-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .safe-icon-positive {
          background: #d1fae5;
          color: #065f46;
        }

        .safe-icon-help {
          background: #dbeafe;
          color: #1e40af;
        }

        .safe-icon-constructive {
          background: #fef3c7;
          color: #92400e;
        }

        .safe-icon-warning {
          background: #fee2e2;
          color: #991b1b;
        }

        .safe-guideline-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-guideline-desc {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        /* Newsletter */
        .safe-newsletter-section {
          padding: 4rem 0;
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          color: white;
        }

        .safe-newsletter-content {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .safe-newsletter-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .safe-newsletter-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 2rem;
          line-height: 1.6;
        }

        .safe-newsletter-form {
          display: flex;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .safe-email-input {
          flex: 1;
          position: relative;
        }

        .safe-email-input svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .safe-email-input input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          font-size: 0.875rem;
          border: none;
          border-radius: 0.5rem;
          outline: none;
        }

        .safe-subscribe-btn {
          padding: 0.875rem 1.5rem;
          background: white;
          color: #0f766e;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-subscribe-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-section-title {
            font-size: 1.5rem;
          }
          
          .safe-guidelines-title {
            font-size: 1.75rem;
          }
          
          .safe-newsletter-title {
            font-size: 1.75rem;
          }
          
          .safe-tools-bar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .safe-filters-wrapper {
            justify-content: space-between;
          }
          
          .safe-topic-main {
            flex-direction: column;
            gap: 1rem;
          }
          
          .safe-topic-stats-small {
            justify-content: flex-start;
          }
        }

        @media (max-width: 640px) {
          .safe-community-container {
            padding: 0 1rem;
          }
          
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-hero-stats {
            grid-template-columns: 1fr;
          }
          
          .safe-guidelines-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-newsletter-form {
            flex-direction: column;
          }
          
          .safe-featured-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Helper Classes */
        .safe-icon-eye {
          display: inline-block;
          width: 14px;
          height: 14px;
          background: currentColor;
          mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>');
          mask-repeat: no-repeat;
        }
      `}</style>
    </div>
  );
};

export default Community;
