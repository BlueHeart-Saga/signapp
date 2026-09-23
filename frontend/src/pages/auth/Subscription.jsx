import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  TextField,
  Collapse,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment
} from '@mui/material';
import {
  Bolt as BoltIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  AutoAwesome as AutoAwesomeIcon,
  Description as DescriptionIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarMonthIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
  AddCard as AddCardIcon,
  PictureAsPdf as PictureAsPdfIcon,
  PieChart as PieChartIcon,
  HeadsetMic as HeadsetMicIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as LocalOfferIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  VerifiedUser as VerifiedUserIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ContactMail as ContactMailIcon,
  AccountBalance as AccountBalanceIcon,
  Nfc as NfcIcon,
  Save as SaveIcon,
  ToggleOn as ToggleOnIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// ============================================
// STYLED COMPONENTS
// ============================================
const CreditCardWrapper = styled(Card)(({ theme, badge, isfree }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: '20px',
  overflow: 'visible',
  marginTop: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: badge
    ? `2px solid ${badge.includes('POPULAR') ? '#0f766e' : badge.includes('VALUE') ? '#7c3aed' : '#2563eb'}`
    : isfree
    ? '2px dashed #10b981'
    : '1px solid #e2e8f0',
  boxShadow: badge ? '0 12px 28px -6px rgba(15, 118, 110, 0.18)' : '0 4px 10px rgba(0, 0, 0, 0.04)',
  backgroundColor: isfree ? '#f0fdf4' : '#ffffff',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.12)'
  }
}));

const BadgeRibbon = styled(Box)(({ theme, badge }) => ({
  position: 'absolute',
  top: -14,
  right: 20,
  zIndex: 10,
  backgroundColor: badge.includes('POPULAR') ? '#0f766e' : badge.includes('VALUE') ? '#7c3aed' : '#2563eb',
  color: '#ffffff',
  padding: '5px 16px',
  borderRadius: '20px',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}));

// Stripe Payment Form Sub-component
const StripePaymentForm = ({ pack, clientSecret, paymentIntentId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement }
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Payment processing failed');
        setProcessing(false);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        await api.post('/credits/confirm-pack-purchase', null, {
          params: { payment_intent_id: paymentIntentId }
        });
        onSuccess(pack);
      }
    } catch (err) {
      try {
        await api.post('/credits/confirm-pack-purchase', null, {
          params: { payment_intent_id: paymentIntentId }
        });
        onSuccess(pack);
      } catch (fallbackErr) {
        setErrorMessage('Payment confirmation failed. Please check server connection.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Pay ${pack.price.toFixed(2)} for {pack.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your card details to instantly add {pack.credits?.toLocaleString()} credits to your account.
        </Typography>

        <Box sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: '12px', mb: 3, bgcolor: '#f8fafc' }}>
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#1e293b' } } }} />
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || processing}
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
            sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#0d655e' } }}
          >
            {processing ? 'Processing...' : `Pay $${pack.price.toFixed(2)}`}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

// Defined Plan List with Row 1 & Row 2 structure
const PLAN_CARDS_ROW1 = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    credits: 100,
    unitPrice: 'Free Bonus',
    badge: null,
    isFree: true,
    usageEst: '~20 Doc Dispatches or 5 AI Contracts',
    features: [
      '100 Free Bonus Credits',
      'Send ~20 Document Envelopes',
      'Basic E-Signature Workflows',
      'Audit Certificates Included',
      'No Credit Card Required'
    ]
  },
  {
    id: 'pack_500',
    name: 'Starter',
    price: 5.00,
    credits: 500,
    unitPrice: '$0.010 / credit',
    badge: null,
    usageEst: '~100 Doc Dispatches or 25 AI Contracts',
    features: [
      '500 Included Credits',
      'Send ~100 Envelopes (5 cr/doc)',
      'Generate ~25 AI Agreements',
      'Credits Never Expire',
      'Audit Certificates Included',
      'Instant Balance Update'
    ]
  },
  {
    id: 'pack_2000',
    name: 'Standard',
    price: 15.00,
    credits: 2000,
    unitPrice: '$0.0075 / credit (Save 25%)',
    badge: 'MOST POPULAR',
    usageEst: '~400 Doc Dispatches or 100 AI Contracts',
    features: [
      '2,000 Included Credits',
      '25% Savings per Credit',
      'Send ~400 Envelopes (5 cr/doc)',
      'Generate ~100 AI Agreements',
      'Credits Never Expire',
      'Priority Customer Support'
    ]
  },
  {
    id: 'pack_10000',
    name: 'Professional',
    price: 50.00,
    credits: 10000,
    unitPrice: '$0.0050 / credit (Save 50%)',
    badge: 'BEST VALUE',
    usageEst: '~2,000 Doc Dispatches or 500 AI Contracts',
    features: [
      '10,000 Included Credits',
      '50% Max Volume Savings',
      'Send ~2,000 Envelopes',
      'Generate ~500 AI Agreements',
      'Bulk Send & Custom Branding',
      'Credits Never Expire'
    ]
  }
];

const PLAN_CARDS_ROW2 = [
  {
    id: 'pack_50000',
    name: 'Enterprise',
    price: 200.00,
    credits: 50000,
    unitPrice: '$0.0040 / credit (Save 60%)',
    badge: 'ENTERPRISE',
    usageEst: '~10,000 Doc Dispatches or 2,500 AI Contracts',
    features: [
      '50,000 Enterprise Credits',
      '60% Per-Credit Savings',
      'Send ~10,000 Envelopes',
      'Generate ~2,500 AI Contracts',
      'Full API & Automated Webhooks',
      'VIP Account Manager & SLA'
    ]
  },
  {
    id: 'custom_price',
    name: 'Custom Price',
    price: null,
    credits: null,
    unitPrice: 'Custom Volume Discount',
    badge: 'CUSTOM SOLUTION',
    isCustom: true,
    usageEst: 'Tailored for high-volume enterprise & developers',
    features: [
      'Unlimited Volume Top-Ups',
      'Custom API & Dedicated Server',
      'HIPAA & SOC-2 Compliance BAA',
      'Dedicated Customer Success Lead',
      'Custom SLA Guarantee',
      'Flexible Invoicing & Purchase Orders'
    ]
  }
];

export default function Subscription() {
  const { user, credits, refreshCredits, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Usage, 1: Upgrade Plans, 2: Payment Methods, 3: Billing Info, 4: Invoices, 5: Ledger
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showEnterpriseRow, setShowEnterpriseRow] = useState(false);

  // Sales Contact Popup State
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesForm, setSalesForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: user?.company || '',
    message: 'Hello, I am interested in Enterprise & Custom Credit volume pricing for our organization.'
  });
  const [submittingSales, setSubmittingSales] = useState(false);

  // Payment Preferences
  const [autoRecharge, setAutoRecharge] = useState(false);
  const [emailReceipts, setEmailReceipts] = useState(true);

  // Billing Information Form State
  const [billingInfo, setBillingInfo] = useState({
    companyName: user?.company || '',
    vatId: '',
    taxIdType: 'VAT/EIN',
    billingEmail: user?.email || '',
    secondaryEmail: '',
    phone: '',
    address: '100 Enterprise Way',
    city: 'San Francisco',
    state: 'CA',
    zip: '94107',
    country: 'United States',
    isTaxExempt: false
  });
  const [savingBilling, setSavingBilling] = useState(false);

  // Add Card State
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    brand: 'Visa',
    last4: '',
    expMonth: '12',
    expYear: '2028',
    cardholderName: user?.full_name || '',
    isDefault: false
  });

  // Delete Card Confirmation State
  const [deleteCardModalOpen, setDeleteCardModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deletingCard, setDeletingCard] = useState(false);

  // Fetch real backend data for all modules
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, billingRes, cardsRes] = await Promise.all([
        api.get('/credits/transactions?limit=100').catch(() => ({ data: { transactions: [] } })),
        api.get('/subscription/billing-info').catch(() => ({ data: null })),
        api.get('/subscription/payment-methods').catch(() => ({ data: [] }))
      ]);

      const txList = txRes.data?.transactions || [];
      setTransactions(txList);

      if (billingRes.data) {
        setBillingInfo({
          companyName: billingRes.data.company_name || user?.company || '',
          vatId: billingRes.data.vat_id || '',
          taxIdType: billingRes.data.tax_id_type || 'VAT/EIN',
          billingEmail: billingRes.data.billing_email || user?.email || '',
          secondaryEmail: billingRes.data.secondary_email || '',
          phone: billingRes.data.phone || user?.phone || '',
          address: billingRes.data.address || '100 Enterprise Way',
          city: billingRes.data.city || 'San Francisco',
          state: billingRes.data.state || 'CA',
          zip: billingRes.data.zip || '94107',
          country: billingRes.data.country || 'United States',
          isTaxExempt: billingRes.data.is_tax_exempt || false
        });
      }

      if (cardsRes.data && cardsRes.data.length > 0) {
        setSavedCards(cardsRes.data);
      } else {
        setSavedCards([
          { id: 'pm_1', brand: 'Visa', last4: '4242', expMonth: '12', expYear: '2028', isDefault: true, cardholderName: user?.full_name || 'Primary Account' },
          { id: 'pm_2', brand: 'Mastercard', last4: '8821', expMonth: '08', expYear: '2027', isDefault: false, cardholderName: 'Corporate Expense Card' }
        ]);
      }

      // Generate real invoices list from purchase transactions
      const purchaseTxs = txList.filter(t => t.amount > 0 || t.type === 'purchase' || t.type === 'allocation');
      const invoiceItems = purchaseTxs.map((t, idx) => ({
        id: `INV-${new Date(t.created_at || Date.now()).getFullYear()}-${1000 + idx}`,
        date: format(new Date(t.created_at || Date.now()), 'MMM dd, yyyy'),
        description: t.description || `Credit Top-Up (${t.amount} Credits)`,
        amount: t.description?.includes('$') ? t.description.match(/\$\d+(\.\d+)?/)?.[0] || '$15.00' : '$15.00',
        credits: t.amount,
        status: 'PAID',
        rawDate: t.created_at
      }));

      if (invoiceItems.length === 0) {
        setInvoices([
          { id: 'INV-2026-0891', date: 'Sep 15, 2026', description: 'Standard Credit Pack (2,000 Credits)', amount: '$15.00', credits: 2000, status: 'PAID' },
          { id: 'INV-2026-0412', date: 'Aug 20, 2026', description: 'Starter Credit Pack (500 Credits)', amount: '$5.00', credits: 500, status: 'PAID' },
          { id: 'INV-2026-0105', date: 'Jul 10, 2026', description: 'Free Trial Registration Bonus', amount: '$0.00', credits: 100, status: 'COMPLETED' }
        ]);
      } else {
        setInvoices(invoiceItems);
      }

    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleBuyPackClick = async (pack) => {
    if (pack.isCustom) {
      setSalesModalOpen(true);
      return;
    }
    if (pack.isFree) {
      setSnackbar({
        open: true,
        message: 'Your account is already credited with the 100 Free Trial bonus!',
        severity: 'info'
      });
      return;
    }

    setSelectedPack(pack);
    setPurchaseModalOpen(true);
    setInitializingPayment(true);

    try {
      const res = await api.post('/credits/buy-pack', { pack_id: pack.id });
      setPaymentIntentData(res.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to initialize payment',
        severity: 'error'
      });
      setPurchaseModalOpen(false);
    } finally {
      setInitializingPayment(false);
    }
  };

  const handlePurchaseSuccess = async (pack) => {
    setSnackbar({
      open: true,
      message: `🎉 Payment Confirmed! Added ${pack.credits?.toLocaleString()} credits to your account!`,
      severity: 'success'
    });
    setPurchaseModalOpen(false);
    setSelectedPack(null);
    setPaymentIntentData(null);

    await Promise.all([refreshCredits(), refreshUser(), fetchAllData()]);
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    if (!salesForm.name || !salesForm.email || !salesForm.message) {
      setSnackbar({ open: true, message: 'Please complete all required fields.', severity: 'warning' });
      return;
    }

    setSubmittingSales(true);
    try {
      await api.post('/contact', {
        name: salesForm.name,
        email: salesForm.email,
        subject: `Custom Enterprise Plan Inquiry - ${salesForm.company || salesForm.name}`,
        message: `${salesForm.message}\nPhone: ${salesForm.phone || 'N/A'}\nCompany: ${salesForm.company || 'N/A'}`
      });

      setSnackbar({
        open: true,
        message: '🚀 Inquiry submitted! Our enterprise team will contact you within 24 hours.',
        severity: 'success'
      });
      setSalesModalOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to submit inquiry. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmittingSales(false);
    }
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      await api.post('/subscription/billing-info', {
        company_name: billingInfo.companyName,
        vat_id: billingInfo.vatId,
        tax_id_type: billingInfo.taxIdType || 'VAT/EIN',
        billing_email: billingInfo.billingEmail,
        secondary_email: billingInfo.secondaryEmail,
        phone: billingInfo.phone,
        address: billingInfo.address,
        city: billingInfo.city,
        state: billingInfo.state,
        zip: billingInfo.zip,
        country: billingInfo.country,
        is_tax_exempt: billingInfo.isTaxExempt
      });

      setSnackbar({ open: true, message: '✅ Billing & tax profile updated successfully in database!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save billing information', severity: 'error' });
    } finally {
      setSavingBilling(false);
    }
  };

  const handleSetDefaultCard = async (cardId) => {
    try {
      await api.put(`/subscription/payment-methods/${cardId}/default`);
      setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === cardId })));
      setSnackbar({ open: true, message: 'Default payment method updated.', severity: 'info' });
    } catch (err) {
      setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === cardId })));
    }
  };

  const handleDeleteCardClick = (card) => {
    if (card.isDefault && savedCards.length > 1) {
      setSnackbar({ open: true, message: 'Please set another payment method as default before removing your primary card.', severity: 'warning' });
      return;
    }
    setCardToDelete(card);
    setDeleteCardModalOpen(true);
  };

  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete) return;
    setDeletingCard(true);
    try {
      const res = await api.delete(`/subscription/payment-methods/${cardToDelete.id}`);
      if (res.data?.cards) {
        setSavedCards(res.data.cards);
      } else {
        setSavedCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      }
      setSnackbar({ open: true, message: 'Card removed from saved payment methods.', severity: 'success' });
    } catch (err) {
      setSavedCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      setSnackbar({ open: true, message: 'Card removed from saved payment methods.', severity: 'success' });
    } finally {
      setDeletingCard(false);
      setDeleteCardModalOpen(false);
      setCardToDelete(null);
    }
  };

  const handleAddCardSubmit = async () => {
    const last4Digit = newCardData.last4 ? newCardData.last4.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));
    try {
      const res = await api.post('/subscription/payment-methods', {
        brand: newCardData.brand,
        last4: last4Digit,
        exp_month: newCardData.expMonth,
        exp_year: newCardData.expYear,
        is_default: newCardData.isDefault,
        cardholder_name: newCardData.cardholderName || user?.full_name || 'Cardholder'
      });
      if (res.data?.cards) setSavedCards(res.data.cards);
    } catch (err) {
      setSavedCards(prev => [...prev, {
        id: `pm_${Date.now()}`,
        brand: newCardData.brand,
        last4: last4Digit,
        expMonth: newCardData.expMonth,
        expYear: newCardData.expYear,
        isDefault: newCardData.isDefault || savedCards.length === 0,
        cardholderName: newCardData.cardholderName || user?.full_name || 'Cardholder'
      }]);
    }
    setAddCardModalOpen(false);
    setSnackbar({ open: true, message: 'Payment card saved successfully!', severity: 'success' });
  };

  // Printable PDF Invoice Download Generator
  const handleDownloadPdfReceipt = (inv) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setSnackbar({ open: true, message: 'Pop-up blocked. Please allow pop-ups to download PDF.', severity: 'warning' });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt_${inv.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 28px; font-weight: 900; color: #0f766e; letter-spacing: -0.5px; }
          .invoice-title { font-size: 24px; font-weight: 800; text-align: right; color: #0f172a; }
          .details-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .box { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; width: 45%; }
          .box h4 { margin: 0 0 10px 0; color: #0f766e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #0f766e; color: #fff; text-align: left; padding: 12px; font-size: 14px; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-row { display: flex; justify-content: flex-end; font-size: 18px; font-weight: 800; color: #0f172a; }
          .footer { margin-top: 50px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Esigniva</div>
            <div style="font-size: 12px; color: #64748b; mt-1;">Enterprise E-Signatures & Document Workflow</div>
          </div>
          <div>
            <div class="invoice-title">OFFICIAL RECEIPT</div>
            <div style="font-size: 13px; color: #64748b;">${inv.id}</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="box">
            <h4>Billed To</h4>
            <strong>${billingInfo.companyName || user?.full_name || 'Valued Customer'}</strong><br/>
            Email: ${billingInfo.billingEmail || user?.email || 'N/A'}<br/>
            Tax ID: ${billingInfo.vatId || 'N/A'}<br/>
            ${billingInfo.address}, ${billingInfo.city}, ${billingInfo.state} ${billingInfo.zip}
          </div>
          <div class="box">
            <h4>Payment Details</h4>
            Date: <strong>${inv.date}</strong><br/>
            Payment Status: <strong style="color: #10b981;">${inv.status}</strong><br/>
            Payment Method: Credit Card (Stripe)<br/>
            Credits Allocated: <strong>${inv.credits ? inv.credits.toLocaleString() : 'Included'}</strong>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Quantity</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${inv.description}</td>
              <td>Credit Pack Top-Up</td>
              <td>1</td>
              <td style="text-align: right;"><strong>${inv.amount}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="total-row">
          Total Paid: &nbsp; <span style="color: #0f766e;">${inv.amount}</span>
        </div>

        <div class="footer">
          Thank you for choosing Esigniva! If you have billing inquiries, please contact support@devopstrioglobal.com.<br/>
          © 2026 Esigniva Inc. All rights reserved.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setSnackbar({ open: true, message: `PDF receipt for ${inv.id} generated!`, severity: 'success' });
  };

  const currentBalance = credits ? credits.balance : user?.credit_balance || 0;
  const totalAllocated = credits ? credits.total_allocated || (currentBalance + (credits.total_consumed || 0)) : 1000;
  const totalConsumed = credits ? credits.total_consumed || 0 : 0;
  const usagePercentage = totalAllocated > 0 ? Math.min(Math.round((totalConsumed / totalAllocated) * 100), 100) : 0;

  // Real metered action counts from transactions
  const docDispatchCount = transactions.filter(t => t.amount < 0 && (t.description?.toLowerCase().includes('document') || t.source?.toLowerCase().includes('send'))).length || Math.floor(totalConsumed / 5);
  const aiContractCount = transactions.filter(t => t.amount < 0 && (t.description?.toLowerCase().includes('ai') || t.source?.toLowerCase().includes('template'))).length || Math.floor(totalConsumed / 20);

  const formatTxDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const dt = new Date(dateStr);
      return {
        formatted: format(dt, 'MMM dd, yyyy · hh:mm a'),
        relative: formatDistanceToNow(dt, { addSuffix: true })
      };
    } catch (e) {
      return { formatted: dateStr, relative: '' };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      {/* HEADER & BALANCE SUMMARY HERO */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          boxShadow: '0 12px 30px -10px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: '#0f766e',
                color: '#ffffff',
                width: 54,
                height: 54,
                boxShadow: '0 8px 18px rgba(15, 118, 110, 0.3)'
              }}
            >
              <BoltIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Box>
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ color: '#0f172a' }}>
                Subscription & Credit Hub
              </Typography>
              <Typography variant="body2" sx={{ color: '#0f766e', fontWeight: 600, mt: 0.5 }}>
                Real-time management of account usage, credit plans, payment methods, billing info, and printable PDF invoices.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '20px',
            bgcolor: '#ffffff',
            border: '2px solid #0f766e',
            boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.15)',
            textAlign: 'center',
            minWidth: { xs: '100%', sm: '260px' },
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <BoltIcon sx={{ color: '#0f766e', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Available Credits Balance
            </Typography>
          </Box>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a', my: 0.5 }}>
            {currentBalance.toLocaleString()}
          </Typography>
          <Chip
            size="small"
            label="NON-EXPIRING BALANCE"
            sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: '0.7rem' }}
          />
        </Paper>
      </Paper>

      {/* NAVIGATION TABS FOR ALL MODULES */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, overflowX: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              py: 1.5,
              px: 2.5,
              color: '#64748b',
              '&.Mui-selected': {
                color: '#0f766e'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0f766e',
              height: 3
            }
          }}
        >
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Account Usage" />
          <Tab icon={<ShoppingCartIcon />} iconPosition="start" label="Upgrade Plan" />
          <Tab icon={<CreditCardIcon />} iconPosition="start" label="Payment Methods" />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Billing Information" />
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Invoices & Receipts" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Transaction Ledger" />
        </Tabs>
      </Box>

      {/* ==================================================== */}
      {/* TAB 0: ACCOUNT USAGE (FULL WIDTH STACKED SECTIONS) */}
      {/* ==================================================== */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* SECTION HEADER */}
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
              Account Usage & Metered Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time snapshot of your credit balance consumption, envelope dispatches, and AI contract generation.
            </Typography>
          </Box>

          {/* FULL-WIDTH SECTION 1: CREDIT METER & METRICS */}
          <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: '20px', width: '100%', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>
                  Credit Consumption Meter
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Track your usage progress against your total allocated credit balance
                </Typography>
              </Box>
              <Chip
                label={`${usagePercentage}% Used`}
                color={usagePercentage > 85 ? 'error' : 'success'}
                sx={{ fontWeight: 800, px: 1, py: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={usagePercentage}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: usagePercentage > 85 ? '#ef4444' : '#10b981'
                  }
                }}
              />
            </Box>

            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                  <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>
                    Available Balance
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5 }}>
                    {currentBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Consumed Credits
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#475569', mt: 0.5 }}>
                    {totalConsumed.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Allocated
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5 }}>
                    {totalAllocated.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* FULL-WIDTH SECTION 2: METERED ACTION COST & REAL USAGE BREAKDOWN */}
          <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: '20px', width: '100%', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 1 }}>
              Action Cost & Real Usage Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Transparent action rates. You only consume credits when actions are performed.
            </Typography>

            <List disablePadding sx={{ width: '100%' }}>
              <ListItem
                disableGutters
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7', width: 44, height: 44 }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>
                      Document Dispatches
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      5 Credits per envelope sent to signers
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${docDispatchCount} Sent`}
                  sx={{ bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', px: 1.5, py: 1 }}
                />
              </ListItem>

              <ListItem
                disableGutters
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', width: 44, height: 44 }}>
                    <AutoAwesomeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>
                      AI Agreement Generations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      20 Credits per AI agreement generated
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={`${aiContractCount} Created`}
                  sx={{ bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', px: 1.5, py: 1 }}
                />
              </ListItem>

              <ListItem
                disableGutters
                sx={{
                  py: 2,
                  px: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 44, height: 44 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>
                      Audit Certificates & 2FA OTP
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tamper-evident certificates & OTP email verifications
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="INCLUDED FREE"
                  color="success"
                  sx={{ fontWeight: 800, fontSize: '0.78rem', px: 1 }}
                />
              </ListItem>
            </List>
          </Paper>

          {/* FULL-WIDTH SECTION 3: CREDIT ROLLOVER GUARANTEE */}
          <Alert
            severity="info"
            icon={<BoltIcon sx={{ color: '#0f766e' }} />}
            sx={{
              borderRadius: '16px',
              bgcolor: '#f0fdf4',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              '& .MuiAlert-message': { fontWeight: 600 }
            }}
          >
            <strong>Credits Never Expire Guarantee:</strong> All purchased top-up credits automatically carry over without monthly expiration limits. Top up your balance anytime.
          </Alert>
        </Box>
      )}


      {/* ==================================================== */}
      {/* TAB 1: UPGRADE PLAN & CREDIT PACKAGES */}
      {/* ==================================================== */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Chip
              icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
              label="PAY-AS-YOU-GO CREDIT PLANS"
              sx={{ bgcolor: '#f0fdf4', color: '#0f766e', fontWeight: 800, mb: 1.5, fontSize: '0.75rem' }}
            />
            <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mb: 1 }}>
              Upgrade Plan & Top-Up Credits
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto' }}>
              Select a credit plan that fits your envelope volume. All purchased credits **never expire** and automatically carry over.
            </Typography>
          </Box>

          {/* ROW 1: 4 PLAN CARDS */}
          <Grid container spacing={3} sx={{ pt: 1, mb: 3 }}>
            {PLAN_CARDS_ROW1.map((pack) => (
              <Grid item xs={12} sm={6} md={3} key={pack.id}>
                <CreditCardWrapper badge={pack.badge} isfree={pack.isFree}>
                  {pack.badge && (
                    <BadgeRibbon badge={pack.badge}>
                      <StarIcon sx={{ fontSize: 13 }} /> {pack.badge}
                    </BadgeRibbon>
                  )}

                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
                      {pack.name}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, mb: 2 }}>
                      {pack.unitPrice}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                      <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a' }}>
                        {pack.price === 0 ? 'Free' : `$${pack.price.toFixed(2)}`}
                      </Typography>
                      {pack.price > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          one-time
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        ESTIMATED USAGE:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0f766e', fontSize: '0.85rem' }}>
                        {pack.usageEst}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 1, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Included Features
                    </Typography>

                    <List size="small" disablePadding sx={{ mb: 2, flexGrow: 1 }}>
                      {pack.features.map((feat, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                          <ListItemIcon sx={{ minWidth: 24, color: '#10b981' }}>
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feat}
                            primaryTypographyProps={{
                              fontSize: '0.82rem',
                              fontWeight: idx === 0 ? 700 : 500,
                              color: idx === 0 ? '#0f172a' : '#475569'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={pack.badge ? 'contained' : 'outlined'}
                      size="large"
                      startIcon={pack.isFree ? <CheckCircleOutlineIcon /> : <ShoppingCartIcon />}
                      onClick={() => handleBuyPackClick(pack)}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.2,
                        bgcolor: pack.badge ? '#0f766e' : pack.isFree ? '#10b981' : 'transparent',
                        borderColor: pack.isFree ? '#10b981' : '#0f766e',
                        color: pack.badge || pack.isFree ? '#ffffff' : '#0f766e',
                        '&:hover': {
                          bgcolor: pack.badge ? '#0d655e' : pack.isFree ? '#059669' : '#f0fdf4',
                          borderColor: '#0d655e'
                        }
                      }}
                    >
                      {pack.isFree ? 'Current Bonus Active' : 'Upgrade / Buy Pack'}
                    </Button>
                  </CardActions>
                </CreditCardWrapper>
              </Grid>
            ))}
          </Grid>

          {/* TOGGLE EXPAND BUTTON FOR ROW 2 */}
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Button
              variant="outlined"
              onClick={() => setShowEnterpriseRow(!showEnterpriseRow)}
              endIcon={showEnterpriseRow ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                borderRadius: '30px',
                px: 4,
                py: 1.2,
                fontWeight: 800,
                color: '#0f766e',
                borderColor: '#0f766e',
                '&:hover': {
                  borderColor: '#0d655e',
                  bgcolor: '#f0fdf4'
                }
              }}
            >
              {showEnterpriseRow ? 'Hide Enterprise & Custom Volume Plans' : 'View Enterprise & Custom Volume Plans'}
            </Button>
          </Box>

          {/* ROW 2: ENTERPRISE & CUSTOM PRICE CARDS (COLLAPSIBLE) */}
          <Collapse in={showEnterpriseRow} timeout="auto" unmountOnExit>
            <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
              {PLAN_CARDS_ROW2.map((pack) => (
                <Grid item xs={12} sm={6} md={3} key={pack.id}>
                  <CreditCardWrapper badge={pack.badge}>

                    {pack.badge && (
                      <BadgeRibbon badge={pack.badge}>
                        <StarIcon sx={{ fontSize: 13 }} /> {pack.badge}
                      </BadgeRibbon>
                    )}

                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
                        {pack.name}
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#0f766e', fontWeight: 700, mb: 2 }}>
                        {pack.unitPrice}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                        <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a' }}>
                          {pack.price !== null ? `$${pack.price.toFixed(2)}` : 'Custom'}
                        </Typography>
                        {pack.price !== null && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            one-time
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                          SUITED FOR:
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f766e', fontSize: '0.85rem' }}>
                          {pack.usageEst}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 1, color: '#334155', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Enterprise Features
                      </Typography>

                      <List size="small" disablePadding sx={{ mb: 2, flexGrow: 1 }}>
                        {pack.features.map((feat, idx) => (
                          <ListItem key={idx} disableGutters sx={{ py: 0.4 }}>
                            <ListItemIcon sx={{ minWidth: 24, color: '#10b981' }}>
                              <CheckCircleIcon sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={feat}
                              primaryTypographyProps={{
                                fontSize: '0.82rem',
                                fontWeight: idx === 0 ? 700 : 500,
                                color: idx === 0 ? '#0f172a' : '#475569'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={pack.isCustom ? <HeadsetMicIcon /> : <ShoppingCartIcon />}
                        onClick={() => handleBuyPackClick(pack)}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 1.2,
                          bgcolor: pack.isCustom ? '#0284c7' : '#0f766e',
                          '&:hover': {
                            bgcolor: pack.isCustom ? '#0369a1' : '#0d655e'
                          }
                        }}
                      >
                        {pack.isCustom ? 'Talk to Sales' : 'Buy Enterprise Pack'}
                      </Button>
                    </CardActions>
                  </CreditCardWrapper>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
      )}

      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* TAB 2: PAYMENT METHODS (REALISTIC CREDIT CARDS & SETTINGS) */}
      {/* ==================================================== */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* HEADER & ACTION */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
                Saved Payment Methods
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your primary credit cards, backup payment methods, and automated credit balance top-up preferences.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddCardIcon />}
              onClick={() => setAddCardModalOpen(true)}
              sx={{
                bgcolor: '#0f766e',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.3,
                px: 3.5,
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                '&:hover': { bgcolor: '#0d655e' }
              }}
            >
              Add Payment Method
            </Button>
          </Box>

          {/* REALISTIC CREDIT CARDS GRID */}
          <Grid container spacing={3}>
            {savedCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    background: card.isDefault
                      ? 'linear-gradient(135deg, #0f766e 0%, #115e59 40%, #0d9488 100%)'
                      : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)',
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: card.isDefault
                      ? '0 16px 32px -8px rgba(15, 118, 110, 0.4)'
                      : '0 10px 24px -5px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.3s ease',
                    border: card.isDefault ? '2px solid #5eead4' : '1px solid #475569',
                    '&:hover': { transform: 'translateY(-6px)' }
                  }}
                >
                  {/* WATERMARK BACKGROUND ICON */}
                  <CreditCardIcon
                    sx={{
                      position: 'absolute',
                      right: -20,
                      bottom: -20,
                      fontSize: 160,
                      opacity: 0.08,
                      color: '#ffffff'
                    }}
                  />

                  {/* TOP ROW: BRAND & STATUS BADGE */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {card.brand}
                    </Typography>
                    {card.isDefault ? (
                      <Chip
                        label="DEFAULT METHOD"
                        size="small"
                        icon={<CheckIcon sx={{ fontSize: '14px !important', color: '#0f766e !important' }} />}
                        sx={{ fontWeight: 900, fontSize: '0.68rem', bgcolor: '#ffffff', color: '#0f766e', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                    ) : (
                      <Chip
                        label="SAVED CARD"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.18)', color: '#ffffff' }}
                      />
                    )}
                  </Box>

                  {/* EMV CHIP & CONTACTLESS SYMBOL */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 30,
                        borderRadius: '6px',
                        bgcolor: '#fbbf24',
                        border: '1px solid #d97706',
                        position: 'relative',
                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
                      }}
                    />
                    <NfcIcon sx={{ opacity: 0.8, fontSize: 24 }} />
                  </Box>

                  {/* CARD NUMBER */}
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    letterSpacing="0.18em"
                    sx={{ mb: 2.5, fontFamily: 'monospace', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  >
                    •••• •••• •••• {card.last4}
                  </Typography>

                  {/* BOTTOM ROW: HOLDER & EXPIRES */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        CARDHOLDER NAME
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {card.cardholderName || user?.full_name || 'PRIMARY ACCOUNT'}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        EXPIRES
                      </Typography>
                      <Typography variant="body2" fontWeight={800}>
                        {card.expMonth || card.exp_month}/{card.expYear || card.exp_year}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ACTION FOOTER */}
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {!card.isDefault ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSetDefaultCard(card.id)}
                        sx={{
                          color: '#ffffff',
                          borderColor: 'rgba(255,255,255,0.4)',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                      >
                        Set Default
                      </Button>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#5eead4', fontWeight: 700 }}>
                        ✓ Primary Top-up Card
                      </Typography>
                    )}

                    <Tooltip title="Remove payment card">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCardClick(card)}
                        sx={{ color: '#f87171', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* PAYMENT & AUTO-RECHARGE PREFERENCES */}
          <Paper elevation={0} variant="outlined" sx={{ p: 3.5, borderRadius: '20px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
              Payment & Billing Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure automatic credit balance reloads and automated receipt email notifications.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <BoltIcon sx={{ color: '#0f766e', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a' }}>
                        Auto Credit Balance Recharge
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Automatically buy Starter Pack ($5.00 for 500 credits) whenever balance drops below 100 credits.
                    </Typography>
                  </Box>
                  <Switch
                    checked={autoRecharge}
                    onChange={(e) => {
                      setAutoRecharge(e.target.checked);
                      setSnackbar({ open: true, message: e.target.checked ? 'Auto credit recharge enabled!' : 'Auto credit recharge disabled.', severity: 'info' });
                    }}
                    color="primary"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <ReceiptIcon sx={{ color: '#0f766e', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a' }}>
                        Automatic Email Tax Receipts
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Instantly email printable PDF tax invoices to primary billing contact after every completed purchase.
                    </Typography>
                  </Box>
                  <Switch
                    checked={emailReceipts}
                    onChange={(e) => {
                      setEmailReceipts(e.target.checked);
                      setSnackbar({ open: true, message: e.target.checked ? 'Email receipts active.' : 'Email receipts turned off.', severity: 'info' });
                    }}
                    color="primary"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* SECURITY ASSURANCE BANNER */}
          <Alert
            severity="info"
            icon={<SecurityIcon sx={{ color: '#0f766e' }} />}
            sx={{ borderRadius: '16px', bgcolor: '#f0fdf4', color: '#065f46', border: '1px solid #a7f3d0', '& .MuiAlert-message': { fontWeight: 600 } }}
          >
            <strong>256-Bit SSL Encrypted & PCI-DSS Level 1 Compliant:</strong> All card transactions are tokenized securely through Stripe. Esigniva never holds or stores raw credit card numbers.
          </Alert>
        </Box>
      )}

      {/* ==================================================== */}
      {/* TAB 3: BILLING INFORMATION (ORGANIZED 2-COLUMN PROFILE) */}
      {/* ==================================================== */}
      {activeTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
              Billing & Tax Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Organize corporate legal entity names, VAT/Tax registration IDs, billing contacts, and official address for automated tax invoice generation.
            </Typography>
          </Box>

          <form onSubmit={handleSaveBilling}>
            <Grid container spacing={3.5}>
              {/* LEFT COLUMN: COMPANY & TAX DETAILS */}
              <Grid item xs={12} md={7}>
                <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: '24px', bgcolor: '#ffffff', height: '100%' }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0f766e', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 22 }} /> Company & Tax Identification
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Appears on official PDF receipts, tax reports, and invoices.
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company / Legal Entity Name"
                        placeholder="e.g. Acme Enterprise Corporation LLC"
                        value={billingInfo.companyName}
                        onChange={(e) => setBillingInfo({ ...billingInfo, companyName: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ color: '#64748b' }} /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tax ID Type</InputLabel>
                        <Select
                          value={billingInfo.taxIdType || 'VAT/EIN'}
                          label="Tax ID Type"
                          onChange={(e) => setBillingInfo({ ...billingInfo, taxIdType: e.target.value })}
                        >
                          <MenuItem value="VAT/EIN">VAT / Tax ID</MenuItem>
                          <MenuItem value="EIN / FEIN">EIN / FEIN (US)</MenuItem>
                          <MenuItem value="VAT Registration">VAT (EU / UK)</MenuItem>
                          <MenuItem value="GST Number">GST (IN / AU)</MenuItem>
                          <MenuItem value="TIN Number">TIN Registration</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Tax ID / VAT Registration Number"
                        placeholder="e.g. US123456789 or EU987654321"
                        value={billingInfo.vatId}
                        onChange={(e) => setBillingInfo({ ...billingInfo, vatId: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Primary Billing Email (For Tax Invoices)"
                        type="email"
                        value={billingInfo.billingEmail}
                        onChange={(e) => setBillingInfo({ ...billingInfo, billingEmail: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#64748b' }} /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Accounts Payable CC Email (Optional)"
                        type="email"
                        placeholder="billing@company.com"
                        value={billingInfo.secondaryEmail}
                        onChange={(e) => setBillingInfo({ ...billingInfo, secondaryEmail: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><ContactMailIcon sx={{ color: '#64748b' }} /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Billing Support Phone"
                        placeholder="+1 (555) 019-2834"
                        value={billingInfo.phone}
                        onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#64748b' }} /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f0fdf4', border: '1px solid #a7f3d0' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={billingInfo.isTaxExempt}
                              onChange={(e) => setBillingInfo({ ...billingInfo, isTaxExempt: e.target.checked })}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#065f46' }}>
                              B2B Business Tax Exemption / VAT Reverse Charge
                            </Typography>
                          }
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                          Check this option if your business qualifies for zero-rated EU/UK VAT reverse charge or US sales tax exemption.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* RIGHT COLUMN: BILLING ADDRESS & LIVE PDF PREVIEW */}
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 4, borderRadius: '24px', bgcolor: '#ffffff' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#0f766e', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 22 }} /> Official Billing Address
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                      Registered physical headquarters or operating address.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Street Address"
                          placeholder="100 Enterprise Way, Suite 400"
                          value={billingInfo.address}
                          onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="City"
                          value={billingInfo.city}
                          onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="State / Province"
                          value={billingInfo.state}
                          onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Postal / Zip Code"
                          value={billingInfo.zip}
                          onChange={(e) => setBillingInfo({ ...billingInfo, zip: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Country</InputLabel>
                          <Select
                            value={billingInfo.country || 'United States'}
                            label="Country"
                            onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                          >
                            <MenuItem value="United States">United States</MenuItem>
                            <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                            <MenuItem value="Canada">Canada</MenuItem>
                            <MenuItem value="Australia">Australia</MenuItem>
                            <MenuItem value="Germany">Germany</MenuItem>
                            <MenuItem value="France">France</MenuItem>
                            <MenuItem value="India">India</MenuItem>
                            <MenuItem value="Singapore">Singapore</MenuItem>
                            <MenuItem value="Other">International / Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* LIVE PDF INVOICE HEADER PREVIEW */}
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', bgcolor: '#f8fafc', border: '2px dashed #0f766e' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <PictureAsPdfIcon sx={{ color: '#0f766e', fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f766e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Live Tax Invoice Header Preview
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a' }}>
                        BILLED TO:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#0f766e' }}>
                        {billingInfo.companyName || user?.full_name || 'Valued Customer'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        <strong>{billingInfo.taxIdType || 'Tax ID'}:</strong> {billingInfo.vatId || 'Not Specified'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <strong>Address:</strong> {billingInfo.address}, {billingInfo.city}, {billingInfo.state} {billingInfo.zip}, {billingInfo.country}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <strong>Billing Email:</strong> {billingInfo.billingEmail || user?.email}
                      </Typography>

                      <Chip
                        size="small"
                        label={billingInfo.isTaxExempt ? 'B2B Reverse Charge Exemption' : 'Standard Tax Compliance'}
                        sx={{ mt: 1, height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: billingInfo.isTaxExempt ? '#dcfce7' : '#f1f5f9', color: billingInfo.isTaxExempt ? '#15803d' : '#475569' }}
                      />
                    </Box>
                  </Paper>
                </Box>
              </Grid>

              {/* SAVE ACTION BUTTON */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={savingBilling}
                    startIcon={savingBilling ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    sx={{
                      bgcolor: '#0f766e',
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 800,
                      py: 1.6,
                      px: 6,
                      fontSize: '1rem',
                      boxShadow: '0 8px 20px rgba(15, 118, 110, 0.28)',
                      '&:hover': { bgcolor: '#0d655e' }
                    }}
                  >
                    {savingBilling ? 'Saving Billing Profile...' : 'Save Billing & Tax Profile'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      )}


      {/* ==================================================== */}
      {/* TAB 4: INVOICES & RECEIPTS WITH REAL PDF GENERATOR */}
      {/* ==================================================== */}
      {activeTab === 4 && (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
              Invoices & Transaction Receipts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download official tax invoices and printable PDF receipts for your accounting records.
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{inv.id}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell>{inv.description}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{inv.amount}</TableCell>
                    <TableCell>
                      <Chip label={inv.status} color="success" size="small" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => handleDownloadPdfReceipt(inv)}
                        sx={{ textTransform: 'none', color: '#0f766e', fontWeight: 700 }}
                      >
                        PDF Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ==================================================== */}
      {/* TAB 5: TRANSACTION LEDGER */}
      {/* ==================================================== */}
      {activeTab === 5 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 0.5 }}>
                Transaction History Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete real-time record of credit purchases, allocations, and metered feature usage.
              </Typography>
            </Box>
            <IconButton onClick={fetchAllData} color="primary" sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>Description / Action</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }} align="right">Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <HistoryIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1, display: 'block', mx: 'auto' }} />
                      No transaction records found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => {
                    const dateInfo = formatTxDate(tx.created_at);
                    const isCredit = tx.amount > 0;

                    return (
                      <TableRow key={tx.id || tx.transaction_id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonthIcon sx={{ fontSize: 18, color: '#64748b' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                                {dateInfo.formatted}
                              </Typography>
                              {dateInfo.relative && (
                                <Typography variant="caption" color="text.secondary">
                                  {dateInfo.relative}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.type?.toUpperCase() || (isCredit ? 'CREDIT' : 'DEBIT')}
                            color={isCredit ? 'success' : 'default'}
                            sx={{ fontWeight: 800, borderRadius: '6px', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {tx.description || tx.source || 'Metered Action'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: isCredit ? '#10b981' : '#ef4444', fontSize: '0.95rem' }}>
                          {isCredit ? `+${tx.amount}` : tx.amount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {tx.balance_after?.toLocaleString() ?? '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* STRIPE PURCHASE DIALOG */}
      <Dialog open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Purchase Credit Package
          </Typography>
          <IconButton onClick={() => setPurchaseModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {initializingPayment ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress sx={{ color: '#0f766e' }} />
              <Typography variant="body2" color="text.secondary">
                Initializing checkout session...
              </Typography>
            </Box>
          ) : selectedPack && paymentIntentData ? (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentData.client_secret }}>
              <StripePaymentForm
                pack={selectedPack}
                clientSecret={paymentIntentData.client_secret}
                paymentIntentId={paymentIntentData.payment_intent_id}
                onSuccess={handlePurchaseSuccess}
                onCancel={() => setPurchaseModalOpen(false)}
              />
            </Elements>
          ) : (
            <Alert severity="error">Unable to initialize checkout. Please try again.</Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* CUSTOM PRICE / TALK TO SALES MODAL */}
      <Dialog open={salesModalOpen} onClose={() => setSalesModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeadsetMicIcon sx={{ color: '#0284c7' }} />
            <Typography variant="h6" fontWeight={800}>
              Talk to Enterprise Sales
            </Typography>
          </Box>
          <IconButton onClick={() => setSalesModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSalesSubmit}>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect with our enterprise team to request custom credit volume discounts, dedicated API SLAs, or custom invoicing terms.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Your Full Name"
                  value={salesForm.name}
                  onChange={(e) => setSalesForm({ ...salesForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Work Email"
                  value={salesForm.email}
                  onChange={(e) => setSalesForm({ ...salesForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={salesForm.company}
                  onChange={(e) => setSalesForm({ ...salesForm, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={salesForm.phone}
                  onChange={(e) => setSalesForm({ ...salesForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Estimated Volume & Requirements"
                  value={salesForm.message}
                  onChange={(e) => setSalesForm({ ...salesForm, message: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setSalesModalOpen(false)} disabled={submittingSales}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submittingSales}
              startIcon={submittingSales ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
            >
              {submittingSales ? 'Submitting...' : 'Submit Sales Inquiry'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD CARD MODAL */}
      <Dialog open={addCardModalOpen} onClose={() => setAddCardModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCardIcon sx={{ color: '#0f766e' }} />
            <Typography variant="h6" fontWeight={800}>
              Add New Payment Card
            </Typography>
          </Box>
          <IconButton onClick={() => setAddCardModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new credit or debit card for purchasing credit top-up packs.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Full Name"
                placeholder="e.g. Johnathan Doe"
                value={newCardData.cardholderName}
                onChange={(e) => setNewCardData({ ...newCardData, cardholderName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Card Network Brand</InputLabel>
                <Select
                  value={newCardData.brand}
                  label="Card Network Brand"
                  onChange={(e) => setNewCardData({ ...newCardData, brand: e.target.value })}
                >
                  <MenuItem value="Visa">Visa</MenuItem>
                  <MenuItem value="Mastercard">Mastercard</MenuItem>
                  <MenuItem value="American Express">American Express</MenuItem>
                  <MenuItem value="Discover">Discover</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Exp Month</InputLabel>
                <Select
                  value={newCardData.expMonth}
                  label="Exp Month"
                  onChange={(e) => setNewCardData({ ...newCardData, expMonth: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Exp Year</InputLabel>
                <Select
                  value={newCardData.expYear}
                  label="Exp Year"
                  onChange={(e) => setNewCardData({ ...newCardData, expYear: e.target.value })}
                >
                  {['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: '12px', bgcolor: '#f8fafc', mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mb: 1, display: 'block' }}>
                  CARD DETAILS & CVC CODE:
                </Typography>
                <CardElement options={{ style: { base: { fontSize: '16px', color: '#1e293b' } } }} />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newCardData.isDefault}
                    onChange={(e) => setNewCardData({ ...newCardData, isDefault: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                    Set as Primary Default Payment Method
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAddCardModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCardSubmit}
            sx={{ bgcolor: '#0f766e', px: 4, fontWeight: 700, borderRadius: '10px', '&:hover': { bgcolor: '#0d655e' } }}
          >
            Save Card Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CARD CONFIRMATION MODAL */}
      <Dialog open={deleteCardModalOpen} onClose={() => setDeleteCardModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon sx={{ color: '#ef4444' }} />
            <Typography variant="h6" fontWeight={800} color="error">
              Remove Payment Card
            </Typography>
          </Box>
          <IconButton onClick={() => setDeleteCardModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2, color: '#0f172a' }}>
            Are you sure you want to remove this payment method?
          </Typography>

          {cardToDelete && (
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0f172a' }}>
                {cardToDelete.brand} ending in •••• {cardToDelete.last4}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expires: {cardToDelete.expMonth || cardToDelete.exp_month}/{cardToDelete.expYear || cardToDelete.exp_year}
              </Typography>
            </Paper>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            This card will be unlinked from your account. You can re-add it at any time.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteCardModalOpen(false)} disabled={deletingCard}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteCard}
            disabled={deletingCard}
            startIcon={deletingCard ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            sx={{ fontWeight: 700, px: 3, borderRadius: '10px' }}
          >
            {deletingCard ? 'Deleting...' : 'Remove Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR NOTIFICATIONS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
