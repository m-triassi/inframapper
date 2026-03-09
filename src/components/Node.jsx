import React, { useState, useRef, useEffect } from "react";
import { Box, Trash2, Plus } from "lucide-react";
import { useDiagram } from "../hooks/useDiagram";
import { ICONS, NODE_COLORS, ICON_COLORS } from "../constants/config";

const SUPPORTED_TYPES_FOR_SPECS = ["server", "pc", "mini_pc", "sbc", "nas"];
const SUPPORTED_TYPES_FOR_CONTAINERS = [
    "server",
    "pc",
    "mini_pc",
    "nas",
    "sbc",
];

export const Node = ({ node }) => {
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

    const IconComponent = ICONS[node.type] || ICONS.server;
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

            <div className="p-4 pt-3 flex flex-col text-sm mb-2">
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

                    {SUPPORTED_TYPES_FOR_SPECS.includes(node.type) && (
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
                                            className="ml-1 hover:bg-slate-600 p-0.5 rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSubItem(node.id, item.id);
                                            }}
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

                {SUPPORTED_TYPES_FOR_CONTAINERS.includes(node.type) && (
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
