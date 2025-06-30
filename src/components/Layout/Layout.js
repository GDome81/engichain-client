import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  DataObject as DataIcon,
  AccountTree as GraphIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { usePrincipalEntity } from '../../context/PrincipalEntityContext';
import { toast } from 'react-toastify';

const drawerWidth = 280;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    description: 'Panoramica generale'
  },
  {
    text: 'Categorie',
    icon: <CategoryIcon />,
    path: '/categories',
    description: 'Gestione categorie'
  },
  {
    text: 'Entità',
    icon: <DataIcon />,
    path: '/data',
    description: 'Gestione entità'
  },
  {
    text: 'Grafo Relazioni',
    icon: <GraphIcon />,
    path: '/graph',
    description: 'Visualizzazione grafo'
  },
];

const Layout = ({ children, onAuthChange }) => {
  const { principalEntity } = usePrincipalEntity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      onAuthChange(false);
      navigate('/login');
      toast.success('Logout effettuato con successo');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Errore durante il logout');
    }
    handleMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box className="modern-nav" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          }}
        >
          <SecurityIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Typography 
          variant="h5" 
          className="gradient-text"
          sx={{ fontWeight: 800, mb: 0.5 }}
        >
          Engichain
        </Typography>
        <Chip
          label="v1.0"
          size="small"
          sx={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            fontWeight: 600,
          }}
        />
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.3 }} />

      <List sx={{ flexGrow: 1, px: 2, py: 3 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '16px',
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(isActive && {
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  }),
                  ...(!isActive && {
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                      transform: 'translateX(4px)',
                    }
                  })
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <Box>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7,
                      fontSize: '0.75rem',
                      display: 'block',
                      mt: -0.5
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Paper
        className="modern-card"
        sx={{
          p: 2,
          mt: 'auto',
          mx: 2,
          mb: 2,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          textAlign: 'center'
        }}
      >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            🔐 Certificazione Blockchain
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Sicurezza e tracciabilità garantite
          </Typography>
        </Paper>
      </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className="modern-header"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              Engichain
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.8rem'
              }}
            >
              Gestione sicura di entità e relazioni
            </Typography>
          </Box>

          {principalEntity && (
            <Chip label={`Entità: ${principalEntity.data.name}`} sx={{ mr: 2, backgroundColor: 'white' }} />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                  color: 'primary.main'
                }
              }}
            >
              <NotificationsIcon />
            </IconButton>

            <Button
              onClick={handleMenuClick}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                color: 'text.primary',
                fontWeight: 500,
                px: 2,
                py: 1,
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                }
              }}
              startIcon={
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              }
            >
              Profilo
            </Button>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                mt: 1,
                minWidth: 200,
              }
            }}
          >
            <MenuItem 
              onClick={handleLogout}
              className="modern-button"
              sx={{
                borderRadius: '12px',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  background: 'rgba(244, 67, 54, 0.1)',
                  color: 'error.main'
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Disconnetti
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Toolbar />
        <Box className="fade-in">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;