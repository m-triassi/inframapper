import { Menu } from "lucide-react";
import { useDiagram } from "../hooks/useDiagram";

export const TopNav = () => {
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
