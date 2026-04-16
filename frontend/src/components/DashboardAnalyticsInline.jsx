import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import {
  TrendingUp, Users, FileText, CheckCircle, XCircle,
  AlertCircle, Clock, Mail, Download, Eye, Edit,
  DollarSign, CreditCard, UserPlus, Star, Activity,
  Shield, Target, Zap, PieChart as PieChartIcon,
  ChevronDown, ChevronUp, Calendar, Award, Briefcase
} from 'lucide-react';
import '../style/DashboardAnalyticsInline.css';

// Chart color palette
const CHART_COLORS = [
  "#6366f1", "#22c55e", "#f97316", "#ef4444",
  "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16"
];

const PIE_COLORS = ["#22c55e", "#f97316", "#ef4444", "#94a3b8"];

const DashboardAnalyticsInline = ({
  analyticsData,
  loading,
  expandedSections,
  onToggleSection
}) => {

  // Prepare chart data from real analytics
  const documentChartData = [
    { name: 'Draft', value: analyticsData.documents?.draft || 0, color: '#94a3b8' },
    { name: 'Sent', value: analyticsData.documents?.sent || 0, color: '#0ea5e9' },
    { name: 'In Progress', value: analyticsData.documents?.in_progress || 0, color: '#f97316' },
    { name: 'Completed', value: analyticsData.documents?.completed || 0, color: '#22c55e' },
    { name: 'Declined', value: analyticsData.documents?.declined || 0, color: '#ef4444' },
    { name: 'Expired', value: analyticsData.documents?.expired || 0, color: '#f59e0b' },
    { name: 'Voided', value: analyticsData.documents?.voided || 0, color: '#a855f7' }
  ].filter(item => item.value > 0);

  const recipientStatusData = [
    { name: 'Completed', value: analyticsData.recipients?.completed || 0 },
    { name: 'In Progress', value: analyticsData.recipients?.in_progress || 0 },
    { name: 'Invited', value: analyticsData.recipients?.invited || 0 },
    { name: 'Viewed', value: analyticsData.recipients?.viewed || 0 },
    { name: 'Declined', value: analyticsData.recipients?.declined || 0 }
  ].filter(item => item.value > 0);

  const roleDistributionData = Object.entries(analyticsData.recipients?.by_role || {})
    .map(([role, count]) => ({ name: role.replace('_', ' '), value: count }))
    .filter(item => item.value > 0);

  const fieldCompletionData = Object.entries(analyticsData.fields?.by_type || {})
    .map(([type, stats]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      completed: stats.completed || 0,
      total: stats.total || 0,
      percentage: stats.percentage || 0
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const activityChartData = analyticsData.activities?.timeline || [];
  const trendsData = analyticsData.trends || [];
  const funnelData = [
    { stage: 'Uploaded', value: analyticsData.funnel?.uploaded || 0, color: '#94a3b8' },
    { stage: 'Sent', value: analyticsData.funnel?.sent || 0, color: '#6366f1' },
    { stage: 'Viewed', value: analyticsData.funnel?.viewed || 0, color: '#f59e0b' },
    { stage: 'Started', value: analyticsData.funnel?.started || 0, color: '#0ea5e9' },
    { stage: 'Completed', value: analyticsData.funnel?.completed || 0, color: '#22c55e' }
  ];

  const platformData = Object.entries(analyticsData.activities?.platforms || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const hourlyData = (analyticsData.activities?.hourly || []).map((count, hour) => ({
    hour: `${hour}:00`,
    count
  }));

  // Funnel Analytics Section
  const FunnelSection = () => (
    <div className="analytics-section-content">
      <div className="funnel-container">
        {funnelData.map((item, index) => {
          const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
          const conversion = prevValue > 0 ? ((item.value / prevValue) * 100).toFixed(1) : 0;

          return (
            <div key={index} className="funnel-stage">
              <div className="stage-header">
                <span className="stage-name">{item.stage}</span>
                <span className="stage-value">{item.value}</span>
              </div>
              <div className="stage-bar-container">
                <div
                  className="stage-bar"
                  style={{
                    width: `${(item.value / funnelData[0].value) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              {index > 0 && (
                <div className="stage-conversion">
                  <TrendingUp size={12} />
                  <span>{conversion}% conversion</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Efficiency Section
  const EfficiencySection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon orange"><Zap size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Velocity</span>
            <span className="kpi-value">{analyticsData.efficiency?.velocity || 0}%</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon teal"><Clock size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Sign Time</span>
            <span className="kpi-value">{analyticsData.efficiency?.avg_signing_time || 0}h</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon indigo"><Target size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completion Rate</span>
            <span className="kpi-value">{analyticsData.efficiency?.completion_rate || 0}%</span>
          </div>
        </div>
      </div>

      {hourlyData.length > 0 && (
        <div className="mini-chart mt-4">
          <h5>Activity Distribution (24h)</h5>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={hourlyData}>
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Document Analytics Section
  const DocumentSection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon blue"><FileText size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{analyticsData.documents?.total || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon green"><CheckCircle size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value">{analyticsData.documents?.completed || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon orange"><Clock size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">In Progress</span>
            <span className="kpi-value">{analyticsData.documents?.in_progress || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon red"><XCircle size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Declined</span>
            <span className="kpi-value">{analyticsData.documents?.declined || 0}</span>
          </div>
        </div>
      </div>

      <div className="status-badges">
        <span className="status-badge draft">Draft: {analyticsData.documents?.draft || 0}</span>
        <span className="status-badge sent">Sent: {analyticsData.documents?.sent || 0}</span>
        <span className="status-badge expired">Expired: {analyticsData.documents?.expired || 0}</span>
        <span className="status-badge voided">Voided: {analyticsData.documents?.voided || 0}</span>
      </div>

      {documentChartData.length > 0 && (
        <div className="mini-chart">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={documentChartData}>
              <Tooltip
                formatter={(value) => [`${value} documents`, 'Count']}
                labelFormatter={(label) => `Status: ${label}`}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {documentChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Recipient Analytics Section
  const RecipientSection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon purple"><Users size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{analyticsData.recipients?.total || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon green"><CheckCircle size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value">{analyticsData.recipients?.completed || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon teal"><Clock size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Avg Time</span>
            <span className="kpi-value">{analyticsData.recipients?.avg_signing_time || 0}h</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon indigo"><Target size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Rate</span>
            <span className="kpi-value">{analyticsData.recipients?.completion_rate || 0}%</span>
          </div>
        </div>
      </div>

      <div className="recipient-stats">
        <div className="stat-row">
          <span>Invited</span>
          <span className="stat-value">{analyticsData.recipients?.invited || 0}</span>
        </div>
        <div className="stat-row">
          <span>Viewed</span>
          <span className="stat-value">{analyticsData.recipients?.viewed || 0}</span>
        </div>
        <div className="stat-row">
          <span>In Progress</span>
          <span className="stat-value">{analyticsData.recipients?.in_progress || 0}</span>
        </div>
        <div className="stat-row">
          <span>Declined</span>
          <span className="stat-value">{analyticsData.recipients?.declined || 0}</span>
        </div>
      </div>

      {roleDistributionData.length > 0 && (
        <div className="mini-pie-chart">
          <h5>Role Distribution</h5>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={roleDistributionData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {roleDistributionData.map((entry, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Fields Analytics Section
  const FieldsSection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon indigo"><Edit size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{analyticsData.fields?.total_fields || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon green"><CheckCircle size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value">{analyticsData.fields?.completed_fields || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon blue"><Target size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completion</span>
            <span className="kpi-value">{analyticsData.fields?.completion_percentage || 0}%</span>
          </div>
        </div>
      </div>

      <div className="field-progress-list">
        {fieldCompletionData.map((field, index) => (
          <div key={index} className="field-progress-item">
            <div className="field-progress-header">
              <span className="field-name">{field.name}</span>
              <span className="field-percent">{field.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${field.percentage}%` }}
              />
            </div>
            <div className="field-numbers">
              <span>{field.completed} / {field.total}</span>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(analyticsData.fields?.by_type || {}).length > 0 && (
        <div className="field-type-stats">
          <h5>By Field Type</h5>
          <div className="type-grid">
            {Object.entries(analyticsData.fields.by_type).map(([type, stats]) => (
              <div key={type} className="type-item">
                <span className="type-name">{type.replace('_', ' ')}</span>
                <span className="type-count">{stats.completed}/{stats.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Activity Analytics Section
  const ActivitySection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon blue"><Activity size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total</span>
            <span className="kpi-value">{analyticsData.activities?.total || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon green"><Eye size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Views</span>
            <span className="kpi-value">{analyticsData.activities?.counts?.viewed || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon purple"><Download size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Downloads</span>
            <span className="kpi-value">{analyticsData.activities?.counts?.downloaded || 0}</span>
          </div>
        </div>
        <div className="kpi-card small">
          <div className="kpi-icon orange"><Edit size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Signatures</span>
            <span className="kpi-value">{analyticsData.activities?.counts?.signed || 0}</span>
          </div>
        </div>
      </div>

      {platformData.length > 0 && (
        <div className="mini-chart mt-4 mb-4">
          <h5>Platforms & Browsers</h5>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart layout="vertical" data={platformData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activityChartData.length > 0 && (
        <div className="mini-chart">
          <h5>Last 30 Days Trend</h5>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={activityChartData}>
              <Tooltip />
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                fill="url(#activityGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Subscription Analytics Section
  const SubscriptionSection = () => (
    <div className="analytics-section-content">
      <div className="subscription-mini-card" data-active={analyticsData.subscription?.has_active}>
        <div className="plan-info">
          <span className="plan-badge">
            {analyticsData.subscription?.has_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span className="plan-name">{analyticsData.subscription?.plan || 'Free Account'}</span>
        </div>
        {analyticsData.subscription?.days_left > 0 && (
          <div className="days-remaining">
            <Clock size={14} />
            <span>{analyticsData.subscription.days_left} days remaining</span>
          </div>
        )}
      </div>
    </div>
  );

  // Contacts Analytics Section
  const ContactsSection = () => (
    <div className="analytics-section-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card small">
          <div className="kpi-icon blue"><UserPlus size={20} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Contacts</span>
            <span className="kpi-value">{analyticsData.contacts?.total_contacts || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Trends Section
  const TrendsSection = () => (
    <div className="analytics-section-content">
      {trendsData.length > 0 && (
        <div className="trends-chart">
          <h5>Monthly Growth</h5>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                name="Docs Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                name="Signed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-loading-mini">
        <div className="loader-mini"></div>
        <span>Powering up enterprise analytics...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-analytics-inline">
      {/* Header with Time Range Select (UI Only for now) */}
      <div className="analytics-global-header">
        <div className="header-left">
          <Activity size={20} className="section-icon" />
          <h2 className="dashboard-title">System Insights</h2>
        </div>
        <div className="time-range-selector">
          <button className="range-btn active">Last 30 Days</button>
          <button className="range-btn">90 Days</button>
          <button className="range-btn">All Time</button>
        </div>
      </div>

      {/* Conversion Funnel Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('funnel')}
        >
          <div className="header-left">
            <Target size={18} className="section-icon" />
            <span>Success Funnel</span>
            <span className="section-percent">{analyticsData.recipients?.completion_rate || 0}% Completion</span>
          </div>
          {expandedSections.funnel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.funnel && <FunnelSection />}
      </div>

      {/* Efficiency Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('efficiency')}
        >
          <div className="header-left">
            <Zap size={18} className="section-icon" />
            <span>Workflow Velocity</span>
            <span className="section-count">{analyticsData.efficiency?.velocity || 0}% efficiency</span>
          </div>
          {expandedSections.efficiency ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.efficiency && <EfficiencySection />}
      </div>

      {/* Document Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('documents')}
        >
          <div className="header-left">
            <FileText size={18} className="section-icon" />
            <span>Portfolio Status</span>
            <span className="section-count">{analyticsData.documents?.total || 0} Documents</span>
          </div>
          {expandedSections.documents ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.documents && <DocumentSection />}
      </div>

      {/* Recipients Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('recipients')}
        >
          <div className="header-left">
            <Users size={18} className="section-icon" />
            <span>Collaboration Metrics</span>
            <span className="section-count">{analyticsData.recipients?.total || 0} Recipients</span>
          </div>
          {expandedSections.recipients ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.recipients && <RecipientSection />}
      </div>

      {/* Activity Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('activity')}
        >
          <div className="header-left">
            <Activity size={18} className="section-icon" />
            <span>Real-time Operations</span>
          </div>
          {expandedSections.activity ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.activity && <ActivitySection />}
      </div>

      {/* Growth Trends Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('trends')}
        >
          <div className="header-left">
            <TrendingUp size={18} className="section-icon" />
            <span>Portfolio Growth</span>
          </div>
          {expandedSections.trends ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.trends && <TrendsSection />}
      </div>

      {/* System & Plan Section */}
      <div className="analytics-section">
        <div
          className="analytics-section-header"
          onClick={() => onToggleSection('subscription')}
        >
          <div className="header-left">
            <Award size={18} className="section-icon" />
            <span>Enterprise Account</span>
            <span className="section-percent">{analyticsData.subscription?.plan || 'Free'}</span>
          </div>
          {expandedSections.subscription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {expandedSections.subscription && <SubscriptionSection />}
      </div>
    </div>
  );
};

export default DashboardAnalyticsInline;
