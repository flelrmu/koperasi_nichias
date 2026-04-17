import { Bug } from "lucide-react"; // Using Bug as a placeholder for Dragonfly as Lucide doesn't have a dragonfly icon

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-[#1e4e8c] p-1.5 rounded-sm flex items-center justify-center">
        <Bug className="text-white w-6 h-6" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[#1e4e8c] font-bold text-sm">Nichias</span>
        <span className="text-[#1e4e8c] font-bold text-sm">Sunijaya</span>
      </div>
    </div>
  );
}
