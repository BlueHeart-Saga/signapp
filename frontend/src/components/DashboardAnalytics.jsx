import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Tooltip, Legend, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  TrendingUp, Users, FileText, CheckCircle, XCircle,
  AlertCircle, Clock, Mail, Download, Eye, Edit,
  DollarSign, CreditCard, UserPlus, Star, Activity,
  Calendar, Award, Shield, Target, Zap, PieChart as PieChartIcon
} from 'lucide-react';
import '../style/DashboardAnalytics.css';

// Analytics API Service
const analyticsAPI = {
  // Document Analytics
  getDocumentAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const response = await fetch(`${baseURL}/documents/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch document stats');
      const stats = await response.json();
      
      return {
        total: stats.total || 0,
        draft: stats.draft || 0,
        sent: stats.sent || 0,
        in_progress: stats.in_progress || 0,
        completed: stats.completed || 0,
        declined: stats.declined || 0,
        expired: stats.expired || 0,
        voided: stats.voided || 0,
        deleted: stats.deleted || 0
      };
    } catch (error) {
      console.error('Error fetching document analytics:', error);
      return {
        total: 0, draft: 0, sent: 0, in_progress: 0,
        completed: 0, declined: 0, expired: 0, voided: 0, deleted: 0
      };
    }
  },

  // Recipient Analytics
  getRecipientAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const response = await fetch(`${baseURL}/recipients/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch recipient analytics');
      const activeRecipients = await response.json();
      
      // Get documents to calculate per-document recipient stats
      const docsResponse = await fetch(`${baseURL}/documents?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const documents = await docsResponse.json();
      
      // Calculate recipient statistics
      let totalRecipients = 0;
      let invited = 0;
      let viewed = 0;
      let inProgress = 0;
      let completed = 0;
      let declined = 0;
      let totalSigningTime = 0;
      let completedCount = 0;
      
      // Get all recipients for completed documents to calculate avg signing time
      for (const doc of documents) {
        const recipientsResponse = await fetch(`${baseURL}/recipients/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (recipientsResponse.ok) {
          const recipients = await recipientsResponse.json();
          
          recipients.forEach(r => {
            totalRecipients++;
            
            // Status counts
            switch(r.status) {
              case 'invited': invited++; break;
              case 'viewed': viewed++; break;
              case 'in_progress': inProgress++; break;
              case 'completed': 
                completed++; 
                // Calculate signing time if available
                if (r.sent_at && r.completed_at) {
                  const sentTime = new Date(r.sent_at);
                  const completedTime = new Date(r.completed_at);
                  const hoursDiff = (completedTime - sentTime) / (1000 * 60 * 60);
                  totalSigningTime += hoursDiff;
                  completedCount++;
                }
                break;
              case 'declined': declined++; break;
              default: break;
            }
          });
        }
      }
      
      const avgSigningTime = completedCount > 0 
        ? Math.round((totalSigningTime / completedCount) * 10) / 10 
        : 0;
      
      return {
        total: totalRecipients,
        invited,
        viewed,
        in_progress: inProgress,
        completed,
        declined,
        avg_signing_time: avgSigningTime,
        completion_rate: totalRecipients > 0 
          ? Math.round((completed / totalRecipients) * 100) 
          : 0
      };
    } catch (error) {
      console.error('Error fetching recipient analytics:', error);
      return {
        total: 0, invited: 0, viewed: 0, in_progress: 0,
        completed: 0, declined: 0, avg_signing_time: 0, completion_rate: 0
      };
    }
  },

  // Field Analytics
  getFieldAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const docsResponse = await fetch(`${baseURL}/documents?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const documents = await docsResponse.json();
      
      let totalFields = 0;
      let completedFields = 0;
      let totalSignatures = 0;
      let completedSignatures = 0;
      let totalInitials = 0;
      let completedInitials = 0;
      let totalFormFields = 0;
      let completedFormFields = 0;
      let totalCheckboxes = 0;
      let completedCheckboxes = 0;
      
      // Fetch fields for each document
      for (const doc of documents.slice(0, 20)) { // Limit to 20 docs for performance
        const fieldsResponse = await fetch(`${baseURL}/fields/document/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (fieldsResponse.ok) {
          const fields = await fieldsResponse.json();
          
          fields.forEach(f => {
            totalFields++;
            
            const isCompleted = f.completed_at || f.is_completed;
            if (isCompleted) completedFields++;
            
            // Count by type
            switch(f.type) {
              case 'signature':
              case 'witness_signature':
                totalSignatures++;
                if (isCompleted) completedSignatures++;
                break;
              case 'initials':
                totalInitials++;
                if (isCompleted) completedInitials++;
                break;
              case 'textbox':
              case 'date':
              case 'mail':
              case 'dropdown':
                totalFormFields++;
                if (isCompleted) completedFormFields++;
                break;
              case 'checkbox':
              case 'radio':
                totalCheckboxes++;
                if (isCompleted) completedCheckboxes++;
                break;
              default: break;
            }
          });
        }
      }
      
      return {
        total_fields: totalFields,
        completed_fields: completedFields,
        completion_percentage: totalFields > 0 
          ? Math.round((completedFields / totalFields) * 100) 
          : 0,
        signatures: {
          total: totalSignatures,
          completed: completedSignatures,
          percentage: totalSignatures > 0 
            ? Math.round((completedSignatures / totalSignatures) * 100) 
            : 0
        },
        initials: {
          total: totalInitials,
          completed: completedInitials,
          percentage: totalInitials > 0 
            ? Math.round((completedInitials / totalInitials) * 100) 
            : 0
        },
        form_fields: {
          total: totalFormFields,
          completed: completedFormFields,
          percentage: totalFormFields > 0 
            ? Math.round((completedFormFields / totalFormFields) * 100) 
            : 0
        },
        checkboxes: {
          total: totalCheckboxes,
          completed: completedCheckboxes,
          percentage: totalCheckboxes > 0 
            ? Math.round((completedCheckboxes / totalCheckboxes) * 100) 
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching field analytics:', error);
      return {
        total_fields: 0, completed_fields: 0, completion_percentage: 0,
        signatures: { total: 0, completed: 0, percentage: 0 },
        initials: { total: 0, completed: 0, percentage: 0 },
        form_fields: { total: 0, completed: 0, percentage: 0 },
        checkboxes: { total: 0, completed: 0, percentage: 0 }
      };
    }
  },

  // Activity Analytics
  getActivityAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const response = await fetch(`${baseURL}/documents/audit-logs/recent?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      const activities = await response.json();
      
      // Count activity types
      const activityCounts = {
        viewed: 0,
        downloaded: 0,
        signed: 0,
        completed: 0,
        declined: 0,
        voided: 0,
        other: 0
      };
      
      // Activity timeline by day (last 7 days)
      const last7Days = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = 0;
      }
      
      activities.forEach(a => {
        const action = a.action || a.type || '';
        
        // Count by type
        if (action.includes('view')) activityCounts.viewed++;
        else if (action.includes('download')) activityCounts.downloaded++;
        else if (action.includes('sign') || action.includes('complete')) activityCounts.signed++;
        else if (action.includes('finalized')) activityCounts.completed++;
        else if (action.includes('decline')) activityCounts.declined++;
        else if (action.includes('void')) activityCounts.voided++;
        else activityCounts.other++;
        
        // Timeline data
        if (a.timestamp) {
          const dateStr = a.timestamp.split('T')[0];
          if (last7Days.hasOwnProperty(dateStr)) {
            last7Days[dateStr]++;
          }
        }
      });
      
      const timelineData = Object.entries(last7Days).map(([date, count]) => ({
        date: date.slice(5), // Show MM-DD
        count
      }));
      
      return {
        counts: activityCounts,
        timeline: timelineData,
        total_activities: activities.length,
        recent_count: activities.slice(0, 10).length
      };
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      return {
        counts: { viewed: 0, downloaded: 0, signed: 0, completed: 0, declined: 0, voided: 0, other: 0 },
        timeline: [],
        total_activities: 0,
        recent_count: 0
      };
    }
  },

  // Subscription Analytics
  getSubscriptionAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const response = await fetch(`${baseURL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      const status = await response.json();
      
      const historyResponse = await fetch(`${baseURL}/subscription/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const history = historyResponse.ok ? await historyResponse.json() : { payments: [] };
      
      // Calculate subscription metrics
      const payments = history.payments || [];
      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const successfulPayments = payments.filter(p => p.status === 'completed').length;
      const paymentSuccessRate = payments.length > 0 
        ? Math.round((successfulPayments / payments.length) * 100) 
        : 0;
      
      return {
        has_active: status.has_active_subscription || false,
        status: status.status || 'inactive',
        plan_type: status.plan_type || null,
        plan_name: status.plan_name || 'No Active Plan',
        days_remaining: status.days_remaining || 0,
        total_revenue: totalRevenue,
        total_payments: payments.length,
        payment_success_rate: paymentSuccessRate,
        is_trial: status.plan_type === 'free_trial'
      };
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return {
        has_active: false, status: 'inactive', plan_type: null,
        plan_name: 'No Active Plan', days_remaining: 0,
        total_revenue: 0, total_payments: 0, payment_success_rate: 0,
        is_trial: false
      };
    }
  },

  // Contact Analytics
  getContactAnalytics: async () => {
    try {
      const token = localStorage.getItem("token");
      const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";
      
      const response = await fetch(`${baseURL}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const contacts = await response.json();
      
      // Count frequent recipients (appear in multiple documents)
      const docsResponse = await fetch(`${baseURL}/documents?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const documents = await docsResponse.json();
      
      // Track email frequencies across documents
      const emailFrequency = {};
      
      for (const doc of documents) {
        const recipientsResponse = await fetch(`${baseURL}/recipients/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (recipientsResponse.ok) {
          const recipients = await recipientsResponse.json();
          recipients.forEach(r => {
            emailFrequency[r.email] = (emailFrequency[r.email] || 0) + 1;
          });
        }
      }
      
      // Count frequent recipients (appear in 3+ documents)
      const frequentRecipients = Object.values(emailFrequency).filter(f => f >= 3).length;
      
      return {
        total_contacts: contacts.length || 0,
        frequent_recipients: frequentRecipients,
        unique_contacts: contacts.length || 0,
        recent_contacts: contacts.slice(0, 5).length
      };
    } catch (error) {
      console.error('Error fetching contact analytics:', error);
      return {
        total_contacts: 0,
        frequent_recipients: 0,
        unique_contacts: 0,
        recent_contacts: 0
      };
    }
  }
};

// Chart color palette
const CHART_COLORS = [
  "#6366f1", "#22c55e", "#f97316", "#ef4444", 
  "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6",
  "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16"
];

const PIE_COLORS = ["#22c55e", "#f97316", "#ef4444", "#94a3b8"];

const DashboardAnalytics = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    documents: {},
    recipients: {},
    fields: {},
    activities: {},
    subscription: {},
    contacts: {}
  });

  // Load all analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [
          documents,
          recipients,
          fields,
          activities,
          subscription,
          contacts
        ] = await Promise.all([
          analyticsAPI.getDocumentAnalytics(),
          analyticsAPI.getRecipientAnalytics(),
          analyticsAPI.getFieldAnalytics(),
          analyticsAPI.getActivityAnalytics(),
          analyticsAPI.getSubscriptionAnalytics(),
          analyticsAPI.getContactAnalytics()
        ]);

        setAnalyticsData({
          documents,
          recipients,
          fields,
          activities,
          subscription,
          contacts
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  // Prepare chart data
  const documentChartData = [
    { name: 'Draft', value: analyticsData.documents.draft || 0, color: '#94a3b8' },
    { name: 'Sent', value: analyticsData.documents.sent || 0, color: '#0ea5e9' },
    { name: 'In Progress', value: analyticsData.documents.in_progress || 0, color: '#f97316' },
    { name: 'Completed', value: analyticsData.documents.completed || 0, color: '#22c55e' },
    { name: 'Declined', value: analyticsData.documents.declined || 0, color: '#ef4444' },
    { name: 'Expired', value: analyticsData.documents.expired || 0, color: '#f59e0b' },
    { name: 'Voided', value: analyticsData.documents.voided || 0, color: '#a855f7' }
  ].filter(item => item.value > 0);

  const recipientStatusData = [
    { name: 'Completed', value: analyticsData.recipients.completed || 0 },
    { name: 'In Progress', value: analyticsData.recipients.in_progress || 0 },
    { name: 'Invited', value: analyticsData.recipients.invited || 0 },
    { name: 'Declined', value: analyticsData.recipients.declined || 0 }
  ].filter(item => item.value > 0);

  const fieldCompletionData = [
    { name: 'Signatures', completed: analyticsData.fields.signatures?.completed || 0, total: analyticsData.fields.signatures?.total || 0 },
    { name: 'Initials', completed: analyticsData.fields.initials?.completed || 0, total: analyticsData.fields.initials?.total || 0 },
    { name: 'Form Fields', completed: analyticsData.fields.form_fields?.completed || 0, total: analyticsData.fields.form_fields?.total || 0 },
    { name: 'Checkboxes', completed: analyticsData.fields.checkboxes?.completed || 0, total: analyticsData.fields.checkboxes?.total || 0 }
  ].filter(item => item.total > 0);

  const activityChartData = analyticsData.activities.timeline || [];

  // Tab content components
  const OverviewTab = () => (
    <div className="analytics-overview">
      {/* KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><FileText size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Documents</span>
            <span className="kpi-value">{analyticsData.documents.total || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value">{analyticsData.documents.completed || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange"><Users size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Recipients</span>
            <span className="kpi-value">{analyticsData.recipients.total || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple"><Edit size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Fields</span>
            <span className="kpi-value">{analyticsData.fields.total_fields || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon teal"><Activity size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Activities</span>
            <span className="kpi-value">{analyticsData.activities.total_activities || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon indigo"><Star size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Completion Rate</span>
            <span className="kpi-value">{analyticsData.recipients.completion_rate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="analytics-charts-row">
        <div className="chart-card">
          <h4>Document Status Distribution</h4>
          {documentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={documentChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {documentChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No document data available</div>
          )}
        </div>

        <div className="chart-card">
          <h4>Activity Timeline (Last 7 Days)</h4>
          {activityChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
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
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No activity data available</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="analytics-charts-row">
        <div className="chart-card">
          <h4>Field Completion</h4>
          {fieldCompletionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fieldCompletionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#94a3b8" name="Total" stackId="a" />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No field data available</div>
          )}
        </div>

        <div className="chart-card">
          <h4>Recipient Status</h4>
          {recipientStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={recipientStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {recipientStatusData.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">No recipient data available</div>
          )}
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="analytics-tab-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><FileText size={24} /></div>
          <span className="kpi-label">Total Documents</span>
          <span className="kpi-value large">{analyticsData.documents.total || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle size={24} /></div>
          <span className="kpi-label">Completed</span>
          <span className="kpi-value">{analyticsData.documents.completed || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><Clock size={24} /></div>
          <span className="kpi-label">In Progress</span>
          <span className="kpi-value">{analyticsData.documents.in_progress || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><XCircle size={24} /></div>
          <span className="kpi-label">Declined</span>
          <span className="kpi-value">{analyticsData.documents.declined || 0}</span>
        </div>
      </div>

      <div className="full-width-chart">
        <h4>Document Status Breakdown</h4>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={documentChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {documentChartData.map((entry, index) => (
                <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const RecipientsTab = () => (
    <div className="analytics-tab-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon purple"><Users size={24} /></div>
          <span className="kpi-label">Total Recipients</span>
          <span className="kpi-value large">{analyticsData.recipients.total || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle size={24} /></div>
          <span className="kpi-label">Completed</span>
          <span className="kpi-value">{analyticsData.recipients.completed || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><Clock size={24} /></div>
          <span className="kpi-label">In Progress</span>
          <span className="kpi-value">{analyticsData.recipients.in_progress || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon teal"><Zap size={24} /></div>
          <span className="kpi-label">Avg Signing Time</span>
          <span className="kpi-value">{analyticsData.recipients.avg_signing_time || 0}h</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Invited</span>
          <span className="stat-value">{analyticsData.recipients.invited || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Viewed</span>
          <span className="stat-value">{analyticsData.recipients.viewed || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Declined</span>
          <span className="stat-value">{analyticsData.recipients.declined || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completion Rate</span>
          <span className="stat-value">{analyticsData.recipients.completion_rate || 0}%</span>
        </div>
      </div>

      <div className="chart-container">
        <h4>Recipient Status Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={recipientStatusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {recipientStatusData.map((entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const FieldsTab = () => (
    <div className="analytics-tab-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon indigo"><Edit size={24} /></div>
          <span className="kpi-label">Total Fields</span>
          <span className="kpi-value large">{analyticsData.fields.total_fields || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle size={24} /></div>
          <span className="kpi-label">Completed</span>
          <span className="kpi-value">{analyticsData.fields.completed_fields || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><Target size={24} /></div>
          <span className="kpi-label">Completion %</span>
          <span className="kpi-value">{analyticsData.fields.completion_percentage || 0}%</span>
        </div>
      </div>

      <div className="field-stats-grid">
        <div className="field-stat-card">
          <h5>Signatures</h5>
          <div className="field-stat-progress">
            <div 
              className="field-stat-bar" 
              style={{ width: `${analyticsData.fields.signatures?.percentage || 0}%` }}
            />
          </div>
          <div className="field-stat-numbers">
            <span>{analyticsData.fields.signatures?.completed || 0} / {analyticsData.fields.signatures?.total || 0}</span>
            <span className="field-stat-percent">{analyticsData.fields.signatures?.percentage || 0}%</span>
          </div>
        </div>

        <div className="field-stat-card">
          <h5>Initials</h5>
          <div className="field-stat-progress">
            <div 
              className="field-stat-bar" 
              style={{ width: `${analyticsData.fields.initials?.percentage || 0}%` }}
            />
          </div>
          <div className="field-stat-numbers">
            <span>{analyticsData.fields.initials?.completed || 0} / {analyticsData.fields.initials?.total || 0}</span>
            <span className="field-stat-percent">{analyticsData.fields.initials?.percentage || 0}%</span>
          </div>
        </div>

        <div className="field-stat-card">
          <h5>Form Fields</h5>
          <div className="field-stat-progress">
            <div 
              className="field-stat-bar" 
              style={{ width: `${analyticsData.fields.form_fields?.percentage || 0}%` }}
            />
          </div>
          <div className="field-stat-numbers">
            <span>{analyticsData.fields.form_fields?.completed || 0} / {analyticsData.fields.form_fields?.total || 0}</span>
            <span className="field-stat-percent">{analyticsData.fields.form_fields?.percentage || 0}%</span>
          </div>
        </div>

        <div className="field-stat-card">
          <h5>Checkboxes</h5>
          <div className="field-stat-progress">
            <div 
              className="field-stat-bar" 
              style={{ width: `${analyticsData.fields.checkboxes?.percentage || 0}%` }}
            />
          </div>
          <div className="field-stat-numbers">
            <span>{analyticsData.fields.checkboxes?.completed || 0} / {analyticsData.fields.checkboxes?.total || 0}</span>
            <span className="field-stat-percent">{analyticsData.fields.checkboxes?.percentage || 0}%</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h4>Field Completion by Type</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fieldCompletionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#94a3b8" name="Total Fields" />
            <Bar dataKey="completed" fill="#22c55e" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const ActivityTab = () => (
    <div className="analytics-tab-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Activity size={24} /></div>
          <span className="kpi-label">Total Activities</span>
          <span className="kpi-value large">{analyticsData.activities.total_activities || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><Eye size={24} /></div>
          <span className="kpi-label">Views</span>
          <span className="kpi-value">{analyticsData.activities.counts?.viewed || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><Download size={24} /></div>
          <span className="kpi-label">Downloads</span>
          <span className="kpi-value">{analyticsData.activities.counts?.downloaded || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange"><Edit size={24} /></div>
          <span className="kpi-label">Signatures</span>
          <span className="kpi-value">{analyticsData.activities.counts?.signed || 0}</span>
        </div>
      </div>

      <div className="chart-container">
        <h4>Activity Timeline</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#6366f1" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="activity-breakdown">
        <h4>Activity Breakdown</h4>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">Viewed</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.viewed || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Downloaded</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.downloaded || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Signed</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.signed || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Completed</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.completed || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Declined</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.declined || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Voided</span>
            <span className="breakdown-value">{analyticsData.activities.counts?.voided || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SubscriptionTab = () => (
    <div className="analytics-tab-content">
      <div className="subscription-status-card">
        <div className="status-header">
          <h4>Current Plan Status</h4>
          <span className={`status-badge ${analyticsData.subscription.has_active ? 'active' : 'inactive'}`}>
            {analyticsData.subscription.has_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="plan-details">
          <div className="plan-name">{analyticsData.subscription.plan_name}</div>
          {analyticsData.subscription.days_remaining > 0 && (
            <div className="days-remaining">
              <Clock size={16} />
              <span>{analyticsData.subscription.days_remaining} days remaining</span>
            </div>
          )}
          {analyticsData.subscription.is_trial && (
            <div className="trial-badge">Trial</div>
          )}
        </div>
      </div>

      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon green"><DollarSign size={24} /></div>
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value large">${analyticsData.subscription.total_revenue?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><CreditCard size={24} /></div>
          <span className="kpi-label">Total Payments</span>
          <span className="kpi-value">{analyticsData.subscription.total_payments || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><Zap size={24} /></div>
          <span className="kpi-label">Success Rate</span>
          <span className="kpi-value">{analyticsData.subscription.payment_success_rate || 0}%</span>
        </div>
      </div>
    </div>
  );

  const ContactsTab = () => (
    <div className="analytics-tab-content">
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><UserPlus size={24} /></div>
          <span className="kpi-label">Total Contacts</span>
          <span className="kpi-value large">{analyticsData.contacts.total_contacts || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><Star size={24} /></div>
          <span className="kpi-label">Frequent Recipients</span>
          <span className="kpi-value">{analyticsData.contacts.frequent_recipients || 0}</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><Users size={24} /></div>
          <span className="kpi-label">Unique Contacts</span>
          <span className="kpi-value">{analyticsData.contacts.unique_contacts || 0}</span>
        </div>
      </div>

      <div className="contact-insights">
        <h4>Contact Insights</h4>
        <p className="insight-text">
          You have {analyticsData.contacts.total_contacts || 0} contacts in your network.
          {analyticsData.contacts.frequent_recipients > 0 && 
            ` ${analyticsData.contacts.frequent_recipients} of them are frequent recipients (appear in 3+ documents).`}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="analytics-modal">
        <div className="analytics-content">
          <div className="analytics-header">
            <h2>Dashboard Analytics</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="analytics-loading">
            <div className="loader"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-modal">
      <div className="analytics-content">
        <div className="analytics-header">
          <h2>📊 Dashboard Analytics</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <PieChartIcon size={16} /> Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={16} /> Documents
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recipients' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipients')}
          >
            <Users size={16} /> Recipients
          </button>
          <button 
            className={`tab-btn ${activeTab === 'fields' ? 'active' : ''}`}
            onClick={() => setActiveTab('fields')}
          >
            <Edit size={16} /> Fields
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={16} /> Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            <Shield size={16} /> Subscription
          </button>
          <button 
            className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <UserPlus size={16} /> Contacts
          </button>
        </div>

        <div className="analytics-body">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'documents' && <DocumentsTab />}
          {activeTab === 'recipients' && <RecipientsTab />}
          {activeTab === 'fields' && <FieldsTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'subscription' && <SubscriptionTab />}
          {activeTab === 'contacts' && <ContactsTab />}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
