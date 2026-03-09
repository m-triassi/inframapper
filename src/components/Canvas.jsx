import { useState, useEffect, useCallback } from "react";
import { Maximize } from "lucide-react";
import { useDiagram } from "../hooks/useDiagram";
import { Connections } from "./Connections";
import { Node } from "./Node";

export const Canvas = () => {
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
