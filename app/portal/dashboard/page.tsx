'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PortalData {
  customer: {
    name: string;
    email: string;
    created: string;
  };
  subscription: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };
  credits: {
    available: number;
    monthly: number;
    used: number;
  };
  protectorReplacements: {
    available: number;
    used: number;
    total: number;
  };
}

export default function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      if (!token) {
        router.push('/portal');
        return;
      }

      const res = await fetch('/api/portal/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('portal_token');
          router.push('/portal');
          return;
        }
        throw new Error('Failed to load portal data');
      }

      const portalData = await res.json();
      setData(portalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-white text-2xl">Loading your portal...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <p className="text-red-600">{error || 'Unable to load portal data'}</p>
          <button
            onClick={() => router.push('/portal')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const styles = `
    .portal-container {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .member-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      font-weight: bold;
    }
    
    .member-details h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    
    .member-status {
      background: rgba(46, 204, 113, 0.2);
      color: #27ae60;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
    }
    
    .main-content {
      padding: 40px;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }
    
    .card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border: 1px solid #eee;
      transition: transform 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-5px);
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .credit-icon { background: linear-gradient(135deg, #f39c12, #e67e22); }
    .protection-icon { background: linear-gradient(135deg, #e74c3c, #c0392b); }
    .delivery-icon { background: linear-gradient(135deg, #3498db, #2980b9); }
    .warranty-icon { background: linear-gradient(135deg, #9b59b6, #8e44ad); }
    
    .card h3 {
      color: #2c3e50;
      font-size: 1.3rem;
    }
    
    .balance-amount {
      font-size: 3rem;
      font-weight: bold;
      color: #27ae60;
      margin: 10px 0;
    }
    
    .sub-amount {
      font-size: 1.2rem;
      color: #7f8c8d;
    }
    
    .benefit-list {
      list-style: none;
    }
    
    .benefit-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 0;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .benefit-item:last-child {
      border-bottom: none;
    }
    
    .status-badge {
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    
    .available { background: #d5f4e6; color: #27ae60; }
    .pending { background: #fff3cd; color: #856404; }
    .used { background: #f8d7da; color: #721c24; }
    
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #ecf0f1;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      transition: width 0.3s ease;
    }
    
    .renewal-info {
      background: linear-gradient(135deg, #e8f5e8, #d4edda);
      padding: 20px;
      border-radius: 10px;
      border-left: 5px solid #27ae60;
      margin-top: 20px;
    }
    
    .notification {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      padding: 15px;
      border-radius: 10px;
      border-left: 5px solid #f39c12;
      margin-bottom: 20px;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="portal-container">
        <div className="container">
          <div className="header">
            <div className="member-info">
              <div className="avatar">{getInitials(data.customer.name)}</div>
              <div className="member-details">
                <h1>Hello, {data.customer.name}!</h1>
                <div className="member-status">✨ Active ELITE SLEEP+ Member</div>
              </div>
            </div>
            <p>{data.customer.email} | Member since: {new Date(data.customer.created).toLocaleDateString()}</p>
          </div>
          
          <div className="main-content">
            <div className="notification">
              <strong>🎉 Welcome to ELITE SLEEP+!</strong> 
              Your membership is active and all benefits are available to you.
            </div>
            
            <div className="dashboard-grid">
              {/* Available Credit */}
              <div className="card">
                <div className="card-header">
                  <div className="card-icon credit-icon">💰</div>
                  <h3>Available Credit</h3>
                </div>
                <div className="balance-amount">${data.credits.available}</div>
                <div className="sub-amount">Current monthly credit</div>
                
                <div style={{ margin: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Monthly credit:</span>
                    <span>${data.credits.monthly}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Total available:</span>
                    <span style={{ color: '#27ae60' }}>${data.credits.available}</span>
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <strong>Next month:</strong> You'll receive an additional ${data.credits.monthly} ($120 annual ÷ 12 months)
                  </div>
                </div>
              </div>
              
              {/* Mattress Protection */}
              <div className="card">
                <div className="card-header">
                  <div className="card-icon protection-icon">🛡</div>
                  <h3>Mattress Protection</h3>
                </div>
                
                <ul className="benefit-list">
                  {[1, 2, 3].map((num) => (
                    <li key={num} className="benefit-item">
                      <span>Protector replacement #{num}</span>
                      <span className={`status-badge ${num <= data.protectorReplacements.used ? 'used' : 'available'}`}>
                        {num <= data.protectorReplacements.used ? 'Used' : 'Available'}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Replacements used:</span>
                    <span>{data.protectorReplacements.used} of {data.protectorReplacements.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(data.protectorReplacements.used / data.protectorReplacements.total) * 100}%` }}
                    />
                  </div>
                  <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <strong>Value:</strong> ${(data.protectorReplacements.total - data.protectorReplacements.used) * 100} in free replacements available
                  </div>
                </div>
              </div>
              
              {/* Delivery Services */}
              <div className="card">
                <div className="card-header">
                  <div className="card-icon delivery-icon">🚚</div>
                  <h3>Delivery Services</h3>
                </div>
                
                <ul className="benefit-list">
                  <li className="benefit-item">
                    <span>Free delivery</span>
                    <span className="status-badge available">Unlimited</span>
                  </li>
                  <li className="benefit-item">
                    <span>Professional installation</span>
                    <span className="status-badge available">Included</span>
                  </li>
                  <li className="benefit-item">
                    <span>Old mattress removal</span>
                    <span className="status-badge available">Included</span>
                  </li>
                </ul>
                
                <div className="renewal-info">
                  <strong>Total value: $75 per delivery</strong><br />
                  <small>Guaranteed savings on every purchase</small>
                </div>
              </div>
              
              {/* Warranty and Protection */}
              <div className="card">
                <div className="card-header">
                  <div className="card-icon warranty-icon">♾</div>
                  <h3>Lifetime Warranty</h3>
                </div>
                
                <ul className="benefit-list">
                  <li className="benefit-item">
                    <span>Protection against defects</span>
                    <span className="status-badge available">Active</span>
                  </li>
                  <li className="benefit-item">
                    <span>Protection against sagging</span>
                    <span className="status-badge available">Active</span>
                  </li>
                  <li className="benefit-item">
                    <span>Complete stain protection</span>
                    <span className="status-badge available">Active</span>
                  </li>
                  <li className="benefit-item">
                    <span>Professional cleaning service</span>
                    <span className="status-badge available">Included</span>
                  </li>
                </ul>
                
                <div className="renewal-info">
                  <strong>Your mattress is protected forever</strong><br />
                  <small>While others offer 10 years, you have unlimited protection</small>
                </div>
              </div>
            </div>
            
            <div className="renewal-info">
              <h4>📅 Membership Information</h4>
              <p><strong>Your membership will automatically renew on {formatDate(data.subscription.current_period_end)}</strong></p>
              <p>Annual cost: $120 | You receive: $180 in store credit (150% value)</p>
              <p>Monthly credits: $15 each month for 12 months</p>
              <p><small>You can cancel at any time before the renewal date.</small></p>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  localStorage.removeItem('portal_token');
                  router.push('/portal');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
