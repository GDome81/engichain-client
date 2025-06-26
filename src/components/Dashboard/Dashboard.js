import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  DataObject as DataIcon,
  Category as CategoryIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dataService from '../../services/dataService';
import categoryService from '../../services/categoryService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalData: 0,
    certifiedData: 0,
    pendingData: 0,
    totalCategories: 0,
  });
  const [recentData, setRecentData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const categoriesResponse = await categoryService.getCategories(0, 1000);
      const categoriesList = categoriesResponse.content || [];
      setCategories(categoriesList);
      
      const dataPromises = categoriesList.map(category => 
        dataService.findDataByCategory(category.id, 0, 1000)
      );
      const dataResponses = await Promise.all(dataPromises);
      const allData = dataResponses.flatMap(response => response.content || []);

      const sortedData = [...allData].sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
      setRecentData(sortedData.slice(0, 5));

      const totalData = allData.length;
      const certifiedData = allData.filter(d => d.blockchainInfoEntities && d.blockchainInfoEntities.length > 0).length;
      const pendingData = totalData - certifiedData;

      setStats({
        totalData,
        certifiedData,
        pendingData,
        totalCategories: categoriesList.length,
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Errore nel caricamento dei dati della dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (item) => {
    const isCertified = item.blockchainInfoEntities && item.blockchainInfoEntities.length > 0;
    return (
      <Chip
        icon={isCertified ? <VerifiedIcon /> : <PendingIcon />}
        label={isCertified ? 'Certificato' : 'In attesa'}
        color={isCertified ? 'success' : 'warning'}
        size="small"
        className="status-chip"
        sx={{
          fontWeight: 600,
          '& .MuiChip-icon': {
            fontSize: '1rem'
          }
        }}
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const certificationRate = stats.totalData > 0 ? (stats.certifiedData / stats.totalData) * 100 : 0;

  if (loading) {
    return (
      <Box className="loading-spinner">
        <CircularProgress size={60} sx={{ color: '#667eea' }} />
        <Typography className="loading-text">Caricamento dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          className="gradient-text"
          sx={{ fontWeight: 800, mb: 1 }}
        >
          Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ fontWeight: 400, opacity: 0.8 }}
        >
          Panoramica del sistema di certificazione blockchain
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card className="stats-card modern-card" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    Entità Totali
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ fontWeight: 800, color: '#667eea' }}
                  >
                    {stats.totalData}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                      +12% questo mese
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <DataIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card className="stats-card modern-card" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    Certificati
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ fontWeight: 800, color: '#4caf50' }}
                  >
                    {stats.certifiedData}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={certificationRate}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4caf50',
                          borderRadius: 3,
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {certificationRate.toFixed(1)}% del totale
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #4caf50, #45a049)',
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card className="stats-card modern-card" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    In Attesa
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ fontWeight: 800, color: '#ff9800' }}
                  >
                    {stats.pendingData}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <SpeedIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                      Da certificare
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
                  }}
                >
                  <PendingIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
          <Card className="stats-card modern-card" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    color="text.secondary" 
                    gutterBottom 
                    sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    Categorie
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ fontWeight: 800, color: '#2196f3' }}
                  >
                    {stats.totalCategories}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <SecurityIcon sx={{ fontSize: 16, color: 'info.main', mr: 0.5 }} />
                    <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                      Attive
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                  }}
                >
                  <CategoryIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper className="modern-form" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ fontWeight: 700, mb: 3 }}
            >
              🚀 Azioni Rapide
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/data/new')}
                fullWidth
                className="modern-button"
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                Crea Nuova Entità
              </Button>
              <Button
                variant="outlined"
                startIcon={<DataIcon />}
                onClick={() => navigate('/data')}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    background: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Visualizza Tutte le Entità
              </Button>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => navigate('/categories')}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderColor: '#764ba2',
                  color: '#764ba2',
                  '&:hover': {
                    borderColor: '#6a4190',
                    background: 'rgba(118, 75, 162, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                Gestisci Categorie
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Data */}
        <Grid item xs={12} md={8}>
          <Paper className="modern-form" sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ fontWeight: 700, mb: 3 }}
            >
              📋 Entità Recenti
            </Typography>
            {recentData.length > 0 ? (
              <List sx={{ p: 0 }}>
                {recentData.map((item, index) => (
                  <ListItem
                    key={item.id}
                    className="modern-card"
                    sx={{
                      mb: 2,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      p: 2,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                    onClick={() => navigate(`/data/${item.id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background: `linear-gradient(135deg, ${['#667eea', '#4caf50', '#ff9800', '#f44336', '#9c27b0'][index % 5]}, ${['#764ba2', '#45a049', '#f57c00', '#d32f2f', '#7b1fa2'][index % 5]})`,
                          mr: 2,
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <DataIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography 
                                variant="subtitle1" 
                                sx={{ fontWeight: 700, fontSize: '1.1rem' }}
                              >
                                {item.name}
                              </Typography>
                              {getStatusChip(item)}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontWeight: 500 }}
                              >
                                📁 Categoria: {item.categoryName}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                🕒 Creato: {formatDate(item.creationDate)}
                              </Typography>
                            </Box>
                          }
                        />
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 3,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  border: '2px dashed rgba(102, 126, 234, 0.3)',
                }}
              >
                <DataIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography 
                  color="text.secondary" 
                  sx={{ fontSize: '1.1rem', fontWeight: 500 }}
                >
                  Nessuna entità trovata
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mt: 1, mb: 3 }}
                >
                  Crea la tua prima entità per iniziare
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/data/new')}
                  className="modern-button"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                  }}
                >
                  Crea Prima Entità
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;