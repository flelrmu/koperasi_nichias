import { motion } from 'framer-motion';

export default function UserTableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 py-4 px-6 border-b border-gray-50"
        >
          {[...Array(columns)].map((_, j) => (
            <div 
              key={j} 
              className={`h-4 bg-gray-100 rounded-lg ${
                j === 0 ? 'w-20' : 
                j === 1 ? 'w-48' : 
                j === columns - 1 ? 'w-16 ml-auto' : 'w-32'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
