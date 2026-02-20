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
  type LocationGraph,
  PROBLEM_CATEGORY_COLORS,
  PROBLEM_CATEGORY_LABELS,
} from '@/data/locationGraphs';


// ── Sprite text label ──────────────────────────────────────────────────────

function createTextSprite(text: string, color: string, size = 3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 128;
  ctx.font = `700 ${Math.round(size * 16)}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.substring(0, 26), canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 1.0 }),
  );
  sprite.scale.set(size * 12, size * 1.5, 1);
  return sprite;
}

// ── Internal graph types ────────────────────────────────────────────────────

interface GNode {
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

interface GLink {
  source: string | GNode;
  target: string | GNode;
  label: string;
  color: string;
  strength: number;
  particles?: number;
}

function convertToGraphData(graph: LocationGraph): { nodes: GNode[]; links: GLink[] } {
  const nodes: GNode[] = graph.problems.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    severity: p.severity,
    val: p.severity === 'critical' ? 20 : p.severity === 'high' ? 15 : p.severity === 'elevated' ? 12 : 10,
    color: PROBLEM_CATEGORY_COLORS[p.category],
  }));

  const nodeIds = new Set(nodes.map((n) => n.id));

  const links: GLink[] = graph.links
    .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      label: l.label,
      color: l.type === 'causes' ? '#ff4d6a' : l.type === 'amplifies' ? '#ffaa00' : l.type === 'correlates' ? '#3b82f6' : '#00d4ff',
      strength: l.strength,
      particles: l.type === 'causes' ? 3 : l.type === 'amplifies' ? 2 : 1,
    }));

  return { nodes, links };
}

// ── Public handle ──────────────────────────────────────────────────────────

export interface LocationGraphHandle {
  navigateToNode: (nodeId: string) => void;
  resetView: () => void;
  getGraphData: () => { nodes: number; links: number };
}

interface Props {
  locationId: string;
  graphData: LocationGraph;
  onProblemSelect?: (problem: ProblemNode | null) => void;
  onGraphUpdate?: (data: { nodes: number; links: number }) => void;
  autoUpdate?: boolean;
  transparentBg?: boolean;
}

const LocationGraph3D = forwardRef<LocationGraphHandle, Props>(
  ({ graphData, onProblemSelect, onGraphUpdate, autoUpdate = true, transparentBg = false }, ref) => {
    const fgRef = useRef<any>(undefined);
    const converted = useMemo(() => convertToGraphData(graphData), [graphData]);
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
    const [highlightLinks, setHighlightLinks] = useState<Set<GLink>>(new Set());
    const [hoverNode, setHoverNode] = useState<GNode | null>(null);
    const [dimensions, setDimensions] = useState({
      w: typeof window !== 'undefined' ? window.innerWidth : 1200,
      h: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    // Report stats on mount
    useEffect(() => {
      onGraphUpdate?.({ nodes: converted.nodes.length, links: converted.links.length });
    }, [converted, onGraphUpdate]);

    // ── Neighbor map ───────────────────────────────────────────────────

    const neighborMap = useMemo(() => {
      const neighbors = new Map<string, Set<string>>();
      const nodeLinks = new Map<string, Set<GLink>>();
      converted.nodes.forEach((n) => {
        neighbors.set(n.id, new Set());
        nodeLinks.set(n.id, new Set());
      });
      converted.links.forEach((link) => {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        neighbors.get(s)?.add(t);
        neighbors.get(t)?.add(s);
        nodeLinks.get(s)?.add(link);
        nodeLinks.get(t)?.add(link);
      });
      return { neighbors, nodeLinks };
    }, [converted]);

    // ── Camera fly helper ──────────────────────────────────────────────

    const flyToNode = useCallback((node: GNode, duration = 800) => {
      const fg = fgRef.current;
      if (!fg) return;
      const nx = node.x || 0, ny = node.y || 0, nz = node.z || 0;
      const dist = 120;
      const hyp = Math.hypot(nx, ny, nz) || 1;
      const r = 1 + dist / hyp;

      fg.cameraPosition({ x: nx * r, y: ny * r, z: nz * r }, { x: nx, y: ny, z: nz }, duration);

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

    // ── Handle ─────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      navigateToNode(nodeId: string) {
        const node = converted.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const hn = new Set<string>([nodeId]);
        neighborMap.neighbors.get(nodeId)?.forEach((id) => hn.add(id));
        const hl = new Set<GLink>();
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
        fg.cameraPosition({ x: 0, y: 0, z: 350 }, { x: 0, y: 0, z: 0 }, 600);
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
        return { nodes: converted.nodes.length, links: converted.links.length };
      },
    }), [converted, neighborMap, onProblemSelect, flyToNode, graphData]);

    // ── Resize ─────────────────────────────────────────────────────────

    useEffect(() => {
      const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Scene setup ────────────────────────────────────────────────────

    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;

      fg.cameraPosition({ x: 0, y: 0, z: 350 });

      const controls = fg.controls();
      if (controls) {
        controls.zoomSpeed = 1.5;
        controls.rotateSpeed = 2.0;
        controls.noPan = false;
        if ('minDistance' in controls) controls.minDistance = 10;
        if ('maxDistance' in controls) controls.maxDistance = 1000;
      }

      const scene = fg.scene();
      scene.fog = new THREE.FogExp2(0x06070a, 0.0004);
      scene.background = new THREE.Color(0x06070a);
      scene.add(new THREE.AmbientLight(0x334455, 0.4));

      fg.d3Force('charge').strength(-120).distanceMax(350);
      fg.d3Force('link').distance(60).strength(0.15);
      fg.d3Force('center').strength(0.04);
    }, []);

    // ── Toggle transparent background ─────────────────────────────────

    useEffect(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const scene = fg.scene();
      const renderer = fg.renderer();
      if (transparentBg) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
      } else {
        scene.background = new THREE.Color(0x06070a);
        renderer.setClearColor(0x06070a, 1);
      }
    }, [transparentBg]);

    // ── Hover ──────────────────────────────────────────────────────────

    const handleNodeHover = useCallback((node: GNode | null) => {
      const hn = new Set<string>();
      const hl = new Set<GLink>();
      if (node) {
        hn.add(node.id);
        neighborMap.neighbors.get(node.id)?.forEach((id) => hn.add(id));
        neighborMap.nodeLinks.get(node.id)?.forEach((l) => hl.add(l));
      }
      setHighlightNodes(hn);
      setHighlightLinks(hl);
      setHoverNode(node);
    }, [neighborMap]);

    // ── Click ──────────────────────────────────────────────────────────

    const handleNodeClick = useCallback((node: GNode) => {
      const problem = graphData.problems.find((p) => p.id === node.id);
      if (problem) onProblemSelect?.(problem);
    }, [onProblemSelect, graphData]);

    const handleBgClick = useCallback(() => {
      onProblemSelect?.(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }, [onProblemSelect]);

    // ── Custom node objects ──────────────────────────────────────────────

    const nodeThreeObject = useCallback((node: GNode) => {
      const group = new THREE.Group();
      const isHl = highlightNodes.has(node.id);
      const isHover = hoverNode?.id === node.id;
      const color = node.color;
      const base = Math.cbrt(node.val) * 2.2;
      const r = isHover ? base * 1.3 : base;

      // Core star
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 20, 20),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: isHl ? 1.0 : 0.9,
        }),
      ));

      // Soft glow shell
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(r * 2.2, 14, 14),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: isHl ? 0.22 : 0.1, side: THREE.BackSide }),
      ));

      // Star-point cross (constellation sparkle)
      const armLen = r * 2.8;
      const armGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-armLen, 0, 0), new THREE.Vector3(armLen, 0, 0),
        new THREE.Vector3(0, -armLen, 0), new THREE.Vector3(0, armLen, 0),
      ]);
      armGeo.setIndex([0, 1, 2, 3]);
      group.add(new THREE.LineSegments(
        armGeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: isHl ? 0.5 : 0.25 }),
      ));

      // Always show label — name (large and readable)
      const label = createTextSprite(node.name, isHover ? '#ffffff' : color, isHl ? 4.5 : 3.5);
      label.position.set(0, r + 8, 0);
      group.add(label);

      // Category tag (always visible)
      const tag = createTextSprite(PROBLEM_CATEGORY_LABELS[node.category], color, isHl ? 3.0 : 2.2);
      tag.position.set(0, r + 14, 0);
      tag.material.opacity = isHl ? 0.9 : 0.55;
      group.add(tag);

      return group;
    }, [highlightNodes, hoverNode]);

    // ── Link accessors ─────────────────────────────────────────────────

    const linkColor = useCallback((link: GLink) => highlightLinks.has(link) ? '#00d4ff' : 'rgba(255,255,255,0.15)', [highlightLinks]);
    const linkWidth = useCallback((link: GLink) => highlightLinks.has(link) ? 0.8 : 0.15, [highlightLinks]);
    const linkParticles = useCallback((link: GLink) => highlightLinks.has(link) ? 3 : (link.particles || 0), [highlightLinks]);

    return (
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={converted}
        nodeThreeObject={nodeThreeObject as any}
        nodeThreeObjectExtend={false}
        nodeResolution={20}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.25}
        linkCurvature={0.08}
        linkDirectionalParticles={linkParticles}
        linkDirectionalParticleWidth={0.8}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => '#00d4ff'}
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
        backgroundColor="#0a0e1a"
      />
    );
  },
);

LocationGraph3D.displayName = 'LocationGraph3D';

export default LocationGraph3D;
