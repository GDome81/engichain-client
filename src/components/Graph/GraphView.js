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
import { usePrincipalEntity } from '../../context/PrincipalEntityContext';
import { toast } from 'react-toastify';
import RelationDialog from './RelationDialog';

const GraphView = () => {
  const { principalEntity } = usePrincipalEntity();
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

  const [initialCenterDone, setInitialCenterDone] = useState(false);

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0 && !initialCenterDone) {
      // Center the graph only once after the initial data load
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
        setInitialCenterDone(true);
      }, 500);
    }
  }, [graphData, initialCenterDone]);



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

        const processNode = async (item, category) => {
          const nodeId = parseInt(item.id, 10);
          if (nodeMap.has(nodeId)) return;
          
          // Always fetch complete data to ensure accurate certification status
          try {
            const fullItem = await dataService.findDataById(item.id);
            const node = {
              id: nodeId,
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
              expanded: parsedFocusId === nodeId, // The initial focused node is considered expanded
            };
            nodes.push(node);
            nodeMap.set(nodeId, node);
          } catch (error) {
            console.error(`Error fetching complete data for node ${item.id}:`, error);
            // Fallback to original item data if fetch fails
            const node = {
              id: nodeId,
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
              expanded: parsedFocusId === nodeId, // The initial focused node is considered expanded
            };
            nodes.push(node);
            nodeMap.set(nodeId, node);
          }
        };

        const focusCategory = categories.find(c => c.id === focusNodeData.categoryId) || { name: 'Sconosciuta', id: -1 };
        await processNode(focusNodeData, focusCategory);

        const [childrenResponse, parentsResponse] = await Promise.all([
          dataService.findChildren(parsedFocusId),
          dataService.findParents(parsedFocusId),
        ]);

        console.log(`[GraphView] Children response for ${parsedFocusId}:`, childrenResponse);
        console.log(`[GraphView] Parents response for ${parsedFocusId}:`, parentsResponse);

        const allRelatedNodes = [...(childrenResponse.nodes || []), ...(parentsResponse.nodes || [])];
        const allRelationships = [...(childrenResponse.relationships || []), ...(parentsResponse.relationships || [])];

        for (const nodeData of allRelatedNodes) {
          const nodeId = parseInt(nodeData.id, 10);
          if (!nodeMap.has(nodeId)) {
            const category = categories.find(c => c.id === nodeData.categoryId) || { name: 'Sconosciuta', id: -1 };
            await processNode(nodeData, category);
          }
        }

        for (const rel of allRelationships) {
          const fromId = parseInt(rel.from, 10);
          const toId = parseInt(rel.to, 10);
          if (nodeMap.has(fromId) && nodeMap.has(toId)) {
            links.push({
              source: fromId,
              target: toId,
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
            const itemId = parseInt(item.id, 10);
            if (processedItems.has(itemId)) continue;
            processedItems.add(itemId);

            // Always fetch complete data to ensure accurate certification status
            const fullItem = await dataService.findDataById(item.id);
            const nodeId = parseInt(fullItem.id, 10);
            const node = {
              id: nodeId,
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
              expanded: false,
            };
            nodes.push(node);
            nodeMap.set(nodeId, node);
          }

          for (const item of categoryData) {
            const itemId = parseInt(item.id, 10);
            if (loadedRelationships.has(itemId)) continue;
            loadedRelationships.add(itemId);

            const relationships = await relationshipService.getRelationshipsByOwner(item.id);
            relationships.forEach(rel => {
              const fromId = parseInt(rel.from, 10);
              const toId = parseInt(rel.to, 10);
              if (nodeMap.has(fromId) && nodeMap.has(toId)) {
                links.push({
                  source: fromId,
                  target: toId,
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

  const expandNode = async (nodeId) => {
    try {
      const currentNode = graphData.nodes.find(n => n.id === nodeId);
      if (currentNode && currentNode.expanded) {
        toast.info(`Nodo ${currentNode.name} già espanso.`);
        return;
      }

      setLoading(true);

      const [childrenResponse, parentsResponse] = await Promise.all([
        dataService.findChildren(nodeId),
        dataService.findParents(nodeId),
      ]);

      const newNodes = [...graphData.nodes];
      const newLinks = [...graphData.links];
      const nodeMap = new Map(newNodes.map(n => [n.id, n]));

      const getLinkId = (link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return `${sourceId}:${targetId}`;
      };
      const linkSet = new Set(newLinks.map(getLinkId));

      const allRelatedNodes = [...(childrenResponse.nodes || []), ...(parentsResponse.nodes || [])];
      const allRelationships = [...(childrenResponse.relationships || []), ...(parentsResponse.relationships || [])];

      let addedNodesCount = 0;
      // Process each related node and fetch complete data including blockchainInfoEntities
      for (const item of allRelatedNodes) {
        const itemId = parseInt(item.id, 10);
        if (!nodeMap.has(itemId)) {
          addedNodesCount++;
          
          // Fetch complete node data to get accurate blockchainInfoEntities
          try {
            const fullItem = await dataService.findDataById(item.id);
            const category = categories.find(c => c.id === fullItem.categoryId) || { name: 'Sconosciuta', id: -1 };
            const node = {
              id: itemId,
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
              expanded: false
            };
            newNodes.push(node);
            nodeMap.set(itemId, node);
          } catch (error) {
            console.error(`Error fetching complete data for node ${item.id}:`, error);
            // Fallback to original item data if fetch fails
            const category = categories.find(c => c.id === item.categoryId) || { name: 'Sconosciuta', id: -1 };
            const node = {
              id: itemId,
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
              expanded: false
            };
            newNodes.push(node);
            nodeMap.set(itemId, node);
          }
        }
      }

      let addedLinksCount = 0;
      allRelationships.forEach(rel => {
        const fromId = parseInt(rel.from, 10);
        const toId = parseInt(rel.to, 10);
        const linkId = `${fromId}:${toId}`;
        if (nodeMap.has(fromId) && nodeMap.has(toId) && !linkSet.has(linkId)) {
          addedLinksCount++;
          newLinks.push({
            source: fromId,
            target: toId,
            label: rel.label || 'related',
            id: rel.id,
          });
          linkSet.add(linkId);
        }
      });

      const clickedNodeIndex = newNodes.findIndex(n => n.id === nodeId);
      if (clickedNodeIndex !== -1) {
        newNodes[clickedNodeIndex] = { ...newNodes[clickedNodeIndex], expanded: true };
      }

      if (addedNodesCount === 0 && addedLinksCount === 0 && currentNode) {
        toast.info(`Nessun nuovo nodo o relazione da aggiungere per ${currentNode.name}.`);
        return; // Don't update graph data if nothing was added
      }

      // Preserve existing node positions to prevent repositioning
      if (graphRef.current) {
        const currentGraphData = graphRef.current.graphData();
        if (currentGraphData && currentGraphData.nodes) {
          currentGraphData.nodes.forEach(existingNode => {
            const nodeIndex = newNodes.findIndex(n => n.id === existingNode.id);
            if (nodeIndex !== -1 && existingNode.x !== undefined && existingNode.y !== undefined) {
              newNodes[nodeIndex] = {
                ...newNodes[nodeIndex],
                x: existingNode.x,
                y: existingNode.y,
                vx: existingNode.vx || 0,
                vy: existingNode.vy || 0
              };
            }
          });
        }
      }

      // Update graph data with proper link references
      const updatedGraphData = { nodes: newNodes, links: newLinks };
      
      // Force complete graph data update to maintain link integrity
      if (graphRef.current) {
        // Stop current simulation completely
        graphRef.current.pauseAnimation();
        
        // Clear existing data and set new data
        graphRef.current.graphData({ nodes: [], links: [] });
        
        // Wait a moment then set the new data
        setTimeout(() => {
          if (graphRef.current) {
            graphRef.current.graphData(updatedGraphData);
            setGraphData(updatedGraphData);
            setAvailableNodes(newNodes);
            
            // Restart simulation with fresh state
            setTimeout(() => {
              if (graphRef.current) {
                graphRef.current.resumeAnimation();
                graphRef.current.reheatSimulation();
              }
            }, 100);
          }
        }, 50);
      } else {
        setGraphData(updatedGraphData);
        setAvailableNodes(newNodes);
      }

    } catch (error) {
      console.error(`Error expanding node ${nodeId}:`, error);
      toast.error('Errore nell\'espansione del nodo');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node) => {
    if (node) {
      console.log(`[GraphView] Node clicked:`, node);
      setSelectedNode(node);
      expandNode(node.id);
    }
  };

  const handleNodeRightClick = (node, event) => {
    event.preventDefault(); // Impedisce il menu contestuale del browser
    if (node) {
      console.log(`[GraphView] Node right-clicked:`, node);
      navigate(`/data/${node.id}`);
    }
  };

  const handleAddRelation = () => {
    if (!principalEntity) {
      toast.error('Seleziona un\'entità principale prima di aggiungere una relazione.');
      return;
    }
    // Filter out the principal entity from the list of available nodes
    const available = graphData.nodes.filter(n => n.id !== principalEntity.id);
    setAvailableNodes(available);
    setShowRelationDialog(true);
  };

  const handleCreateRelation = async (targetId, label) => {
    if (!principalEntity) {
      toast.error('Nessuna entità principale selezionata.');
      return;
    }

    const newRelation = {
      from: principalEntity.id,
      to: targetId,
      owner: principalEntity.id,
      label: label,
      params: {}
    };

    console.log('Sending relation data:', newRelation);
    console.log('Principal entity ID:', principalEntity.id);
    console.log('Target ID:', targetId);

    try {
      const result = await relationshipService.createRelationship(newRelation);
      console.log('Server response:', result);
      toast.success('Relazione creata con successo!');
      setShowRelationDialog(false);
      loadGraphData(); // Reload data to show the new relation
    } catch (error) { 
      console.error('Failed to create relation', error);
      toast.error('Errore nella creazione della relazione.');
    }
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

    // Check if node is certified based on blockchainInfoEntities
    // Now that we fetch complete data, we can rely on blockchainInfoEntities
    const isCertified = node.blockchainInfoEntities && node.blockchainInfoEntities.length > 0;

    // Draw node shape
    ctx.fillStyle = node.color;
    
    if (isCertified) {
        // Draw square for certified nodes
        const size = node.val * 2.2; // Larger square for better visibility
        ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
        
        // Black border for certified nodes
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3 / globalScale;
        ctx.strokeRect(node.x - size / 2, node.y - size / 2, size, size);
    } else {
        // Draw circle for non-certified nodes
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
        ctx.fill();
        
        // Yellow border for non-certified nodes
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2 / globalScale;
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
    <>
      <RelationDialog
        open={showRelationDialog}
        onClose={() => setShowRelationDialog(false)}
        nodes={availableNodes}
        sourceNode={principalEntity}
        onCreate={handleCreateRelation}
      />
      <Box className="fade-in" sx={{ p: 3, height: isFullscreen ? '100vh' : 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
            Grafo delle Relazioni
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
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
            <Paper className="modern-card" sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Filtri
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Categoria</InputLabel>
                <Select sx={{ borderRadius: '12px' }}
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
              <Paper className="modern-card" sx={{ p: 3 }}>
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
                    sx={{ backgroundColor: selectedNode.color, color: 'white', borderRadius: '8px', fontWeight: 600 }}
                  />
                </Box>
                <Box mb={1}>
                  <Chip
                    label={selectedNode.blockchainInfoEntities && selectedNode.blockchainInfoEntities.length > 0 ? 'Certificato' : 'Non Certificato'}
                    color={selectedNode.blockchainInfoEntities && selectedNode.blockchainInfoEntities.length > 0 ? 'success' : 'warning'}
                    size="small"
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Creato: {formatDate(selectedNode.creationDate)}
                </Typography>
                
                {/* Certificazioni Blockchain */}
                {selectedNode.blockchainInfoEntities && selectedNode.blockchainInfoEntities.length > 0 && (
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
                            sx={{ mt: 1, fontSize: '0.7rem', py: 0.5, borderRadius: '8px' }}
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
                  variant="contained"
                  size="small"
                  onClick={() => navigate(`/data/${selectedNode.id}`)}
                  fullWidth
                  className="modern-button"
                  sx={{ mt: 2 }}
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
            className="modern-card"
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
              nodeId="id"
              linkSource="source"
              linkTarget="target"
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={0.99}
              linkLabel="label"
              linkWidth={2}
              linkColor={() => '#666'}
              width={graphDimensions.width}
              height={graphDimensions.height}
              nodeCanvasObject={nodeCanvasObject}
              onNodeClick={handleNodeClick}
              onNodeRightClick={handleNodeRightClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              linkDirectionalParticles={1}
              linkDirectionalParticleWidth={3}
              linkDirectionalParticleSpeed={0.006}
              cooldownTicks={150}
              d3AlphaDecay={0.015}
              d3VelocityDecay={0.4}
              d3ReheatSimulation={false}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              linkCurvature={0}
              linkForceStrength={1}
              linkDistance={50}
              chargeStrength={-200}
              nodeRelSize={6}
              onEngineStop={() => {
                const parsedFocusId = currentFocusId ? parseInt(currentFocusId, 10) : null;
                if (parsedFocusId && graphRef.current) {
                  const focusNode = graphData.nodes.find(n => n.id === parsedFocusId);
                  if (focusNode) {
                    const neighborIds = new Set([parsedFocusId]);
                    graphData.links.forEach(link => {
                      // Handle both cases: when source/target are IDs or node objects
                      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                      
                      if (sourceId === parsedFocusId) neighborIds.add(targetId);
                      if (targetId === parsedFocusId) neighborIds.add(sourceId);
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
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Legend */}
      {!isFullscreen && graphData.nodes.length > 0 && (
        <Paper className="modern-card" sx={{ p: 3, mt: 2 }}>
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
                      color: 'white', 
                      borderRadius: '8px', 
                      fontWeight: 600 
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
                  label="Certificato"
                  color="success"
                  size="small"
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
                <Chip
                  label="Non Certificato"
                  color="warning"
                  size="small"
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
              </Box>
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            • Click per selezionare un nodo • Click destro o doppio click per visualizzare i dettagli • Trascina per spostare i nodi
          </Typography>
        </Paper>
      )}
    </Box>
    </>
  );
};

export default GraphView;