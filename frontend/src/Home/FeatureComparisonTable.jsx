import React from 'react';
import { Check, X, Zap } from 'lucide-react';

function FeatureComparisonTable() {
  const plans = [
    { key: 'free', label: 'FREE TRIAL', color: '#64748b' },
    { key: 'starter', label: 'STARTER ($5)', color: '#0284c7' },
    { key: 'standard', label: 'STANDARD ($15)', color: '#0f766e' },
    { key: 'professional', label: 'PRO ($50)', color: '#7c3aed' },
    { key: 'enterprise', label: 'ENTERPRISE ($200)', color: '#2563eb' },
    { key: 'custom', label: 'CUSTOM PRICE', color: '#059669' }
  ];

  const features = [
    {
      category: 'CREDITS & ALLOCATIONS',
      items: [
        {
          name: 'Included Credit Volume',
          free: '100 Credits',
          starter: '500 Credits',
          standard: '2,000 Credits',
          professional: '10,000 Credits',
          enterprise: '50,000 Credits',
          custom: '100,000+ Custom'
        },
        {
          name: 'Credit Expiration Policy',
          free: '15 Days Trial',
          starter: 'Never Expire',
          standard: 'Never Expire',
          professional: 'Never Expire',
          enterprise: 'Never Expire',
          custom: 'Never Expire'
        },
        {
          name: 'Estimated Document Signings',
          free: '~20 Documents',
          starter: '~100 Documents',
          standard: '~400 Documents',
          professional: '~2,000 Documents',
          enterprise: '~10,000 Documents',
          custom: 'Custom Volume'
        }
      ]
    },
    {
      category: 'DOCUMENT & AI CAPABILITIES',
      items: [
        {
          name: 'AI Agreement Generator',
          free: <Check size={16} color="#16a34a" />,
          starter: <Check size={16} color="#16a34a" />,
          standard: <Check size={16} color="#16a34a" />,
          professional: <Check size={16} color="#16a34a" />,
          enterprise: <Check size={16} color="#16a34a" />,
          custom: <Check size={16} color="#16a34a" />
        },
        {
          name: 'AI Field Auto-Positioning',
          free: <X size={16} color="#ef4444" />,
          starter: <X size={16} color="#ef4444" />,
          standard: <Check size={16} color="#16a34a" />,
          professional: <Check size={16} color="#16a34a" />,
          enterprise: <Check size={16} color="#16a34a" />,
          custom: <Check size={16} color="#16a34a" />
        },
        {
          name: 'Bulk Send & Custom Branding',
          free: <X size={16} color="#ef4444" />,
          starter: <X size={16} color="#ef4444" />,
          standard: <X size={16} color="#ef4444" />,
          professional: <Check size={16} color="#16a34a" />,
          enterprise: <Check size={16} color="#16a34a" />,
          custom: <Check size={16} color="#16a34a" />
        }
      ]
    },
    {
      category: 'SECURITY & SUPPORT',
      items: [
        {
          name: 'Real-time Audit Certificates',
          free: <Check size={16} color="#16a34a" />,
          starter: <Check size={16} color="#16a34a" />,
          standard: <Check size={16} color="#16a34a" />,
          professional: <Check size={16} color="#16a34a" />,
          enterprise: <Check size={16} color="#16a34a" />,
          custom: <Check size={16} color="#16a34a" />
        },
        {
          name: 'Support Tier',
          free: 'Email Support',
          starter: 'Standard Support',
          standard: 'Priority Support',
          professional: '24/7 Priority',
          enterprise: 'VIP Support',
          custom: 'Dedicated Manager'
        }
      ]
    }
  ];

  return (
    <div style={{
      width: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '50px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Feature & Specs Comparison
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            Compare credit allocations, feature support, and support tiers across all 6 Esigniva credit plans.
          </p>
        </div>

        <div style={{
          overflowX: 'auto',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '900px'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{
                  padding: '20px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#0f172a',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  width: '22%'
                }}>
                  CREDIT SPECIFICATIONS
                </th>
                {plans.map((p) => (
                  <th key={p.key} style={{
                    padding: '16px 10px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: p.color,
                    textAlign: 'center',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {features.map((cat, catIdx) => (
                <React.Fragment key={catIdx}>
                  <tr style={{ background: '#f1f5f9' }}>
                    <td colSpan="7" style={{
                      padding: '12px 20px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#0f172a',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      {cat.category}
                    </td>
                  </tr>

                  {cat.items.map((item, itemIdx) => (
                    <tr
                      key={itemIdx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: itemIdx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{
                        padding: '14px 20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#334155'
                      }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#475569', textAlign: 'center', fontWeight: '600' }}>{item.free}</td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#0284c7', textAlign: 'center', fontWeight: '600' }}>{item.starter}</td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#0f766e', textAlign: 'center', fontWeight: '700' }}>{item.standard}</td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#7c3aed', textAlign: 'center', fontWeight: '700' }}>{item.professional}</td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#2563eb', textAlign: 'center', fontWeight: '700' }}>{item.enterprise}</td>
                      <td style={{ padding: '14px 10px', fontSize: '12px', color: '#059669', textAlign: 'center', fontWeight: '700' }}>{item.custom}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FeatureComparisonTable;
