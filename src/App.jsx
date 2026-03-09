import React, {
    useState,
    createContext,
    useContext,
    useCallback,
    useRef,
    useEffect,
} from "react";
import {
    Server,
    Router,
    SwitchCamera,
    Cpu,
    HardDrive,
    Wifi,
    BatteryCharging,
    Plug,
    Trash2,
    Plus,
    Box,
    Maximize,
    Menu,
    Monitor,
    Layers,
} from "lucide-react";

// --- CONFIG & UTILS ---

const NODE_COLORS = {
    router: "border-t-fuchsia-500 shadow-[0_-5px_15px_rgba(217,70,239,0.15)]",
    switch: "border-t-blue-500 shadow-[0_-5px_15px_rgba(59,130,246,0.15)]",
    server: "border-t-cyan-500 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]",
    ap: "border-t-amber-500 shadow-[0_-5px_15px_rgba(245,158,11,0.15)]",
    pc: "border-t-cyan-400 shadow-[0_-5px_15px_rgba(34,211,238,0.15)]",
    mini_pc: "border-t-blue-400 shadow-[0_-5px_15px_rgba(96,165,250,0.15)]",
    sbc: "border-t-emerald-500 shadow-[0_-5px_15px_rgba(16,185,129,0.15)]",
    nas: "border-t-teal-400 shadow-[0_-5px_15px_rgba(45,212,191,0.15)]",
    default: "border-t-slate-600 shadow-[0_-5px_15px_rgba(71,85,105,0.15)]",
};

const ICON_COLORS = {
    router: "text-fuchsia-500",
    switch: "text-blue-500",
    server: "text-orange-500",
    pc: "text-cyan-400",
    mini_pc: "text-blue-400",
    sbc: "text-emerald-500",
    nas: "text-teal-400",
    disk: "text-slate-400",
    ap: "text-amber-500",
    gpu: "text-pink-500",
    hba: "text-purple-500",
    ups: "text-lime-500",
    container: "text-blue-400",
};

const ICONS = {
    router: Router,
    switch: SwitchCamera,
    server: Server,
    pc: Monitor,
    mini_pc: Monitor,
    sbc: Cpu,
    nas: HardDrive,
    disk: HardDrive,
    ap: Wifi,
    gpu: Layers,
    hba: Plug,
    ups: BatteryCharging,
    container: Box,
};

// Initial JSON State representing the map
const initialData = {
    mapTitle: "MyHomelab",
    nodes: [
        {
            id: "router-1",
            type: "router",
            x: 400,
            y: 50,
            data: {
                name: "Main Router",
                subtitle: "",
                ip: "192.168.1.1",
                outPorts: 4,
                specs: [],
                components: [],
            },
        },
        {
            id: "switch-1",
            type: "switch",
            x: 400,
            y: 250,
            data: {
                name: "Core Switch",
                subtitle: "",
                ip: "192.168.1.10",
                outPorts: 8,
                specs: [],
                components: [],
            },
        },
        {
            id: "server-1",
            type: "server",
            x: 100,
            y: 400,
            data: {
                name: "Proxmox-NAS",
                subtitle: "Lenovo M920q",
                ip: "192.168.1.180",
                specs: ["6 Cores", "16GB RAM", "256GB Disk"],
                outPorts: 1,
                components: [
                    { id: "comp-1", type: "hba", name: "HBA to disks" },
                    { id: "comp-2", type: "disk", name: '2.5" Disk 1' },
                    { id: "comp-3", type: "disk", name: '2.5" Disk 2' },
                    { id: "comp-4", type: "disk", name: '2.5" Disk 3' },
                    { id: "comp-5", type: "disk", name: '2.5" Disk 4' },
                ],
                subItems: [
                    {
                        id: "sub-1",
                        name: "Immich",
                        ip: "192.168.1.3",
                        type: "container",
                    },
                    {
                        id: "sub-2",
                        name: "Jellyfin",
                        ip: "192.168.1.4",
                        type: "container",
                    },
                    {
                        id: "sub-3",
                        name: "Nextcloud",
                        ip: "192.168.1.5",
                        type: "container",
                    },
                ],
            },
        },
        {
            id: "server-2",
            type: "server",
            x: 700,
            y: 400,
            data: {
                name: "Raspberry Pi 4",
                subtitle: "Raspberry Pi 4 (4GB BCM2711)",
                ip: "192.168.1.200",
                specs: ["4 Cores", "4GB RAM"],
                outPorts: 1,
                components: [],
                subItems: [
                    {
                        id: "sub-4",
                        name: "Uptime Kuma",
                        ip: "192.168.1.181",
                        type: "container",
                    },
                    {
                        id: "sub-5",
                        name: "Grafana",
                        ip: "192.168.1.182",
                        type: "container",
                    },
                    {
                        id: "sub-6",
                        name: "Pi-hole",
                        ip: "192.168.1.183",
                        type: "container",
                    },
                ],
            },
        },
    ],
    edges: [
        {
            id: "e1",
            sourceNode: "router-1",
            sourceType: "out",
            sourceIndex: 1,
            targetNode: "switch-1",
            targetType: "in",
            targetIndex: 0,
        },
        {
            id: "e2",
            sourceNode: "switch-1",
            sourceType: "out",
            sourceIndex: 1,
            targetNode: "server-1",
            targetType: "in",
            targetIndex: 0,
        },
        {
            id: "e3",
            sourceNode: "switch-1",
            sourceType: "out",
            sourceIndex: 6,
            targetNode: "server-2",
            targetType: "in",
            targetIndex: 0,
        },
    ],
};

// --- CONTEXT ---

const DiagramContext = createContext();

const DiagramProvider = ({ children }) => {
    const [mapTitle, setMapTitle] = useState(initialData.mapTitle);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [nodes, setNodes] = useState(initialData.nodes);
    const [edges, setEdges] = useState(initialData.edges);
    const [nodeDimensions, setNodeDimensions] = useState({});

    // Canvas Viewport State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef(null);

    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [connectingFrom, setConnectingFrom] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Convert screen coordinates to internal scaled workspace coordinates
    const screenToWorkspace = useCallback(
        (clientX, clientY) => {
            if (!canvasRef.current) return { x: 0, y: 0 };
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                x: (clientX - rect.left - pan.x) / zoom,
                y: (clientY - rect.top - pan.y) / zoom,
            };
        },
        [pan, zoom],
    );

    const updateNodePosition = useCallback((id, x, y) => {
        setNodes((prev) =>
            prev.map((node) => (node.id === id ? { ...node, x, y } : node)),
        );
    }, []);

    const updateNodeDimensions = useCallback((id, width, height) => {
        setNodeDimensions((prev) => {
            const current = prev[id];
            if (current && current.w === width && current.h === height)
                return prev;
            return { ...prev, [id]: { w: width, h: height } };
        });
    }, []);

    const startConnection = (nodeId, type, index) => {
        setConnectingFrom({ nodeId, type, index });
    };

    const completeConnection = (targetNodeId, targetType, targetIndex) => {
        if (
            connectingFrom &&
            (connectingFrom.nodeId !== targetNodeId ||
                connectingFrom.type !== targetType)
        ) {
            const edgeExists = edges.some(
                (e) =>
                    e.sourceNode === connectingFrom.nodeId &&
                    e.sourceType === connectingFrom.type &&
                    e.sourceIndex === connectingFrom.index &&
                    e.targetNode === targetNodeId &&
                    e.targetType === targetType &&
                    e.targetIndex === targetIndex,
            );

            if (!edgeExists) {
                setEdges((prev) => [
                    ...prev,
                    {
                        id: `e-${Date.now()}`,
                        sourceNode: connectingFrom.nodeId,
                        sourceType: connectingFrom.type,
                        sourceIndex: connectingFrom.index,
                        targetNode: targetNodeId,
                        targetType: targetType,
                        targetIndex: targetIndex,
                    },
                ]);
            }
        }
        setConnectingFrom(null);
    };

    const cancelConnection = () => {
        setConnectingFrom(null);
    };

    const addNode = useCallback((type, x, y) => {
        const defaultOutPorts =
            type === "switch" ? 8 : type === "router" ? 4 : 1;
        const newNode = {
            id: `node-${Date.now()}`,
            type,
            x,
            y,
            data: {
                name: `New ${type}`,
                subtitle: "",
                ip: "0.0.0.0",
                outPorts: defaultOutPorts,
                subItems: [],
                components: [],
                specs: [],
            },
        };
        setNodes((prev) => [...prev, newNode]);
    }, []);

    const addNodeCentered = useCallback(
        (type) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const wsPos = screenToWorkspace(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
            );
            addNode(type, wsPos.x - 144, wsPos.y - 100);
        },
        [screenToWorkspace, addNode],
    );

    const deleteNode = (id) => {
        setNodes((prev) => prev.filter((n) => n.id !== id));
        setEdges((prev) =>
            prev.filter((e) => e.sourceNode !== id && e.targetNode !== id),
        );
    };

    const deleteEdge = (id) => {
        setEdges((prev) => prev.filter((e) => e.id !== id));
    };

    const addSubItem = (nodeId, itemData) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            subItems: [
                                ...(node.data.subItems || []),
                                { id: `sub-${Date.now()}`, ...itemData },
                            ],
                        },
                    };
                }
                return node;
            }),
        );
    };

    // --- NESTED COMPONENTS LOGIC ---
    const addNestedComponent = useCallback((nodeId, type) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    const typeLabel =
                        type.charAt(0).toUpperCase() + type.slice(1);
                    const newComp = {
                        id: `comp-${Date.now()}`,
                        type,
                        name: `New ${typeLabel}`,
                    };
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            components: [
                                ...(node.data.components || []),
                                newComp,
                            ],
                        },
                    };
                }
                return node;
            }),
        );
    }, []);

    const updateNestedComponent = useCallback((nodeId, compId, newData) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            components: (node.data.components || []).map(
                                (comp) =>
                                    comp.id === compId
                                        ? { ...comp, ...newData }
                                        : comp,
                            ),
                        },
                    };
                }
                return node;
            }),
        );
    }, []);

    const deleteNestedComponent = useCallback((nodeId, compId) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            components: (node.data.components || []).filter(
                                (comp) => comp.id !== compId,
                            ),
                        },
                    };
                }
                return node;
            }),
        );
    }, []);

    const deleteSubItem = useCallback((nodeId, subId) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            subItems: (node.data.subItems || []).filter(
                                (comp) => comp.id !== subId,
                            ),
                        },
                    };
                }
                return node;
            }),
        );
    }, []);

    const updateNodeData = useCallback((id, newData) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            }),
        );
    }, []);

    const updateSubItemData = useCallback((nodeId, subItemId, newData) => {
        setNodes((prev) =>
            prev.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            subItems: (node.data.subItems || []).map((item) =>
                                item.id === subItemId
                                    ? { ...item, ...newData }
                                    : item,
                            ),
                        },
                    };
                }
                return node;
            }),
        );
    }, []);

    return (
        <DiagramContext.Provider
            value={{
                mapTitle,
                setMapTitle,
                isLibraryOpen,
                setIsLibraryOpen,
                nodes,
                edges,
                nodeDimensions,
                updateNodeDimensions,
                draggedNode,
                setDraggedNode,
                dragOffset,
                setDragOffset,
                updateNodePosition,
                connectingFrom,
                startConnection,
                completeConnection,
                cancelConnection,
                mousePos,
                setMousePos,
                addNode,
                addNodeCentered,
                deleteNode,
                deleteEdge,
                addSubItem,
                updateNodeData,
                updateSubItemData,
                addNestedComponent,
                updateNestedComponent,
                deleteNestedComponent,
                deleteSubItem,
                pan,
                setPan,
                zoom,
                setZoom,
                canvasRef,
                screenToWorkspace,
            }}
        >
            {children}
        </DiagramContext.Provider>
    );
};

const useDiagram = () => useContext(DiagramContext);

// --- COMPONENTS ---

// 1. Edges (SVG Lines)
const Connections = () => {
    const {
        nodes,
        edges,
        nodeDimensions,
        connectingFrom,
        mousePos,
        deleteEdge,
    } = useDiagram();

    const getPortCoords = (nodeId, portType, portIndex) => {
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
                className="animate-[dash_1s_linear_infinite] opacity-70 hover:opacity-100 hover:stroke-cyan-400 hover:stroke-[3.5px] transition-all cursor-pointer pointer-events-auto"
            />
        );
    };

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
                );
                const end = getPortCoords(
                    edge.targetNode,
                    edge.targetType,
                    edge.targetIndex,
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

// 2. Individual Node Component
const Node = ({ node }) => {
    const {
        setDraggedNode,
        setDragOffset,
        screenToWorkspace,
        connectingFrom,
        startConnection,
        completeConnection,
        deleteNode,
        addSubItem,
        updateNodeData,
        updateSubItemData,
        addNestedComponent,
        updateNestedComponent,
        deleteNestedComponent,
        deleteSubItem,
        updateNodeDimensions,
    } = useDiagram();

    const nodeRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        const el = nodeRef.current;
        if (!el) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                updateNodeDimensions(
                    node.id,
                    entry.target.offsetWidth,
                    entry.target.offsetHeight,
                );
            }
        });

        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [node.id, updateNodeDimensions]);

    const IconComponent = ICONS[node.type] || Server;
    const colorClass = NODE_COLORS[node.type] || NODE_COLORS.default;

    const handlePointerDown = (e) => {
        if (
            e.target.closest("button") ||
            e.target.closest("input") ||
            e.target.closest(".node-port")
        )
            return;

        e.preventDefault();
        e.stopPropagation();
        setDraggedNode(node.id);

        const wsPos = screenToWorkspace(e.clientX, e.clientY);
        setDragOffset({ x: wsPos.x - node.x, y: wsPos.y - node.y });
    };

    const handlePortClick = (type, index) => {
        if (connectingFrom) {
            if (
                connectingFrom.nodeId === node.id &&
                connectingFrom.type === type &&
                connectingFrom.index === index
            )
                return;
            completeConnection(node.id, type, index);
        } else {
            startConnection(node.id, type, index);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const type = e.dataTransfer.getData("nodeType");
        if (type) {
            addNestedComponent(node.id, type);
        }
    };

    const outPortsCount = node.data.outPorts || 1;

    return (
        <div
            ref={nodeRef}
            style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
            className={`absolute top-0 left-0 w-72 bg-slate-900 border border-slate-800 border-t-[3px] rounded-xl flex flex-col z-10 pointer-events-auto
        transition-shadow duration-300 cursor-grab active:cursor-grabbing
        ${colorClass} ${isDragOver ? "ring-2 ring-cyan-500 bg-slate-800" : ""}`}
            onPointerDown={handlePointerDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Top Port (In / WAN) */}
            <div className="absolute -top-3 left-0 w-full flex justify-center z-20">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePortClick("in", 0);
                    }}
                    className={`node-port w-5 h-5 rounded border-2 border-slate-900 bg-cyan-600 hover:bg-cyan-400 hover:scale-125 cursor-crosshair transition-all shadow-[0_0_10px_rgba(6,182,212,0.8)]
            ${connectingFrom?.nodeId === node.id && connectingFrom?.type === "in" ? "bg-white ring-2 ring-cyan-300 animate-pulse" : ""}`}
                    title="In / WAN Port"
                />
            </div>

            {/* Node Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50 rounded-t-xl mt-1">
                <div className="flex items-center gap-2 flex-1">
                    <IconComponent
                        size={18}
                        className="text-slate-300 shrink-0"
                    />
                    <input
                        value={node.data.name || ""}
                        onChange={(e) =>
                            updateNodeData(node.id, { name: e.target.value })
                        }
                        className="font-semibold text-slate-100 bg-transparent outline-none w-full focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500 rounded px-1 truncate transition-colors"
                        placeholder="Node Name"
                    />
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <div
                        className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                        title="Online"
                    />
                </div>
            </div>

            {/* Node Body */}
            <div className="p-4 pt-3 flex flex-col text-sm mb-2">
                {/* Subtitle / Model Info */}
                <div
                    className={`relative group transition-all duration-300 ease-in-out ${node.data.subtitle ? "mb-3" : "h-1.5 hover:h-6 hover:mb-3 focus-within:h-6 focus-within:mb-3"}`}
                >
                    <input
                        value={node.data.subtitle || ""}
                        onChange={(e) =>
                            updateNodeData(node.id, {
                                subtitle: e.target.value,
                            })
                        }
                        className={`w-full text-[11.5px] font-medium outline-none transition-all duration-300 rounded px-1
              ${
                  node.data.subtitle
                      ? "text-slate-500 bg-transparent hover:bg-slate-800/50 focus:bg-slate-800 focus:text-slate-300 -ml-1 py-0.5 relative"
                      : "absolute inset-0 h-full text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 py-0.5 bg-cyan-500/10 group-hover:bg-slate-800 focus:bg-slate-800 shadow-[0_0_8px_rgba(6,182,212,0)] group-hover:shadow-[0_0_8px_rgba(6,182,212,0.3)] focus:shadow-none cursor-text"
              }
            `}
                        placeholder="Add subtitle..."
                    />
                </div>

                <div className="flex flex-col gap-3">
                    {/* IP Line */}
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 focus-within:border-cyan-500/50 transition-colors">
                        <span className="text-slate-400 text-xs shrink-0">
                            IP:
                        </span>
                        <input
                            value={node.data.ip || ""}
                            onChange={(e) =>
                                updateNodeData(node.id, { ip: e.target.value })
                            }
                            className="font-mono text-cyan-400 bg-transparent outline-none w-full text-right focus:text-cyan-300 ml-2"
                            placeholder="0.0.0.0"
                        />
                    </div>

                    {/* Dynamic Specs Array */}
                    {["server", "pc", "mini_pc", "sbc", "nas"].includes(
                        node.type,
                    ) && (
                        <div className="flex flex-wrap items-center justify-start gap-0 mt-1">
                            {(node.data.specs || []).map((spec, idx) => (
                                <React.Fragment key={`spec-${idx}`}>
                                    <input
                                        value={spec}
                                        size={Math.max(1, spec.length)}
                                        onChange={(e) => {
                                            const newSpecs = [
                                                ...node.data.specs,
                                            ];
                                            newSpecs[idx] = e.target.value;
                                            updateNodeData(node.id, {
                                                specs: newSpecs,
                                            });
                                        }}
                                        onBlur={(e) => {
                                            if (!e.target.value.trim()) {
                                                const newSpecs =
                                                    node.data.specs.filter(
                                                        (_, i) => i !== idx,
                                                    );
                                                updateNodeData(node.id, {
                                                    specs: newSpecs,
                                                });
                                            }
                                        }}
                                        className="text-[11px] font-medium bg-slate-800/50 hover:bg-slate-700 focus:bg-slate-900 text-slate-300 rounded px-1.5 py-0.5 mb-1 outline-none transition-colors border border-transparent focus:border-cyan-500/50 text-center"
                                        placeholder="spec"
                                    />
                                    {idx <
                                        (node.data.specs || []).length - 1 && (
                                        <span className="text-slate-600 text-[10px] mx-1 font-bold">
                                            •
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newSpecs = [
                                        ...(node.data.specs || []),
                                        "",
                                    ];
                                    updateNodeData(node.id, {
                                        specs: newSpecs,
                                    });
                                }}
                                className={`p-1 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors ${node.data.specs?.length > 0 ? "ml-1" : ""}`}
                                title="Add Spec"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    )}

                    {/* Nested Components Section (Hardware) */}
                    {node.data.components &&
                        node.data.components.length > 0 && (
                            <div className="mt-2">
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                                    Components
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {node.data.components.map((comp) => {
                                        const CompIcon =
                                            ICONS[comp.type] || Box;
                                        const iconColor =
                                            ICON_COLORS[comp.type] ||
                                            "text-slate-400";
                                        return (
                                            <div
                                                key={comp.id}
                                                className="flex items-center gap-2 bg-slate-950/50 p-2 rounded border border-slate-800 hover:border-slate-600 focus-within:border-slate-500 transition-colors group"
                                            >
                                                <CompIcon
                                                    size={14}
                                                    className={`${iconColor} shrink-0`}
                                                />
                                                <input
                                                    value={comp.name || ""}
                                                    onChange={(e) =>
                                                        updateNestedComponent(
                                                            node.id,
                                                            comp.id,
                                                            {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    className="text-xs text-slate-300 font-medium bg-transparent outline-none w-full truncate focus:text-slate-100"
                                                    placeholder="Component Name"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNestedComponent(
                                                            node.id,
                                                            comp.id,
                                                        );
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all ml-auto"
                                                    title="Remove Component"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    {/* Modular Sub-Items (Containers, VMs) */}
                    {node.data.subItems && node.data.subItems.length > 0 && (
                        <div className="mt-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                                {node.data.subItems.length} Containers
                            </div>
                            <div className="flex flex-col gap-2">
                                {node.data.subItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700 hover:border-slate-500 focus-within:border-cyan-500/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Box
                                                size={14}
                                                className="text-blue-400 shrink-0"
                                            />
                                            <input
                                                value={item.name || ""}
                                                onChange={(e) =>
                                                    updateSubItemData(
                                                        node.id,
                                                        item.id,
                                                        {
                                                            name: e.target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                className="text-xs text-slate-200 bg-transparent outline-none w-full truncate focus:bg-slate-700 rounded px-1"
                                                placeholder="App Name"
                                            />
                                        </div>
                                        <input
                                            value={item.ip || ""}
                                            onChange={(e) =>
                                                updateSubItemData(
                                                    node.id,
                                                    item.id,
                                                    { ip: e.target.value },
                                                )
                                            }
                                            className="text-[10px] font-mono text-slate-400 bg-transparent outline-none w-20 text-right focus:text-cyan-300 ml-2"
                                            placeholder="IP Address"
                                        />
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2 shrink-0" />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSubItem(node.id, item.id);
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Node Footer / Actions */}
            <div className="flex items-center justify-between p-2 border-t border-slate-800 bg-slate-900/80 rounded-b-xl opacity-0 hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                    title="Delete Node"
                >
                    <Trash2 size={16} />
                </button>

                {["server", "pc", "mini_pc", "nas", "sbc"].includes(
                    node.type,
                ) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            addSubItem(node.id, {
                                name: "New App",
                                ip: "10.0.0." + Math.floor(Math.random() * 255),
                                type: "container",
                            });
                        }}
                        className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-slate-800 rounded transition-colors"
                        title="Add Container"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            {/* Bottom Ports (Out / LAN) */}
            <div
                className="absolute -bottom-2 left-0 w-full z-20"
                style={{ display: "flex" }}
            >
                {Array.from({ length: outPortsCount }).map((_, idx) => (
                    <div
                        key={`out-${idx}`}
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePortClick("out", idx);
                            }}
                            className={`node-port w-4 h-4 rounded-full border-2 border-slate-900 bg-blue-600 hover:bg-blue-400 hover:scale-125 cursor-crosshair transition-all shadow-[0_0_8px_rgba(59,130,246,0.8)]
                ${connectingFrom?.nodeId === node.id && connectingFrom?.type === "out" && connectingFrom?.index === idx ? "bg-white ring-2 ring-blue-300 animate-pulse" : ""}`}
                            title={`Out Port ${idx + 1}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// 3. Canvas Area
const Canvas = () => {
    const {
        nodes,
        addNode,
        draggedNode,
        setDraggedNode,
        dragOffset,
        updateNodePosition,
        connectingFrom,
        setMousePos,
        cancelConnection,
        pan,
        setPan,
        zoom,
        setZoom,
        canvasRef,
        screenToWorkspace,
    } = useDiagram();

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const handlePointerDown = useCallback(
        (e) => {
            if (
                e.target === canvasRef.current ||
                e.target.id === "canvas-grid"
            ) {
                setIsPanning(true);
                setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                if (connectingFrom) cancelConnection();
            }
        },
        [canvasRef, pan, connectingFrom, cancelConnection],
    );

    const handlePointerMove = useCallback(
        (e) => {
            if (isPanning) {
                setPan({
                    x: e.clientX - panStart.x,
                    y: e.clientY - panStart.y,
                });
                return;
            }

            if (draggedNode) {
                const wsPos = screenToWorkspace(e.clientX, e.clientY);
                updateNodePosition(
                    draggedNode,
                    wsPos.x - dragOffset.x,
                    wsPos.y - dragOffset.y,
                );
            }

            if (connectingFrom) {
                setMousePos(screenToWorkspace(e.clientX, e.clientY));
            }
        },
        [
            isPanning,
            draggedNode,
            connectingFrom,
            screenToWorkspace,
            dragOffset,
            updateNodePosition,
            panStart,
            setPan,
            setMousePos,
        ],
    );

    const handlePointerUp = useCallback(() => {
        setIsPanning(false);
        setDraggedNode(null);
    }, [setDraggedNode]);

    useEffect(() => {
        if (draggedNode || connectingFrom || isPanning) {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        }
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [
        draggedNode,
        connectingFrom,
        isPanning,
        handlePointerMove,
        handlePointerUp,
    ]);

    const handleWheel = useCallback(
        (e) => {
            e.preventDefault();
            if (!canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newZoom = Math.min(Math.max(0.1, zoom + delta), 3);

            const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
            const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;

            setZoom(newZoom);
            setPan({ x: newPanX, y: newPanY });
        },
        [zoom, pan, setZoom, setPan, canvasRef],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onWheel = (e) => handleWheel(e);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", onWheel);
    }, [handleWheel, canvasRef]);

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("nodeType");
        if (type) {
            const wsPos = screenToWorkspace(e.clientX, e.clientY);
            addNode(type, wsPos.x - 144, wsPos.y - 100);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div
            ref={canvasRef}
            className={`absolute inset-0 bg-slate-950 overflow-hidden outline-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={handlePointerDown}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div
                id="canvas-grid"
                className="absolute inset-0 pointer-events-auto"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, #334155 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
            />

            <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none transform-gpu"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                }}
            >
                <Connections />
                {nodes.map((node) => (
                    <Node key={node.id} node={node} />
                ))}
            </div>

            {connectingFrom && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-cyan-900/80 text-cyan-200 px-4 py-2 rounded-full border border-cyan-500/50 text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-none animate-pulse">
                    Click a port to connect, or click background to cancel
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex gap-2 z-50">
                <button
                    onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                    }}
                    className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 hover:text-cyan-400 transition-colors shadow-lg"
                    title="Reset View"
                >
                    <Maximize size={14} />
                    {Math.round(zoom * 100)}%
                </button>
            </div>
        </div>
    );
};

// 4. Top Navigation Bar
const TopNav = () => {
    const { mapTitle, setMapTitle, isLibraryOpen, setIsLibraryOpen } =
        useDiagram();

    return (
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center gap-3 pointer-events-none">
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 pr-4 rounded-xl shadow-lg pointer-events-auto">
                <button
                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                    <Menu size={20} />
                </button>
                <div className="flex flex-col justify-center">
                    <input
                        value={mapTitle}
                        onChange={(e) => setMapTitle(e.target.value)}
                        className="bg-transparent font-bold text-slate-100 outline-none w-36 focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500 rounded px-1 -ml-1 text-sm transition-all"
                        placeholder="Map Title"
                    />
                </div>
            </div>
        </div>
    );
};

// 5. Floating Library Panel
const FloatingLibrary = () => {
    const { addNodeCentered, isLibraryOpen } = useDiagram();

    if (!isLibraryOpen) return null;

    const libItems = [
        { type: "router", label: "Router", icon: Router },
        { type: "switch", label: "Switch", icon: SwitchCamera },
        { type: "server", label: "Server", icon: Server },
        { type: "pc", label: "PC", icon: Monitor },
        { type: "mini_pc", label: "Mini PC", icon: Monitor },
        { type: "sbc", label: "SBC", icon: Cpu },
        { type: "nas", label: "NAS", icon: HardDrive },
        { type: "disk", label: "Disk", icon: HardDrive },
        { type: "ap", label: "AP", icon: Wifi },
        { type: "gpu", label: "GPU", icon: Layers },
        { type: "hba", label: "HBA", icon: Plug },
        { type: "ups", label: "UPS", icon: BatteryCharging },
    ];

    return (
        <div
            className="absolute top-20 left-4 w-[280px] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex flex-col z-40 shadow-2xl overflow-hidden"
            style={{ maxHeight: "calc(100vh - 6rem)" }}
        >
            <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-200 tracking-wider">
                    LIBRARY
                </h2>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <p className="text-[10px] text-slate-500 mb-3">
                    Drag any component onto the canvas or nodes
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {libItems.map((item) => {
                        const iconColorClass =
                            ICON_COLORS[item.type] || "text-slate-400";
                        return (
                            <button
                                key={item.type}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData(
                                        "nodeType",
                                        item.type,
                                    );
                                    e.dataTransfer.effectAllowed = "copy";
                                }}
                                onClick={() => addNodeCentered(item.type)}
                                className="flex flex-col items-center justify-center py-3 bg-slate-950/50 border border-slate-800 rounded-lg hover:border-slate-600 hover:bg-slate-800 transition-all group cursor-grab active:cursor-grabbing"
                            >
                                <item.icon
                                    size={20}
                                    className={`${iconColorClass} mb-2 transition-colors pointer-events-none`}
                                />
                                <span className="text-[10px] text-slate-300 font-medium pointer-events-none">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-500">Drag to canvas</p>
            </div>
        </div>
    );
};

// 6. Main App Container
export default function App() {
    return (
        <DiagramProvider>
            <div className="relative h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
                <TopNav />
                <FloatingLibrary />
                <Canvas />
            </div>
        </DiagramProvider>
    );
}
