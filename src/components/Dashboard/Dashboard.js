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
} from '@mui/material';
import {
  Add as AddIcon,
  DataObject as DataIcon,
  Category as CategoryIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
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
  }, []); // Esegui solo al montaggio

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all categories
      const categoriesResponse = await categoryService.getCategories(0, 1000); // Fetch a large number of categories
      const categoriesList = categoriesResponse.content || [];
      setCategories(categoriesList);
      
      // Load all data from all categories to calculate statistics
      const dataPromises = categoriesList.map(category => 
        dataService.findDataByCategory(category.id, 0, 1000) // Fetch a large number of items per category
      );
      const dataResponses = await Promise.all(dataPromises);
      const allData = dataResponses.flatMap(response => response.content || []);

      // Sort all data by creation date and take the most recent 5 for display
      const sortedData = [...allData].sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
      setRecentData(sortedData.slice(0, 5));

      // Calculate stats from the fetched data
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Panoramica del sistema di certificazione blockchain
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DataIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Entità Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalData}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <VerifiedIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Certificati
                  </Typography>
                  <Typography variant="h4">
                    {stats.certifiedData}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    In Attesa
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingData}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CategoryIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Categorie
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCategories}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Azioni Rapide
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/data/new')}
                fullWidth
              >
                Crea Nuova Entità
              </Button>
              <Button
                variant="outlined"
                startIcon={<DataIcon />}
                onClick={() => navigate('/data')}
                fullWidth
              >
                Visualizza Tutte le Entità
              </Button>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => navigate('/categories')}
                fullWidth
              >
                Gestisci Categorie
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Data */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Entità Recenti
            </Typography>
            {recentData.length > 0 ? (
              <List>
                {recentData.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    onClick={() => navigate(`/data/${item.id}`)}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {item.name}
                          </Typography>
                          {getStatusChip(item)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Categoria: {item.categoryName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Creato: {formatDate(item.creationDate)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">
                Nessuna entità trovata. Crea la tua prima entità per iniziare.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;