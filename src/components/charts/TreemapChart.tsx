import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TreeNode } from "../../types/scan";
import { formatBytes, getCategoryColor } from "../../utils/formatters";

interface TreemapChartProps {
  data: TreeNode;
  onSelectNode?: (node: TreeNode) => void;
  onRevealInFinder?: (path: string) => void;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({
  data,
  onSelectNode,
  onRevealInFinder,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentNode, setCurrentNode] = useState<TreeNode>(data);
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    setCurrentNode(data);
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || !currentNode) return;

    const width = containerRef.current.clientWidth || 700;
    const height = 480;

    d3.select(containerRef.current).select("svg").remove();

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .attr("class", "rounded-xl overflow-hidden");

    const hierarchy = d3
      .hierarchy(currentNode)
      .sum((d) => (d.is_dir ? 0 : Number(d.size_bytes)))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemap = d3
      .treemap<TreeNode>()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true);

    const root = treemap(hierarchy);

    const leaf = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    leaf
      .append("rect")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d) => getCategoryColor(d.data.category || "Other"))
      .attr("fill-opacity", 0.75)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => setHoveredNode(d.data))
      .on("mouseleave", () => setHoveredNode(null))
      .on("click", (_, d) => {
        if (d.data.is_dir) {
          setCurrentNode(d.data);
          onSelectNode?.(d.data);
        } else if (d.parent?.data) {
          setCurrentNode(d.parent.data);
          onSelectNode?.(d.parent.data);
        }
      });

    leaf
      .append("text")
      .attr("x", 6)
      .attr("y", 16)
      .text((d) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        return w > 50 && h > 25 ? d.data.name : "";
      })
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#FFFFFF")
      .style("pointer-events", "none");

    leaf
      .append("text")
      .attr("x", 6)
      .attr("y", 30)
      .text((d) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        return w > 60 && h > 40 ? formatBytes(Number(d.value || d.data.size_bytes)) : "";
      })
      .attr("font-size", "10px")
      .attr("fill", "rgba(255,255,255,0.8)")
      .style("pointer-events", "none");
  }, [currentNode, onSelectNode]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Breadcrumb back navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Current:
          </span>
          <span className="truncate max-w-md">{currentNode.path}</span>
        </div>
        {currentNode.path !== data.path && (
          <button
            onClick={() => setCurrentNode(data)}
            className="text-accent hover:underline text-xs font-medium"
          >
            Reset to Root
          </button>
        )}
      </div>

      <div ref={containerRef} className="w-full min-h-[480px] relative" />

      {hoveredNode && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-2.5 flex items-center justify-between text-xs shadow-sm">
          <div className="truncate max-w-md">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {hoveredNode.name}
            </span>{" "}
            <span className="text-slate-400">({hoveredNode.category})</span>
            <div className="text-[11px] text-slate-400 truncate">
              {hoveredNode.path}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-accent">
              {formatBytes(Number(hoveredNode.size_bytes))}
            </span>
            {onRevealInFinder && (
              <button
                onClick={() => onRevealInFinder(hoveredNode.path)}
                className="text-xs text-slate-500 hover:text-accent underline"
              >
                Finder
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

