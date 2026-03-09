import { useDiagram } from "../hooks/useDiagram";

const getPortCoords = (nodeId, portType, portIndex, nodes, nodeDimensions) => {
    const node = nodes.find((n) => n.id === nodeId);
    const dim = nodeDimensions[nodeId];
    if (!node || !dim) return null;

    if (portType === "in") {
        return { x: node.x + dim.w / 2, y: node.y, dir: "up" };
    } else {
        const outCount = node.data.outPorts || 1;
        const spacing = dim.w / (outCount + 1);
        return {
            x: node.x + spacing * (portIndex + 1),
            y: node.y + dim.h,
            dir: "down",
        };
    }
};

const generatePathPoints = (start, end) => {
    const pts = [start];
    const A = {
        x: start.x,
        y: start.dir === "down" ? start.y + 20 : start.y - 20,
    };
    const B = { x: end.x, y: end.dir === "down" ? end.y + 20 : end.y - 20 };
    pts.push(A);

    const dx = B.x - A.x;
    const dy = B.y - A.y;

    if (start.dir === "down" && end.dir === "up") {
        if (dy >= 0) {
            const minD = Math.min(Math.abs(dx), Math.abs(dy));
            const C = { x: A.x + minD * Math.sign(dx), y: A.y + minD };
            pts.push(C);
            pts.push(B);
        } else {
            const midX = A.x + dx / 2;
            pts.push({ x: A.x, y: A.y + 20 });
            pts.push({ x: midX, y: A.y + 20 });
            pts.push({ x: midX, y: B.y - 20 });
            pts.push({ x: B.x, y: B.y - 20 });
            pts.push(B);
        }
    } else {
        const midY = (A.y + B.y) / 2;
        pts.push({ x: A.x, y: midY });
        pts.push({ x: B.x, y: midY });
        pts.push(B);
    }

    pts.push(end);
    return pts;
};

const roundPolyline = (points, radius = 12) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        let dx1 = prev.x - curr.x;
        let dy1 = prev.y - curr.y;
        let len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        let dx2 = next.x - curr.x;
        let dy2 = next.y - curr.y;
        let len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        let r = Math.min(radius, len1 / 2, len2 / 2);

        if (r > 0) {
            let startX = curr.x + (dx1 / len1) * r;
            let startY = curr.y + (dy1 / len1) * r;
            let endX = curr.x + (dx2 / len2) * r;
            let endY = curr.y + (dy2 / len2) * r;

            d += ` L ${startX} ${startY}`;
            d += ` Q ${curr.x} ${curr.y}, ${endX} ${endY}`;
        } else {
            d += ` L ${curr.x} ${curr.y}`;
        }
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return d;
};

const renderPath = (start, end, isTemporary = false) => {
    const points = generatePathPoints(start, end);
    const pathData = roundPolyline(points);

    return (
        <path
            d={pathData}
            fill="none"
            stroke={isTemporary ? "#06b6d4" : "#3b82f6"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6, 6"
            className="animate-[dash_1s_linear_infinite] opacity-70 hover:opacity-100 hover:stroke-cyan-400 hover:stroke-[3.5px] cursor-pointer pointer-events-auto"
        />
    );
};

export const Connections = () => {
    const {
        nodes,
        edges,
        nodeDimensions,
        connectingFrom,
        mousePos,
        deleteEdge,
    } = useDiagram();

    return (
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
            <defs>
                <style>
                    {`@keyframes dash { to { stroke-dashoffset: -12; } }`}
                </style>
            </defs>

            {edges.map((edge) => {
                const start = getPortCoords(
                    edge.sourceNode,
                    edge.sourceType,
                    edge.sourceIndex,
                    nodes,
                    nodeDimensions,
                );
                const end = getPortCoords(
                    edge.targetNode,
                    edge.targetType,
                    edge.targetIndex,
                    nodes,
                    nodeDimensions,
                );
                if (!start || !end) return null;

                const pathData = roundPolyline(generatePathPoints(start, end));

                return (
                    <g
                        key={edge.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteEdge(edge.id);
                        }}
                    >
                        <path
                            d={pathData}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="20"
                            className="pointer-events-auto cursor-crosshair"
                        />
                        {renderPath(start, end)}
                    </g>
                );
            })}

            {connectingFrom &&
                (() => {
                    const start = getPortCoords(
                        connectingFrom.nodeId,
                        connectingFrom.type,
                        connectingFrom.index,
                        nodes,
                        nodeDimensions,
                    );
                    if (!start) return null;
                    const end = {
                        x: mousePos.x,
                        y: mousePos.y,
                        dir: connectingFrom.type === "out" ? "up" : "down",
                    };
                    return renderPath(start, end, true);
                })()}
        </svg>
    );
};
