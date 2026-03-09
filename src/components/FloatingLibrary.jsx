import { useDiagram } from "../hooks/useDiagram";
import { LIBRARY_ITEMS, ICON_COLORS } from "../constants/config";

export const FloatingLibrary = () => {
    const { addNodeCentered, isLibraryOpen } = useDiagram();

    if (!isLibraryOpen) return null;

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
                    {LIBRARY_ITEMS.map((item) => {
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
