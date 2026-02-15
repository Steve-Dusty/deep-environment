'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import {
  GraphNode,
  GraphLink,
  GraphData,
  CATEGORY_COLORS,
  THREAT_COLORS,
  CATEGORY_LABELS,
  buildInitialGraph,
  generateNewReport,
  generateNewThreat,
} from '../data/graphData';

// ── Sprite text label ──────────────────────────────────────────────────────

function createTextSprite(text: string, color: string, size = 3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 64;
  ctx.font = `600 ${Math.round(size * 8)}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.substring(0, 22), canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.9 }),
  );
  sprite.scale.set(size * 6, size * 0.75, 1);
  return sprite;
}

// ── Public handle for parent to call navigateToNode ────────────────────────

export interface GraphHandle {
  navigateToNode: (nodeId: string) => void;
  resetView: () => void;
  getGraphData: () => GraphData;
}

interface KnowledgeGraph3DProps {
  onNodeSelect?: (node: GraphNode | null) => void;
  onGraphUpdate?: (data: GraphData) => void;
  autoUpdate?: boolean;
  width?: number;
  height?: number;
}

const KnowledgeGraph3D = forwardRef<GraphHandle, KnowledgeGraph3DProps>(
  ({ onNodeSelect, onGraphUpdate, autoUpdate = true, width, height }, ref) => {
    const fgRef = useRef<any>(undefined);
    const [graphData, setGraphData] = useState<GraphData>(() => buildInitialGraph());
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
    const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set());
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
    const [dimensions, setDimensions] = useState({
      w: width || (typeof window !== 'undefined' ? window.innerWidth : 1200),
      h: height || (typeof window !== 'undefined' ? window.innerHeight : 800),
    });

    // ── Neighbor map ───────────────────────────────────────────────────

    const neighborMap = useMemo(() => {
      const neighbors = new Map<string, Set<string>>();
      const nodeLinks = new Map<string, Set<GraphLink>>();
      graphData.nodes.forEach((n) => {
        neighbors.set(n.id, new Set());
        nodeLinks.set(n.id, new Set());
      });
      graphData.links.forEach((link) => {
        const s = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
        const t = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
        neighbors.get(s)?.add(t);
        neighbors.get(t)?.add(s);
        nodeLinks.get(s)?.add(link);
        nodeLinks.get(t)?.add(link);
      });
      return { neighbors, nodeLinks };
    }, [graphData]);

    // ── Expose handle to parent ────────────────────────────────────────

    // Helper: fly camera to a node and reset controls after animation
    const flyToNode = useCallback((node: GraphNode, duration = 800) => {
      const fg = fgRef.current;
      if (!fg) return;
      const nx = node.x || 0;
      const ny = node.y || 0;
      const nz = node.z || 0;
      const dist = 120;
      const hyp = Math.hypot(nx, ny, nz) || 1;
      const r = 1 + dist / hyp;

      fg.cameraPosition(
        { x: nx * r, y: ny * r, z: nz * r },
        { x: nx, y: ny, z: nz },
        duration,
      );

      // After animation: re-sync controls so zoom/orbit work freely again
      setTimeout(() => {
        const controls = fg.controls();
        if (controls) {
          // Set target to node so orbit centers there
          if (controls.target) controls.target.set(nx, ny, nz);
          // Bump zoom speed so scrolling feels responsive at this distance
          if ('zoomSpeed' in controls) controls.zoomSpeed = 3.0;
          if ('dynamicDampingFactor' in controls) controls.dynamicDampingFactor = 0.2;
          controls.update?.();
        }
      }, duration + 50);
    }, []);

    useImperativeHandle(ref, () => ({
      navigateToNode(nodeId: string) {
        const node = graphData.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const hn = new Set<string>([nodeId]);
        neighborMap.neighbors.get(nodeId)?.forEach((id) => hn.add(id));
        const hl = new Set<GraphLink>();
        neighborMap.nodeLinks.get(nodeId)?.forEach((l) => hl.add(l));
        setHighlightNodes(hn);
        setHighlightLinks(hl);

        flyToNode(node, 1000);
        onNodeSelect?.(node);
      },
      resetView() {
        const fg = fgRef.current;
        if (!fg) return;
        fg.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 600);
        setTimeout(() => {
          const controls = fg.controls();
          if (controls) {
            if (controls.target) controls.target.set(0, 0, 0);
            if ('zoomSpeed' in controls) controls.zoomSpeed = 1.5;
            controls.update?.();
          }
        }, 650);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      },
      getGraphData() {
        return graphData;
      },
    }), [graphData, neighborMap, onNodeSelect, flyToNode]);

    // ── Resize ─────────────────────────────────────────────────────────

    useEffect(() => {
      if (width && height) {
        setDimensions({ w: width, h: height });
        return;
      }
      const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [width, height]);

    // ── Live data stream ───────────────────────────────────────────────

    useEffect(() => {
      if (!autoUpdate) return;

      const reportTimer = setInterval(() => {
        setGraphData((prev) => {
          const { node, link } = generateNewReport();
          const next = { nodes: [...prev.nodes, node], links: [...prev.links, link] };
          onGraphUpdate?.(next);
          return next;
        });
      }, 8000);

      const threatTimer = setInterval(() => {
        setGraphData((prev) => {
          const { node, links: newLinks } = generateNewThreat();
          const next = { nodes: [...prev.nodes, node], links: [...prev.links, ...newLinks] };
          onGraphUpdate?.(next);
          return next;
        });
      }, 20000);

      // Prune live nodes
      const pruneTimer = setInterval(() => {
        setGraphData((prev) => {
          if (prev.nodes.length < 45) return prev;
          const live = prev.nodes.filter((n) => n.id.startsWith('rpt-') || n.id.startsWith('thr-live-'));
          if (live.length < 6) return prev;
          const removeIds = new Set(live.slice(0, 4).map((n) => n.id));
          return {
            nodes: prev.nodes.filter((n) => !removeIds.has(n.id)),
            links: prev.links.filter((l) => {
              const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
              const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
              return !removeIds.has(s) && !removeIds.has(t);
            }),
          };
        });
      }, 25000);

      return () => {
        clearInterval(reportTimer);
        clearInterval(threatTimer);
        clearInterval(pruneTimer);
      };
    }, [autoUpdate, onGraphUpdate]);

    // ── Scene + camera + forces ────────────────────────────────────────

    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;

      fg.cameraPosition({ x: 0, y: 0, z: 300 });

      // Configure trackball controls for smooth zoom at any distance
      const controls = fg.controls();
      if (controls) {
        controls.zoomSpeed = 1.5;
        controls.rotateSpeed = 2.0;
        controls.noPan = false;
        if ('minDistance' in controls) controls.minDistance = 10;
        if ('maxDistance' in controls) controls.maxDistance = 1000;
      }

      const scene = fg.scene();
      scene.fog = new THREE.FogExp2(0x08090c, 0.0008);
      scene.background = new THREE.Color(0x08090c);
      scene.add(new THREE.AmbientLight(0x444466, 1.0));

      const teal = new THREE.PointLight(0x0ff5c4, 1.2, 600);
      teal.position.set(80, 80, 200);
      scene.add(teal);
      const red = new THREE.PointLight(0xff3b4f, 0.6, 400);
      red.position.set(-100, -60, 150);
      scene.add(red);

      // Forces — reasonable spacing
      fg.d3Force('charge').strength(-80).distanceMax(250);
      fg.d3Force('link').distance(40).strength(0.2);
      fg.d3Force('center').strength(0.04);
    }, []);

    // ── Hover ──────────────────────────────────────────────────────────

    const handleNodeHover = useCallback(
      (node: GraphNode | null) => {
        const hn = new Set<string>();
        const hl = new Set<GraphLink>();
        if (node) {
          hn.add(node.id);
          neighborMap.neighbors.get(node.id)?.forEach((id) => hn.add(id));
          neighborMap.nodeLinks.get(node.id)?.forEach((l) => hl.add(l));
        }
        setHighlightNodes(hn);
        setHighlightLinks(hl);
        setHoverNode(node);
      },
      [neighborMap],
    );

    // ── Click ──────────────────────────────────────────────────────────

    const handleNodeClick = useCallback(
      (node: GraphNode) => {
        onNodeSelect?.(node);
      },
      [onNodeSelect],
    );

    const handleBgClick = useCallback(() => {
      onNodeSelect?.(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }, [onNodeSelect]);


    // ── Custom node objects — PROPER SIZE ──────────────────────────────

    const nodeThreeObject = useCallback(
      (node: GraphNode) => {
        const group = new THREE.Group();
        const isHl = highlightNodes.has(node.id);
        const isHover = hoverNode?.id === node.id;
        const color = node.color || CATEGORY_COLORS[node.category];

        // Good visible radius — cbrt(val) * 1.5 like the original
        const base = Math.cbrt(node.val) * 1.5;
        const r = isHover ? base * 1.25 : base;

        // Core sphere
        const mat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color),
          emissive: new THREE.Color(color),
          emissiveIntensity: isHl ? 0.5 : 0.25,
          transparent: true,
          opacity: isHl ? 0.95 : 0.8,
          shininess: 40,
        });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), mat));

        // Glow shell
        const glowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: isHl ? 0.15 : 0.06,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.7, 14, 14), glowMat));

        // Location ring
        if (node.category === 'location') {
          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: isHl ? 0.45 : 0.2,
            side: THREE.DoubleSide,
          });
          const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.3, r * 1.5, 28), ringMat);
          ring.rotation.x = Math.PI / 2;
          group.add(ring);
        }

        // Threat wireframe
        if (node.category === 'threat') {
          const edges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(r * 1.5));
          group.add(
            new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.4 })),
          );
        }

        // Agent wireframe
        if (node.category === 'agent') {
          const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r * 1.4));
          group.add(
            new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.3 })),
          );
        }

        // Labels
        if (node.category === 'location' || isHl) {
          const label = createTextSprite(node.name, isHover ? '#fff' : color, node.category === 'location' ? 3 : 2.4);
          label.position.set(0, r + 5, 0);
          group.add(label);

          if (isHl) {
            const tag = createTextSprite(CATEGORY_LABELS[node.category], color, 1.6);
            tag.position.set(0, r + 8, 0);
            group.add(tag);
          }
        }

        return group;
      },
      [highlightNodes, hoverNode],
    );

    // ── Link accessors ─────────────────────────────────────────────────

    const linkColor = useCallback(
      (link: GraphLink) => (highlightLinks.has(link) ? '#0ff5c4' : link.color || '#1a1d2a'),
      [highlightLinks],
    );

    const linkWidth = useCallback(
      (link: GraphLink) => (highlightLinks.has(link) ? 2 : 0.4),
      [highlightLinks],
    );

    const linkParticles = useCallback(
      (link: GraphLink) => (highlightLinks.has(link) ? 5 : link.particles || 0),
      [highlightLinks],
    );

    // ── Render ─────────────────────────────────────────────────────────

    return (
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject as any}
        nodeThreeObjectExtend={false}
        nodeResolution={20}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.5}
        linkCurvature={0.12}
        linkDirectionalParticles={linkParticles}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#0ff5c4'}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.35}
        warmupTicks={60}
        cooldownTime={4000}
        onNodeHover={handleNodeHover as any}
        onNodeClick={handleNodeClick as any}
        onBackgroundClick={handleBgClick}
        enableNodeDrag={false}
        enableNavigationControls={true}
        controlType="trackball"
        backgroundColor="#08090c"
      />
    );
  },
);

KnowledgeGraph3D.displayName = 'KnowledgeGraph3D';

export default KnowledgeGraph3D;
