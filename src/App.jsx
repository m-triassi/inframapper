import { DiagramProvider } from "./hooks/useDiagram.jsx";
import { TopNav } from "./components/TopNav";
import { FloatingLibrary } from "./components/FloatingLibrary";
import { Canvas } from "./components/Canvas";

export function App() {
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

export default App;
