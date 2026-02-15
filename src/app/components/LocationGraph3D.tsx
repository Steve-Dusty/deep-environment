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
  type ProblemNode,
  type ProblemLink,
  type LocationGraph,
  PROBLEM_CATEGORY_COLORS,
  PROBLEM_CATEGORY_LABELS,
} from '../data/locationGraphs';
import { THREAT_COLORS } from '../data/locations';

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

// ── Convert LocationGraph to ForceGraph3D format ────────────────────────────

interface GraphNode {
  id: string;
  name: string;
  category: ProblemNode['category'];
  severity: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
  color: string;
  strength: number;
}

function convertToGraphData(locationGraph: LocationGraph): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = locationGraph.problems.map((problem) => ({
    id: problem.id,
    name: problem.name,
    category: problem.category,
    severity: problem.severity,
    val: problem.severity === 'critical' ? 20 : problem.severity === 'high' ? 15 : problem.severity === 'elevated' ? 12 : 10,
    color: PROBLEM_CATEGORY_COLORS[problem.category],
  }));

  const links: GraphLink[] = locationGraph.links.map((link) => ({
    source: link.source,
    target: link.target,
    label: link.label,
    color: link.type === 'causes' ? '#ff3b4f' : link.type === 'amplifies' ? '#ff6b35' : '#0ff5c4',
    strength: link.strength,
  }));

  return { nodes, links };
}

// ── Public handle ──────────────────────────────────────────────────────────

export interface LocationGraphHandle {
  navigateToNode: (nodeId: string) => void;
  resetView: () => void;
  getGraphData: () => { nodes: number; links: number };
}

interface LocationGraph3DProps {
  locationId: string;
  graphData: LocationGraph;
  onProblemSelect?: (problem: ProblemNode | null) => void;
  onGraphUpdate?: (data: { nodes: number; links: number }) => void;
  autoUpdate?: boolean;
  width?: number;
  height?: number;
}

const LocationGraph3D = forwardRef<LocationGraphHandle, LocationGraph3DProps>(
  ({ locationId, graphData, onProblemSelect, onGraphUpdate, autoUpdate = true, width, height }, ref) => {
    const fgRef = useRef<any>(undefined);
    const converted = useMemo(() => convertToGraphData(graphData), [graphData]);
    const onGraphUpdateRef = useRef(onGraphUpdate);
    const [graphNodes, setGraphNodes] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>(() => converted);
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
    const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set());
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
    const [dimensions, setDimensions] = useState({
      w: width || (typeof window !== 'undefined' ? window.innerWidth : 1200),
      h: height || (typeof window !== 'undefined' ? window.innerHeight : 800),
    });

    // Update ref when callback changes
    useEffect(() => {
      onGraphUpdateRef.current = onGraphUpdate;
    }, [onGraphUpdate]);

    // Update graph when converted data changes
    useEffect(() => {
      setGraphNodes(converted);
      onGraphUpdateRef.current?.({ nodes: converted.nodes.length, links: converted.links.length });
    }, [converted]);

    // ── Neighbor map ───────────────────────────────────────────────────

    const neighborMap = useMemo(() => {
      const neighbors = new Map<string, Set<string>>();
      const nodeLinks = new Map<string, Set<GraphLink>>();
      graphNodes.nodes.forEach((n) => {
        neighbors.set(n.id, new Set());
        nodeLinks.set(n.id, new Set());
      });
      graphNodes.links.forEach((link) => {
        const s = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
        const t = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
        neighbors.get(s)?.add(t);
        neighbors.get(t)?.add(s);
        nodeLinks.get(s)?.add(link);
        nodeLinks.get(t)?.add(link);
      });
      return { neighbors, nodeLinks };
    }, [graphNodes]);

    // ── Expose handle to parent ────────────────────────────────────────

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

      setTimeout(() => {
        const controls = fg.controls();
        if (controls) {
          if (controls.target) controls.target.set(nx, ny, nz);
          if ('zoomSpeed' in controls) controls.zoomSpeed = 3.0;
          if ('dynamicDampingFactor' in controls) controls.dynamicDampingFactor = 0.2;
          controls.update?.();
        }
      }, duration + 50);
    }, []);

    useImperativeHandle(ref, () => ({
      navigateToNode(nodeId: string) {
        const node = graphNodes.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const hn = new Set<string>([nodeId]);
        neighborMap.neighbors.get(nodeId)?.forEach((id) => hn.add(id));
        const hl = new Set<GraphLink>();
        neighborMap.nodeLinks.get(nodeId)?.forEach((l) => hl.add(l));
        setHighlightNodes(hn);
        setHighlightLinks(hl);

        flyToNode(node, 1000);
        const problem = graphData.problems.find((p) => p.id === nodeId);
        if (problem) onProblemSelect?.(problem);
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
        return { nodes: graphNodes.nodes.length, links: graphNodes.links.length };
      },
    }), [graphNodes, neighborMap, onProblemSelect, flyToNode, graphData]);

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

    // ── Scene + camera + forces ────────────────────────────────────────

    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;

      fg.cameraPosition({ x: 0, y: 0, z: 300 });

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
        const problem = graphData.problems.find((p) => p.id === node.id);
        if (problem) onProblemSelect?.(problem);
      },
      [onProblemSelect, graphData],
    );

    const handleBgClick = useCallback(() => {
      onProblemSelect?.(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }, [onProblemSelect]);

    // ── Custom node objects ──────────────────────────────────────────────

    const nodeThreeObject = useCallback(
      (node: GraphNode) => {
        const group = new THREE.Group();
        const isHl = highlightNodes.has(node.id);
        const isHover = hoverNode?.id === node.id;
        const color = node.color || PROBLEM_CATEGORY_COLORS[node.category];

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

        // Threat wireframe for critical/high
        if (node.severity === 'critical' || node.severity === 'high') {
          const edges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(r * 1.5));
          group.add(
            new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: new THREE.Color(THREAT_COLORS[node.severity as keyof typeof THREAT_COLORS]), transparent: true, opacity: 0.4 })),
          );
        }

        // Labels
        if (isHl) {
          const label = createTextSprite(node.name, isHover ? '#fff' : color, 2.4);
          label.position.set(0, r + 5, 0);
          group.add(label);

          const tag = createTextSprite(PROBLEM_CATEGORY_LABELS[node.category], color, 1.6);
          tag.position.set(0, r + 8, 0);
          group.add(tag);
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
      (link: GraphLink) => (highlightLinks.has(link) ? 5 : 0),
      [highlightLinks],
    );

    // ── Render ─────────────────────────────────────────────────────────

    return (
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={graphNodes}
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

LocationGraph3D.displayName = 'LocationGraph3D';

export default LocationGraph3D;
