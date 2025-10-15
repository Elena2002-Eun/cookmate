export default function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}