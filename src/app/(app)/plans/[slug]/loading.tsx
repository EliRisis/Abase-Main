import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-page">
      <Skeleton className="h-40 w-full rounded-card" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
