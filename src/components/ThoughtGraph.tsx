"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

// Canvas/d3 based; must not render on the server.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNode = { id: string; title: string };
type GraphLink = { id: string; source: string; target: string; kind: "INLINE" | "MANUAL"; label: string | null };

export function ThoughtGraph() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);

  useEffect(() => {
    api<{ nodes: GraphNode[]; links: GraphLink[] }>("/api/thoughts/graph").then(setData);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white">
      {data && data.nodes.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-neutral-400">
          No thoughts yet — create a few and link them with [[ ]].
        </p>
      )}
      {data && size.width > 0 && (
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={data}
          nodeId="id"
          nodeLabel="title"
          linkLabel={(l) => (l as GraphLink).label ?? ""}
          linkColor={(l) => ((l as GraphLink).kind === "MANUAL" ? "#d97706" : "#cbd5e1")}
          linkLineDash={(l) => ((l as GraphLink).kind === "MANUAL" ? [4, 2] : null)}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(n) => router.push(`/thoughts/${(n as GraphNode).id}`)}
          nodeCanvasObject={(node, ctx, scale) => {
            const n = node as GraphNode & { x: number; y: number };
            ctx.beginPath();
            ctx.arc(n.x, n.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#f59e0b";
            ctx.fill();
            const fontSize = 12 / scale;
            ctx.font = `${fontSize}px Lato, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#404040";
            ctx.fillText(n.title, n.x, n.y + 6 + fontSize);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as { x: number; y: number };
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      )}
    </div>
  );
}
