import {
    Server,
    Router,
    SwitchCamera,
    Cpu,
    HardDrive,
    Wifi,
    BatteryCharging,
    Plug,
    Box,
    Monitor,
    Layers,
} from "lucide-react";

export const NODE_COLORS = {
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

export const ICON_COLORS = {
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

export const ICONS = {
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

export const LIBRARY_ITEMS = [
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
