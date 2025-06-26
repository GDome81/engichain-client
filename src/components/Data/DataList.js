import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  DataObject as DataIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dataService from '../../services/dataService';
import categoryService from '../../services/categoryService';
import { toast } from 'react-toastify';

const DataList = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(12);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadData();
    }
  }, [categories, selectedCategory, currentPage]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(0, 100);
      setCategories(response.content || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Errore nel caricamento delle categorie');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let allData = [];
      let totalItems = 0;
      
      if (selectedCategory) {
        // Load data for specific category
        const response = await dataService.findDataByCategory(
          selectedCategory,
          currentPage - 1,
          pageSize
        );
        allData = response.content || [];
        totalItems = response.totalElements || 0;
      } else {
        // Load data for all categories
        for (const category of categories) {
          try {
            const response = await dataService.findDataByCategory(
              category.id,
              0,
              1000 // Get all data for filtering
            );
            const categoryData = (response.content || []).map(item => ({
              ...item,
              categoryName: category.name
            }));
            allData = [...allData, ...categoryData];
          } catch (error) {
            console.error(`Error loading data for category ${category.id}:`, error);
          }
        }
        
        // Sort by creation date
        allData.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
        
        // Apply pagination
        totalItems = allData.length;
        const startIndex = (currentPage - 1) * pageSize;
        allData = allData.slice(startIndex, startIndex + pageSize);
      }
      
      setData(allData);
      setTotalPages(Math.ceil(totalItems / pageSize));
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Errore nel caricamento dei dati');
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleViewDetails = (id) => {
    navigate(`/data/${id}`);
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

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
            Entità
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
            Gestisci le tue entità certificate su blockchain
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/data/new')}
          className="modern-button"
        >
          Crea Entità
        </Button>
      </Box>

      {/* Filters */}
      <Paper className="modern-form" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Categoria</InputLabel>
            <Select
              value={selectedCategory}
              label="Categoria"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">
                <em>Tutte le categorie</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cerca per nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              sx: { borderRadius: '12px' }
            }}
          />
        </Grid>
      </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : filteredData.length === 0 ? (
        <Alert severity="info">
          {searchTerm ? 
            `Nessuna entità trovata per "${searchTerm}"` : 
            'Nessuna entità trovata. Crea la tua prima entità per iniziare.'
          }
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredData.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card className="modern-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)', mr: 2 }}><DataIcon /></Avatar>
                      <Typography variant="h6" component="h2" noWrap sx={{ fontWeight: 700 }}>
                        {item.name}
                      </Typography>
                    </Box>

                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                      {getStatusChip(item)}
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Categoria: {item.categoryName}
                    </Typography>

                    <Typography variant="caption" color="textSecondary">
                      Creato: {formatDate(item.creationDate)}
                    </Typography>
                    {item.lastUpdateDate && item.lastUpdateDate !== item.creationDate && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Aggiornato: {formatDate(item.lastUpdateDate)}
                      </Typography>
                    )}

                    {item.blockchainInfoEntities && item.blockchainInfoEntities.length > 0 && (
                      <Typography variant="caption" color="success.main" display="block">
                        Certificazioni: {item.blockchainInfoEntities.length}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDetails(item.id)}
                      fullWidth
                      className="modern-button"
                    >
                      Visualizza
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
                      <Box display="flex" justifyContent="center" mt={4}>
                            <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default DataList;