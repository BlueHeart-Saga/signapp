import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

// Animations
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const BlockContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    bottom: '20px',
    borderRadius: '20px',
    backgroundColor: '#0f766e',
    background: 'linear-gradient(135deg, #0f766e 0%, #0d9489bc 40%, #0d948976 70%, #0f766e 100%)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
        display: 'none'
    },
    minHeight: '600px',
    padding: theme.spacing(3),
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    fontFamily: '"Outfit", "Inter", sans-serif',
    textAlign: 'center',
    color: 'white'
}));

const MonitorGraphic = styled(Box)(({ theme }) => ({
    width: '100%',
    maxWidth: '320px',
    aspectRatio: '4/3',
    backgroundColor: '#e2e8f0',
    borderRadius: '12px',
    position: 'relative',
    border: '6px solid #cbd5e0',
    [theme.breakpoints.up('md')]: {
        border: '10px solid #cbd5e0',
    },
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '&::after': { // Stand
        content: '""',
        position: 'absolute',
        bottom: '-30px',
        width: '60px',
        height: '30px',
        backgroundColor: '#cbd5e0',
        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
        [theme.breakpoints.up('md')]: {
             bottom: '-40px',
             width: '80px',
             height: '40px',
        }
    },
    '&::before': { // Screen shine
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)',
        zIndex: 1,
        borderRadius: '2px',
    }
}));

const PopWindow = styled(Paper)(({ theme, bgcolor = '#f43f5e' }) => ({
    position: 'absolute',
    width: '120px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    zIndex: 5,
}));

const PopHeader = styled(Box)(({ theme }) => ({
    height: '24px',
    backgroundColor: 'white',
    padding: '4px 8px',
    display: 'flex',
    gap: '3px',
    '& > div': {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: '#cbd5e0'
    }
}));

const PopContent = styled(Box)(({ bgcolor }) => ({
    backgroundColor: bgcolor,
    padding: '12px 8px',
    color: 'white',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
}));

const HeaderBox = styled(Box)(({ theme }) => ({
    border: '3px solid white',
    padding: '8px 20px',
    width: 'auto',
    maxWidth: '90%',
    position: 'relative',
    marginBottom: '30px',
    [theme.breakpoints.up('md')]: {
        padding: '12px 40px',
        marginBottom: '60px',
    },
    '&::before, &::after': {
        content: '""',
        position: 'absolute',
        width: '15px',
        [theme.breakpoints.up('sm')]: { width: '40px' },
        height: '2px',
        backgroundColor: 'white',
        top: '50%',
    },
    '&::before': { left: '-20px', [theme.breakpoints.up('sm')]: { left: '-50px' } },
    '&::after': { right: '-20px', [theme.breakpoints.up('sm')]: { right: '-50px' } }
}));

const ActionButton = styled(Button)(({ theme, primary }) => ({
    padding: '8px 24px',
    borderRadius: '10px',
    fontWeight: 900,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
    boxShadow: primary 
        ? '0 10px 20px -5px rgba(255, 255, 255, 0.3)' 
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
    background: primary 
        ? 'rgba(255, 255, 255, 1)' 
        : 'rgba(255, 255, 255, 0.1)',
    color: primary ? '#0f766e' : 'white',
    border: primary ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
    '&:hover': {
        transform: 'translateY(-3px)',
        background: primary 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.2)',
        boxShadow: primary 
            ? '0 15px 30px -5px rgba(255, 255, 255, 0.4)' 
            : '0 8px 20px rgba(0, 0, 0, 0.2)',
    },
    '&:active': {
        transform: 'translateY(-1px)',
    }
}));

const SubscriptionExpiredBlock = () => {
    const navigate = useNavigate();

    return (
        <BlockContainer animation={`${slideUp} 0.8s ease-out forwards`}>
            <HeaderBox>
                <Typography variant="h4" sx={{ 
                    color: 'white', 
                    fontWeight: 900, 
                    letterSpacing: { xs: 1, sm: 2 },
                    fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.5rem' }
                }}>
                    UPGRADE PLAN
                </Typography>
                <Typography variant="body2" sx={{ 
                    color: 'white', 
                    fontWeight: 700, 
                    textAlign: 'center', 
                    letterSpacing: { xs: 2, sm: 5 }, 
                    mt: 1,
                    fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.9rem' }
                }}>
                    ACCESS ALL PREMIUM FEATURES
                </Typography>
            </HeaderBox>

            <Box sx={{ 
                position: 'relative', 
                mb: { xs: 4, md: 8 }, 
                height: { xs: 220, sm: 280 }, 
                width: '100%', 
                maxWidth: 450, 
                display: 'flex', 
                justifyContent: 'center' 
            }}>
                {/* Main Monitor */}
                <MonitorGraphic>
                    <Box sx={{ width: '80%', height: '10px', bgcolor: '#f1f5f9', mb: 1.5, borderRadius: 1 }} />
                    <Box sx={{ width: '60%', height: '8px', bgcolor: '#f1f5f9', mb: 1.5, borderRadius: 1 }} />
                    <Box sx={{ width: '70%', height: '30px', bgcolor: '#f1f5f9', borderRadius: 1 }} />
                </MonitorGraphic>

                {/* Pop Windows */}
                <PopWindow sx={{ top: { xs: 0, sm: -20 }, left: { xs: 0, sm: 30 }, width: { xs: 90, sm: 120 } }}>
                    <PopHeader><div /><div /><div /></PopHeader>
                    <PopContent bgcolor="#f43f5e">
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1rem', sm: '1.5rem' } }}>OFF</Typography>
                        <Typography sx={{ fontSize: { xs: '0.4rem', sm: '0.6rem' }, fontWeight: 700 }}>PLAN EXPIRED!</Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/user/subscription')}
                            sx={{ bgcolor: '#fb923c', color: 'white', fontSize: { xs: '0.4rem', sm: '0.6rem' }, mt: 0.5, py: 0 }}
                        >
                            RENEW
                        </Button>
                    </PopContent>
                </PopWindow>

                <PopWindow sx={{ top: { xs: -30, sm: -32 }, left: { xs: 120, sm: 222 }, width: { xs: 100, sm: 140 } }}>
                    <PopHeader><div style={{ backgroundColor: '#f43f5e' }} /><div /><div /></PopHeader>
                    <PopContent bgcolor="#fb923c">
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.8rem', sm: '1rem' } }}>ALERT!</Typography>
                        <Typography sx={{ fontSize: { xs: '0.4rem', sm: '0.5rem' }, fontWeight: 700 }}>REACHED LIMIT</Typography>
                        <Box sx={{ bgcolor: '#2dd4bf', px: 1, borderRadius: 1, mt: 0.5 }}>
                            <Typography sx={{ fontSize: { xs: '0.4rem', sm: '0.5rem' }, fontWeight: 900 }}>RENEW NOW</Typography>
                        </Box>
                    </PopContent>
                </PopWindow>

                <PopWindow sx={{ top: { xs: 80, sm: 100 }, right: { xs: 0, sm: 10 }, width: { xs: 100, sm: 140 } }}>
                    <PopHeader><div /><div /><div /></PopHeader>
                    <PopContent bgcolor="#f43f5e">
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                            <Typography sx={{ fontWeight: 900, color: '#f43f5e', fontSize: '0.8rem' }}>X</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700 }}>ACCESS DENIED</Typography>
                    </PopContent>
                </PopWindow>

                <PopWindow sx={{ bottom: { xs: -10, sm: -20 }, left: { xs: 20, sm: 35 }, width: { xs: 110, sm: 140 } }}>
                    <PopHeader><div /><div /><div /></PopHeader>
                    <PopContent bgcolor="#fb923c">
                        <LockIcon sx={{ fontSize: { xs: 24, sm: 40 }, mb: 0.5 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.6rem', sm: '0.8rem' } }}>LOCKED!</Typography>
                    </PopContent>
                </PopWindow>
            </Box>

            <Typography
                variant="body1"
                sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    maxWidth: 500,
                    textAlign: 'center',
                    mb: 5,
                    fontWeight: 600,
                    lineHeight: 1.6,
                    px: 3,
                    fontSize: { xs: '0.85rem', sm: '1.05rem' }
                }}
            >
                Please subscribe or upgrade your plan to unlock all features and continue your professional workflow.
            </Typography>

            <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                flexDirection: { xs: 'column', sm: 'row' },
                width: { xs: '80%', sm: 'auto' },
                maxWidth: 400,
                mb: 4
            }}>
                <ActionButton
                    primary={1}
                    fullWidth
                    onClick={() => navigate('/user/subscription')}
                >
                    UPGRADE NOW
                </ActionButton>
                <ActionButton
                    fullWidth
                    component="a"
                    href="mailto:support@safesign.com"
                >
                    CONTACT SUPPORT
                </ActionButton>
            </Box>
        </BlockContainer>
    );
};

export default SubscriptionExpiredBlock;
