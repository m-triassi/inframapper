import { useState, createContext, useContext, useCallback, useRef, useEffect } from "react";
import { initialData } from "../constants/initialData";

export const DiagramContext = createContext();

const usePersistentState = (key, initialValue) => {
    const [state, setState] = useState(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
};

export const DiagramProvider = ({ children }) => {
    const [mapTitle, setMapTitle] = usePersistentState("infra-mapper-title", initialData.mapTitle);
    const [isLibraryOpen, setIsLibraryOpen] = usePersistentState("infra-mapper-library-open", true);
    const [nodes, setNodes] = usePersistentState("infra-mapper-nodes", initialData.nodes);
    const [edges, setEdges] = usePersistentState("infra-mapper-edges", initialData.edges);
    const [nodeDimensions, setNodeDimensions] = useState({});

    const [pan, setPan] = usePersistentState("infra-mapper-pan", { x: 0, y: 0 });
    const [zoom, setZoom] = usePersistentState("infra-mapper-zoom", 1);
    const canvasRef = useRef(null);

    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [connectingFrom, setConnectingFrom] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

export const useDiagram = () => useContext(DiagramContext);
