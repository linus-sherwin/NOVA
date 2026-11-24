import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TreeNode } from "../../types/scan";
import { formatBytes, getCategoryColor } from "../../utils/formatters";

interface SunburstChartProps {
  data: TreeNode;
  onSelectNode?: (node: TreeNode) => void;
  onRevealInFinder?: (path: string) => void;
}

interface ExtendedHierarchyNode extends d3.HierarchyRectangularNode<TreeNode> {
  current?: any;
  target?: any;
}

export const SunburstChart: React.FC<SunburstChartProps> = ({
  data,
  onSelectNode,
  onRevealInFinder,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ExtendedHierarchyNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 640;
    const height = 640;
    const radius = width / 6;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare D3 hierarchy
    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => (d.is_dir ? 0 : Number(d.size_bytes)))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Partition
    const partition = d3.partition<TreeNode>().size([2 * Math.PI, hierarchy.height + 1]);
    const root = partition(hierarchy) as ExtendedHierarchyNode;
    root.each((d: ExtendedHierarchyNode) => {
      d.current = d;
    });

    const arc = d3
      .arc<ExtendedHierarchyNode>()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d.y0 * radius)
      .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const path = g
      .append("g")
      .selectAll("path")
      .data(root.descendants().slice(1) as ExtendedHierarchyNode[])
      .join("path")
      .attr("fill", (d) => {
        let curr: any = d;
        while (curr.depth > 1 && curr.parent) curr = curr.parent;
        return getCategoryColor(curr.data.category || "Other");
      })
      .attr("fill-opacity", (d: any) =>
        arcVisible(d.current) ? (d.children ? 0.75 : 0.5) : 0,
      )
      .attr("pointer-events", (d: any) => (arcVisible(d.current) ? "auto" : "none"))
      .attr("d", (d: any) => arc(d.current) || "")
      .style("cursor", "pointer")
      .on("mouseenter", (_, d) => {
        setHoveredNode(d);
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
      })
      .on("click", (event, p) => {
        event.stopPropagation();
        if (onSelectNode) {
          onSelectNode(p.data);
        }
        clicked(p);
      });

    // Center circle for navigating back up or current focal node
    const parentCircle = g
      .append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "transparent")
      .attr("pointer-events", "all")
      .style("cursor", "pointer")
      .on("click", () => clicked(root));

    function clicked(p: ExtendedHierarchyNode) {
      parentCircle.datum(p.parent || root);

      root.each((d: ExtendedHierarchyNode) => {
        d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        };
      });

      const t = g.transition().duration(750);

      path
        .transition(t as any)
        .tween("data", (d: any) => {
          const i = d3.interpolate(d.current, d.target);
          return (time) => {
            d.current = i(time);
          };
        })
        .filter(function (this: any, d: any) {
          const opacity = +this.getAttribute("fill-opacity");
          return Boolean(opacity || arcVisible(d.target));
        })
        .attr("fill-opacity", (d: any) =>
          arcVisible(d.target) ? (d.children ? 0.75 : 0.5) : 0,
        )
        .attr("pointer-events", (d: any) =>
          arcVisible(d.target) ? "auto" : "none",
        )
        .attrTween("d", (d: any) => () => arc(d.current) || "");
    }

    function arcVisible(d: any) {
      return Boolean(d && d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0);
    }
  }, [data, onSelectNode]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 640 640"
          className="w-[540px] h-[540px] drop-shadow-md select-none"
        />

        {/* Center Root Information Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
          <div className="max-w-[160px] truncate font-medium text-xs text-slate-400 dark:text-slate-400">
            {hoveredNode ? hoveredNode.data.name : data.name}
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {formatBytes(
              hoveredNode
                ? Number(hoveredNode.value || hoveredNode.data.size_bytes)
                : Number(data.size_bytes),
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {hoveredNode
              ? hoveredNode.data.is_dir
                ? `${hoveredNode.data.file_count || 0} items`
                : hoveredNode.data.category
              : `${data.file_count || 0} items`}
          </div>
        </div>
      </div>

      {/* Floating Hover Details Card */}
      {hoveredNode && (
        <div className="mt-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 shadow-glass flex items-center gap-4 text-xs animate-in fade-in duration-150">
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {hoveredNode.data.name}
            </div>
            <div className="text-slate-400 truncate max-w-sm">
              {hoveredNode.data.path}
            </div>
          </div>
          <div className="text-right pl-4 border-l border-border-light dark:border-border-dark">
            <div className="font-semibold text-accent">
              {formatBytes(Number(hoveredNode.value || hoveredNode.data.size_bytes))}
            </div>
            <div className="text-slate-400">
              {(
                ((hoveredNode.value || 0) / (data.size_bytes as number || 1)) *
                100
              ).toFixed(1)}
              % of total
            </div>
          </div>
          {onRevealInFinder && (
            <button
              onClick={() => onRevealInFinder(hoveredNode.data.path)}
              className="ml-2 text-xs text-slate-500 hover:text-accent underline"
            >
              Finder
            </button>
          )}
        </div>
      )}
    </div>
  );
};
