import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import ForceGraph2D from 'react-force-graph-2d';
import { useLocation, useNavigate } from 'react-router-dom';
import dataService from '../../services/dataService';
import categoryService from '../../services/categoryService';
import relationshipService from '../../services/relationshipService';
import { toast } from 'react-toastify';

const GraphView = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showRelationDialog, setShowRelationDialog] = useState(false);
  const [availableNodes, setAvailableNodes] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  const graphRef = useRef();
  const containerRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentFocusId, setCurrentFocusId] = useState(location.state?.focusId);

  useEffect(() => {
    loadCategories();
    updateGraphDimensions();
    window.addEventListener('resize', updateGraphDimensions);
    return () => window.removeEventListener('resize', updateGraphDimensions);
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadGraphData();
    }
  }, [categories, selectedCategory, currentFocusId]);



  const updateGraphDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setGraphDimensions({
        width: rect.width - 32, // Account for padding
        height: isFullscreen ? window.innerHeight - 100 : 600,
      });
    }
  }, [isFullscreen]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories(0, 100);
      setCategories(response.content || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Errore nel caricamento delle categorie');
    }
  };

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const nodes = [];
      const links = [];
      const nodeMap = new Map();
      const parsedFocusId = currentFocusId ? parseInt(currentFocusId, 10) : null;

      if (parsedFocusId) {
        console.log(`[GraphView] Loading focused graph for ID: ${parsedFocusId}`);
        const focusNodeData = await dataService.findDataById(parsedFocusId);

        if (!focusNodeData) {
          toast.error(`Nodo con ID ${parsedFocusId} non trovato.`);
          setLoading(false);
          return;
        }

        const processNode = (item, category) => {
          if (nodeMap.has(item.id)) return;
          const node = {
            id: item.id,
            name: item.name,
            category: category.name,
            categoryId: category.id,
            certified: item.blockchainInfoEntities && item.blockchainInfoEntities.length > 0,
            blockchainInfoEntities: item.blockchainInfoEntities || [],
            public: item.public,
            creationDate: item.creationDate,
            fields: item.fields,
            val: 10,
            color: getCategoryColor(category.id),
          };
          nodes.push(node);
          nodeMap.set(item.id, node);
        };

        const focusCategory = categories.find(c => c.id === focusNodeData.categoryId) || { name: 'Sconosciuta', id: -1 };
        processNode(focusNodeData, focusCategory);

        const relationships = await relationshipService.getRelationshipsByOwner(parsedFocusId);
        console.log(`[GraphView] Found ${relationships.length} relationships for node ${parsedFocusId}:`, relationships);

        for (const rel of relationships) {
          let relatedNodeId;
          if (rel.from === parsedFocusId) {
            relatedNodeId = rel.to;
            console.log(`[GraphView] Processing child relationship: ${rel.from} -> ${rel.to}`);
          } else if (rel.to === parsedFocusId) {
            relatedNodeId = rel.from;
            console.log(`[GraphView] Processing parent relationship: ${rel.from} -> ${rel.to}`);
          } else {
            console.warn(`[GraphView] Skipping stray relationship not involving node ${parsedFocusId}:`, rel);
            continue;
          }

          if (!nodeMap.has(relatedNodeId)) {
            try {
              const relatedNodeData = await dataService.findDataById(relatedNodeId);
              const relatedCategory = categories.find(c => c.id === relatedNodeData.categoryId) || { name: 'Sconosciuta', id: -1 };
              processNode(relatedNodeData, relatedCategory);
            } catch (error) {
              console.error(`Error loading related node ${relatedNodeId}:`, error);
            }
          }

          if (nodeMap.has(rel.from) && nodeMap.has(rel.to)) {
            links.push({
              source: rel.from,
              target: rel.to,
              label: rel.label || 'related',
              id: rel.id,
            });
          }
        }
      } else {
        // Load all data if no focusId
        const processedItems = new Set();
        const loadedRelationships = new Set();
        const categoriesToLoad = selectedCategory ? categories.filter(c => c.id === parseInt(selectedCategory)) : categories;

        for (const category of categoriesToLoad) {
          const dataResponse = await dataService.findDataByCategory(category.id, 0, 1000);
          const categoryData = dataResponse.content || [];

          for (const item of categoryData) {
            if (processedItems.has(item.id)) continue;
            processedItems.add(item.id);

            const fullItem = await dataService.findDataById(item.id);
            const node = {
              id: fullItem.id,
              name: fullItem.name,
              category: category.name,
              categoryId: category.id,
              certified: fullItem.blockchainInfoEntities && fullItem.blockchainInfoEntities.length > 0,
              blockchainInfoEntities: fullItem.blockchainInfoEntities || [],
              public: fullItem.public,
              creationDate: fullItem.creationDate,
              fields: fullItem.fields,
              val: 10,
              color: getCategoryColor(category.id),
            };
            nodes.push(node);
            nodeMap.set(fullItem.id, node);
          }

          for (const item of categoryData) {
            if (loadedRelationships.has(item.id)) continue;
            loadedRelationships.add(item.id);

            const relationships = await relationshipService.getRelationshipsByOwner(item.id);
            relationships.forEach(rel => {
              if (nodeMap.has(rel.from) && nodeMap.has(rel.to)) {
                links.push({
                  source: rel.from,
                  target: rel.to,
                  label: rel.label || 'related',
                  id: rel.id,
                });
              }
            });
          }
        }
      }

      console.log(`[GraphView] Graph data loaded: ${nodes.length} nodes, ${links.length} links`);
      setGraphData({ nodes, links });
      setAvailableNodes(nodes);

    } catch (error) {
      console.error('Error loading graph data:', error);
      toast.error('Errore nel caricamento del grafo');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId) => {
    const colors = [
      '#1976d2', '#dc004e', '#388e3c', '#f57c00',
      '#7b1fa2', '#00796b', '#c62828', '#5d4037',
      '#455a64', '#e65100'
    ];
    return colors[categoryId % colors.length];
  };

  const handleNodeClick = (node) => {
    if (node) {
      console.log(`[GraphView] Node clicked:`, node);
      setSelectedNode(node);
      setCurrentFocusId(node.id);
    }
  };

  const handleAddRelation = (node) => {
    navigate(`/data/${node.id}`);
  };

  const handleNodeDoubleClick = (node) => {
    navigate(`/data/${node.id}`);
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.5, 500);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.5, 500);
    }
  };

  const handleCenter = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(1000);
    }
  };

  const handleRefresh = () => {
    loadGraphData();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(updateGraphDimensions, 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Add border for certified nodes
    if (node.certified) {
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }
    
    // Draw label
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(
      node.x - bckgDimensions[0] / 2,
      node.y - bckgDimensions[1] / 2,
      ...bckgDimensions
    );
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';
    ctx.fillText(label, node.x, node.y);
  }, []);



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: isFullscreen ? '100vh' : 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Grafo delle Relazioni
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Visualizzazione interattiva delle relazioni tra entità
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Centra">
            <IconButton onClick={handleCenter}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Aggiorna">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}>
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Controls */}
        {!isFullscreen && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Filtri
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Categoria"
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Nodi: {graphData.nodes.length} | Collegamenti: {graphData.links.length}
              </Typography>
            </Paper>

            {/* Selected Node Info */}
            {selectedNode && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Nodo Selezionato
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedNode.name}
                </Typography>
                <Box mb={1}>
                  <Chip
                    label={selectedNode.category}
                    size="small"
                    sx={{ backgroundColor: selectedNode.color, color: 'white' }}
                  />
                </Box>
                <Box mb={1}>
                  <Chip
                    label={selectedNode.certified ? 'Certificato' : 'Non Certificato'}
                    color={selectedNode.certified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Creato: {formatDate(selectedNode.creationDate)}
                </Typography>
                
                {/* Certificazioni Blockchain */}
                {(() => {
                  console.log('[GraphView] Rendering certifications check:');
                  console.log('[GraphView] selectedNode.certified:', selectedNode.certified);
                  console.log('[GraphView] selectedNode.blockchainInfoEntities:', selectedNode.blockchainInfoEntities);
                  console.log('[GraphView] blockchainInfoEntities length:', selectedNode.blockchainInfoEntities?.length);
                  return null;
                })()}
                {selectedNode.certified && selectedNode.blockchainInfoEntities && selectedNode.blockchainInfoEntities.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="success.dark" gutterBottom>
                      🔗 Certificazioni Blockchain
                    </Typography>
                    {selectedNode.blockchainInfoEntities.map((cert, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="caption" color="success.dark" display="block">
                          <strong>{cert.blockchain}</strong>
                        </Typography>
                        <Typography variant="caption" color="success.dark" display="block">
                          Contratto: {cert.smartContractAddress ? `${cert.smartContractAddress.substring(0, 10)}...` : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="success.dark" display="block">
                          Data: {cert.certificationDate ? new Date(cert.certificationDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                        {cert.smartContractAddress && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            sx={{ mt: 0.5, fontSize: '0.7rem', py: 0.25 }}
                            href={`https://etherscan.io/address/${cert.smartContractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visualizza su Etherscan
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/data/${selectedNode.id}`)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Visualizza Dettagli
                </Button>
              </Paper>
            )}
          </Grid>
        )}

        {/* Graph */}
        <Grid item xs={12} md={isFullscreen ? 12 : 9}>
          <Paper 
            ref={containerRef} 
            sx={{ 
              p: 2, 
              position: isFullscreen ? 'fixed' : 'relative', 
              top: isFullscreen ? 0 : 'auto', 
              left: isFullscreen ? 0 : 'auto', 
              width: isFullscreen ? '100vw' : '100%', 
              height: isFullscreen ? '100vh' : 'auto', 
              zIndex: isFullscreen ? 1300 : 'auto' 
            }}
          >
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel="name"
              nodeVal="val"
              nodeColor="color"
              linkDirectionalArrowLength={5}
              linkDirectionalArrowRelPos={1}
              linkLabel="label"
              width={graphDimensions.width}
              height={graphDimensions.height}
              nodeCanvasObject={nodeCanvasObject}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              cooldownTicks={100}
              onEngineStop={() => {
                const parsedFocusId = currentFocusId ? parseInt(currentFocusId, 10) : null;
                if (parsedFocusId && graphRef.current) {
                  const focusNode = graphData.nodes.find(n => n.id === parsedFocusId);
                  if (focusNode) {
                    const neighborIds = new Set([parsedFocusId]);
                    graphData.links.forEach(link => {
                      if (link.source === parsedFocusId) neighborIds.add(link.target);
                      if (link.target === parsedFocusId) neighborIds.add(link.source);
                    });

                    if (neighborIds.size > 1) {
                      graphRef.current.zoomToFit(400, 100, node => neighborIds.has(node.id));
                    } else {
                      graphRef.current.centerAt(focusNode.x, focusNode.y, 400);
                      graphRef.current.zoom(2.5, 400);
                    }
                  } else {
                    graphRef.current.zoomToFit(400);
                  }
                } else if (graphRef.current) {
                  graphRef.current.zoomToFit(400);
                }
              }}
              linkCurvature={0.25}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Legend */}
      {!isFullscreen && graphData.nodes.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Legenda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Categorie:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    size="small"
                    sx={{ 
                      backgroundColor: getCategoryColor(category.id), 
                      color: 'white' 
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Stato Certificazione:
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label="Certificato (bordo verde)"
                  color="success"
                  size="small"
                />
                <Chip
                  label="Non Certificato"
                  color="default"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            • Click per selezionare un nodo • Click destro per visualizzare i dettagli • Trascina per spostare i nodi
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default GraphView;