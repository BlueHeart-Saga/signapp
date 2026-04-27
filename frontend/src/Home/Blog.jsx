import React, { useState } from 'react';
import { Search, Calendar, Clock, User, ChevronRight, Mail, TrendingUp, FileText } from 'lucide-react';

import { setPageTitle } from "../utils/pageTitle";
import { useEffect } from "react";

const BlogPage = () => {
  useEffect(() => {
    setPageTitle(
      "SafeSign E-Signature Blog | Expert Insights & Legal Guides",
      "Stay updated with the latest in electronic signatures, document security, and legal compliance. Expert guides and industry insights from the SafeSign team."
    );
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Articles');

  const categories = [
    { name: 'All Articles', count: 24 },
    { name: 'E-Signature Guides', count: 8 },
    { name: 'Legal Compliance', count: 6 },
    { name: 'Security & Privacy', count: 5 },
    { name: 'Product Updates', count: 5 }
  ];

  const featuredArticles = [
    {
      id: 1,
      category: 'E-Signature Guides',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=800&h=500&fit=crop',
      title: 'The Complete Guide to Legally Binding Electronic Signatures in 2025',
      excerpt: 'Learn about the latest regulations and best practices for creating legally binding e-signatures that stand up in court.',
      author: 'Sarah Johnson',
      authorRole: 'Legal Compliance Expert',
      date: '2025-1-15',
      readTime: '12 min read'
    },
    {
      id: 2,
      category: 'Security & Privacy',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop',
      title: 'Bank-Level Security: How SafeSign Protects Your Sensitive Documents',
      excerpt: 'Discover the advanced security measures we implement to keep your documents and signatures completely secure.',
      author: 'Michael Chen',
      authorRole: 'Security Engineer',
      date: '2025-1-14',
      readTime: '10 min read'
    },
    {
      id: 3,
      category: 'Legal Compliance',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop',
      title: 'GDPR & eIDAS: Navigating International E-Signature Regulations',
      excerpt: 'A comprehensive guide to understanding and complying with global e-signature regulations across different jurisdictions.',
      author: 'Emma Williams',
      authorRole: 'Compliance Officer',
      date: '2025-1-12',
      readTime: '15 min read'
    },
    {
      id: 4,
      category: 'Product Updates',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
      title: 'Introducing Smart Templates: Streamline Your Document Workflows',
      excerpt: 'Learn about our new AI-powered templates that automate document creation and signing processes.',
      author: 'David Lee',
      authorRole: 'Product Manager',
      date: '2025-1-10',
      readTime: '8 min read'
    }
  ];

  const latestArticles = [
    {
      id: 5,
      category: 'E-Signature Guides',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=600&h-400&fit=crop',
      title: '10 Common E-Signature Mistakes and How to Avoid Them',
      excerpt: 'Learn about common pitfalls in electronic signature workflows and best practices to ensure compliance.',
      author: 'Sarah Johnson',
      authorRole: 'Legal Expert',
      date: '2025-1-18',
      readTime: '8 min read'
    },
    {
      id: 6,
      category: 'Security & Privacy',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
      title: 'Audit Trails: The Backbone of Document Security',
      excerpt: 'How comprehensive audit trails protect your organization and provide legal evidence when needed.',
      author: 'Michael Chen',
      authorRole: 'Security Specialist',
      date: '2025-1-17',
      readTime: '10 min read'
    },
    {
      id: 7,
      category: 'Legal Compliance',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
      title: 'Understanding ESIGN, UETA, and Other US E-Signature Laws',
      excerpt: 'A breakdown of key US legislation governing electronic signatures and their requirements.',
      author: 'Emma Williams',
      authorRole: 'Compliance Director',
      date: '2025-1-16',
      readTime: '12 min read'
    },
    {
      id: 8,
      category: 'Product Updates',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      title: 'New Feature: Bulk Send for Enterprise Workflows',
      excerpt: 'Send hundreds of documents simultaneously with our new bulk sending capabilities.',
      author: 'David Lee',
      authorRole: 'Product Lead',
      date: '2025-1-15',
      readTime: '6 min read'
    },
    {
      id: 9,
      category: 'E-Signature Guides',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
      title: 'Mobile-First Signing: Optimizing for Smartphone Users',
      excerpt: 'Best practices for creating signing experiences that work perfectly on mobile devices.',
      author: 'Alex Turner',
      authorRole: 'UX Designer',
      date: '2025-1-14',
      readTime: '7 min read'
    },
    {
      id: 10,
      category: 'Security & Privacy',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
      title: 'End-to-End Encryption: What It Means for Your Documents',
      excerpt: 'Understanding how end-to-end encryption protects your documents from creation to storage.',
      author: 'Michael Chen',
      authorRole: 'Security Engineer',
      date: '2025-1-13',
      readTime: '9 min read'
    },
    {
      id: 11,
      category: 'Legal Compliance',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=600&h=400&fit=crop',
      title: 'Cross-Border Signatures: Legal Considerations for International Business',
      excerpt: 'Navigating the complexities of electronic signatures across different countries and legal systems.',
      author: 'Sarah Johnson',
      authorRole: 'Legal Consultant',
      date: '2025-1-12',
      readTime: '11 min read'
    },
    {
      id: 12,
      category: 'Product Updates',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      title: 'Enhanced API: New Webhook Features for Developers',
      excerpt: 'Explore the latest additions to our API that make integration even more powerful.',
      author: 'David Lee',
      authorRole: 'Technical Product Manager',
      date: '2025-1-11',
      readTime: '8 min read'
    },
    {
      id: 13,
      category: 'E-Signature Guides',
      categoryColor: '#0f766e',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
      title: 'Integrating SafeSign with Your CRM: A Step-by-Step Guide',
      excerpt: 'Learn how to seamlessly connect SafeSign with popular CRM platforms like Salesforce and HubSpot.',
      author: 'Alex Turner',
      authorRole: 'Integration Specialist',
      date: '2025-1-10',
      readTime: '10 min read'
    }
  ];

  const popularArticles = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=120&fit=crop',
      title: 'E-Signature ROI: How Much Can Your Business Save?',
      date: '2025-1-05',
      views: '2.4k'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=200&h=120&fit=crop',
      title: 'The Future of Digital Contracts: Trends to Watch in 2025',
      date: '2025-1-03',
      views: '1.8k'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=120&fit=crop',
      title: 'Remote Work Best Practices: Secure Document Signing for Distributed Teams',
      date: '2024-12-28',
      views: '3.1k'
    }
  ];

  const authors = [
    {
      name: 'Sarah Johnson',
      role: 'Legal Compliance Expert',
      image: 'https://i.pravatar.cc/150?img=1',
      articles: 12
    },
    {
      name: 'Michael Chen',
      role: 'Head of Security',
      image: 'https://i.pravatar.cc/150?img=2',
      articles: 8
    },
    {
      name: 'Emma Williams',
      role: 'Compliance Director',
      image: 'https://i.pravatar.cc/150?img=3',
      articles: 15
    }
  ];

  return (
    <div className="safe-blog">
      {/* Hero Section */}
      <section className="safe-blog-hero">
        <div className="safe-blog-container">
          <div className="safe-hero-content">
            <div className="safe-hero-badge">
              <FileText size={18} />
              <span>SafeSign Insights</span>
            </div>
            <h1 className="safe-hero-title">E-Signature Expertise & Industry Insights</h1>
            <p className="safe-hero-subtitle">
              Expert articles on electronic signatures, document security, legal compliance, and digital transformation
            </p>

            {/* Search Bar */}
            <div className="safe-blog-search">
              <Search className="safe-search-icon" />
              <input
                type="text"
                placeholder="Search articles on e-signatures, security, compliance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="safe-search-input"
              />
              <button className="safe-search-btn">Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="safe-blog-main">
        <div className="safe-blog-container">
          <div className="safe-blog-grid">
            {/* Left Column - Articles */}
            <div className="safe-blog-content">
              {/* Featured Articles Section */}
              <div className="safe-featured-section">
                <h2 className="safe-section-title">Featured Articles</h2>
                <p className="safe-section-subtitle">Essential reading for e-signature professionals</p>

                <div className="safe-featured-grid">
                  {featuredArticles.map((article) => (
                    <article key={article.id} className="safe-featured-card">
                      <div className="safe-featured-image">
                        <img src={article.image} alt={article.title} />
                        <span
                          className="safe-article-category"
                          style={{ backgroundColor: article.categoryColor }}
                        >
                          {article.category}
                        </span>
                      </div>

                      <div className="safe-featured-content">
                        <h3 className="safe-article-title">{article.title}</h3>
                        <p className="safe-article-excerpt">{article.excerpt}</p>

                        <div className="safe-article-meta">
                          <div className="safe-author-info">
                            <div className="safe-author-name">{article.author}</div>
                            <div className="safe-author-role">{article.authorRole}</div>
                          </div>
                          <div className="safe-article-details">
                            <div className="safe-date-info">
                              <Calendar size={14} />
                              <span>{article.date}</span>
                            </div>
                            <div className="safe-read-time">
                              <Clock size={14} />
                              <span>{article.readTime}</span>
                            </div>
                          </div>
                        </div>

                        <button className="safe-read-btn">Read Article</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="safe-category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`safe-category-tab ${activeCategory === cat.name ? 'safe-tab-active' : ''}`}
                  >
                    <span>{cat.name}</span>
                    <span className="safe-tab-count">{cat.count}</span>
                  </button>
                ))}
              </div>

              {/* Latest Articles Section */}
              <div className="safe-latest-section">
                <h2 className="safe-section-title">Latest Articles</h2>
                <div className="safe-articles-grid">
                  {latestArticles.map((article) => (
                    <article key={article.id} className="safe-article-card">
                      <div className="safe-article-image">
                        <img src={article.image} alt={article.title} />
                        <span
                          className="safe-article-category"
                          style={{ backgroundColor: article.categoryColor }}
                        >
                          {article.category}
                        </span>
                      </div>

                      <div className="safe-article-content">
                        <h3 className="safe-article-title">{article.title}</h3>
                        <p className="safe-article-excerpt">{article.excerpt}</p>

                        <div className="safe-article-meta">
                          <div className="safe-author-info">
                            <div className="safe-author-name">{article.author}</div>
                            <div className="safe-author-role">{article.authorRole}</div>
                          </div>
                          <div className="safe-article-details">
                            <div className="safe-date-info">
                              <Calendar size={12} />
                              <span>{article.date}</span>
                            </div>
                            <div className="safe-read-time">
                              <Clock size={12} />
                              <span>{article.readTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="safe-pagination">
                <button className="safe-page-btn safe-page-active">1</button>
                <button className="safe-page-btn">2</button>
                <button className="safe-page-btn">3</button>
                <button className="safe-page-btn safe-page-next">
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Sidebar */}
            <aside className="safe-blog-sidebar">
              {/* About Section */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">About SafeSign Blog</h3>
                <p className="safe-sidebar-text">
                  Welcome to the official SafeSign blog. We publish expert insights on electronic signatures,
                  document security, legal compliance, and digital transformation strategies to help businesses
                  succeed in the digital age.
                </p>
              </div>

              {/* Popular Articles */}
              <div className="safe-sidebar-card">
                <div className="safe-sidebar-header">
                  <TrendingUp size={20} />
                  <h3 className="safe-sidebar-title">Popular Articles</h3>
                </div>
                <div className="safe-popular-list">
                  {popularArticles.map((article) => (
                    <div key={article.id} className="safe-popular-item">
                      <div className="safe-popular-image">
                        <img src={article.image} alt={article.title} />
                      </div>
                      <div className="safe-popular-content">
                        <h4 className="safe-popular-title">{article.title}</h4>
                        <div className="safe-popular-meta">
                          <span className="safe-popular-date">{article.date}</span>
                          <span className="safe-popular-views">{article.views} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">Categories</h3>
                <div className="safe-category-list">
                  {categories.map((cat) => (
                    <div key={cat.name} className="safe-category-item">
                      <span className="safe-category-name">{cat.name}</span>
                      <span className="safe-category-count">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="safe-newsletter-card">
                <Mail className="safe-newsletter-icon" />
                <h3 className="safe-newsletter-title">Stay Updated</h3>
                <p className="safe-newsletter-text">
                  Get weekly insights on e-signatures, security best practices, and industry trends
                </p>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="safe-newsletter-input"
                />
                <button className="safe-newsletter-btn">Subscribe</button>
              </div>

              {/* Authors */}
              <div className="safe-sidebar-card">
                <h3 className="safe-sidebar-title">Our Contributors</h3>
                <div className="safe-authors-list">
                  {authors.map((author) => (
                    <div key={author.name} className="safe-author-item">
                      <img src={author.image} alt={author.name} className="safe-author-avatar" />
                      <div className="safe-author-info">
                        <div className="safe-author-name">{author.name}</div>
                        <div className="safe-author-role">{author.role}</div>
                        <div className="safe-author-stats">{author.articles} articles</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Base Styles */
        .safe-blog {
          min-height: 100vh;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #111827;
        }

        .safe-blog-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero Section */
        .safe-blog-hero {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          padding: 4rem 0;
          position: relative;
          overflow: hidden;
        }

        .safe-hero-content {
          text-align: center;
          max-width: 48rem;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .safe-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 0.5rem 1rem;
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
          letter-spacing: -0.025em;
        }

        .safe-hero-subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        /* Search */
        .safe-blog-search {
          position: relative;
          max-width: 36rem;
          margin: 0 auto;
        }

        .safe-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 2;
        }

        .safe-search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          border: none;
          border-radius: 0.75rem;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          outline: none;
          transition: all 0.3s;
        }

        .safe-search-input:focus {
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        }

        .safe-search-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.625rem 1.25rem;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-search-btn:hover {
          background: #0f766e;
          transform: translateY(-50%) scale(1.05);
        }

        /* Main Content */
        .safe-blog-main {
          padding: 4rem 0;
        }

        .safe-blog-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 3rem;
          align-items: start;
        }

        /* Featured Articles */
        .safe-featured-section {
          margin-bottom: 4rem;
        }

        .safe-section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .safe-section-subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 2rem;
        }

        .safe-featured-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .safe-featured-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .safe-featured-card:hover {
          transform: translateY(-0.5rem);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: #0f766e;
        }

        .safe-featured-image {
          position: relative;
          height: 12.5rem;
        }

        .safe-featured-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .safe-article-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          color: white;
          padding: 0.375rem 0.875rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .safe-featured-content {
          padding: 1.5rem;
        }

        .safe-article-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }

        .safe-article-excerpt {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 1.5rem;
        }

        .safe-article-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
        }

        .safe-author-info {
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
          color: #9ca3af;
        }

        .safe-article-details {
          display: flex;
          gap: 1rem;
        }

        .safe-date-info,
        .safe-read-time {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .safe-read-btn {
          width: 100%;
          padding: 0.75rem;
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #d1fae5;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1.5rem;
        }

        .safe-read-btn:hover {
          background: #0f766e;
          color: white;
        }

        /* Category Tabs */
        .safe-category-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .safe-category-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
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

        .safe-category-tab:hover {
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

        .safe-tab-active .safe-tab-count {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Latest Articles */
        .safe-latest-section {
          margin-bottom: 3rem;
        }

        .safe-articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .safe-article-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .safe-article-card:hover {
          transform: translateY(-0.25rem);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          border-color: #0f766e;
        }

        .safe-article-image {
          position: relative;
          height: 10rem;
        }

        .safe-article-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .safe-article-content {
          padding: 1.25rem;
        }

        .safe-article-content .safe-article-title {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .safe-article-content .safe-article-excerpt {
          font-size: 0.8125rem;
          margin-bottom: 1rem;
        }

        /* Pagination */
        .safe-pagination {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .safe-page-btn {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #6b7280;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safe-page-btn:hover {
          background: #e5e7eb;
        }

        .safe-page-active {
          background: #0f766e;
          color: white;
        }

        .safe-page-next {
          width: auto;
          padding: 0 1rem;
          gap: 0.25rem;
        }

        /* Sidebar */
        .safe-blog-sidebar {
          position: sticky;
          top: 1rem;
        }

        .safe-sidebar-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .safe-sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #0f766e;
        }

        .safe-sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem;
        }

        .safe-sidebar-text {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        /* Popular Articles */
        .safe-popular-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-popular-item {
          display: flex;
          gap: 0.75rem;
          cursor: pointer;
        }

        .safe-popular-image {
          width: 5rem;
          height: 3.75rem;
          flex-shrink: 0;
        }

        .safe-popular-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
        }

        .safe-popular-content {
          flex: 1;
        }

        .safe-popular-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem;
          line-height: 1.4;
        }

        .safe-popular-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Category List */
        .safe-category-list {
          display: flex;
          flex-direction: column;
        }

        .safe-category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: color 0.2s;
        }

        .safe-category-item:hover {
          color: #0f766e;
        }

        .safe-category-item:last-child {
          border-bottom: none;
        }

        .safe-category-name {
          font-size: 0.875rem;
          color: #4b5563;
        }

        .safe-category-count {
          font-size: 0.75rem;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 0.125rem 0.5rem;
          border-radius: 1rem;
        }

        /* Newsletter */
        .safe-newsletter-card {
          background: linear-gradient(135deg, #0f766e 0%, #0f766e 100%);
          padding: 1.75rem;
          border-radius: 0.75rem;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .safe-newsletter-icon {
          color: white;
          margin-bottom: 1rem;
        }

        .safe-newsletter-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          margin: 0 0 0.5rem;
        }

        .safe-newsletter-text {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }

        .safe-newsletter-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          border: none;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          outline: none;
          box-sizing: border-box;
        }

        .safe-newsletter-btn {
          width: 100%;
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

        .safe-newsletter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Authors */
        .safe-authors-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .safe-author-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .safe-author-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .safe-author-info {
          flex: 1;
        }

        .safe-author-stats {
          font-size: 0.75rem;
          color: #0f766e;
          font-weight: 500;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .safe-blog-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .safe-featured-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .safe-hero-title {
            font-size: 2.25rem;
          }
          
          .safe-section-title {
            font-size: 1.75rem;
          }
          
          .safe-articles-grid {
            grid-template-columns: 1fr;
          }
          
          .safe-category-tabs {
            flex-wrap: wrap;
          }
          
          .safe-blog-container {
            padding: 0 1rem;
          }
        }

        @media (max-width: 640px) {
          .safe-hero-title {
            font-size: 1.875rem;
          }
          
          .safe-blog-main {
            padding: 2rem 0;
          }
          
          .safe-search-btn {
            position: relative;
            width: 100%;
            margin-top: 0.5rem;
            transform: none;
            right: auto;
            top: auto;
          }
        }

        /* Image Loading */
        .safe-featured-image img,
        .safe-article-image img,
        .safe-popular-image img {
          background: #f3f4f6;
        }

        /* Focus States */
        .safe-search-input:focus,
        .safe-newsletter-input:focus {
          outline: 2px solid #0f766e;
          outline-offset: 2px;
        }

        .safe-category-tab:focus,
        .safe-page-btn:focus,
        .safe-read-btn:focus,
        .safe-search-btn:focus,
        .safe-newsletter-btn:focus {
          outline: 2px solid #0f766e;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default BlogPage;
