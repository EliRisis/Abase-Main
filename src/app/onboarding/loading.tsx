import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-background px-5 py-8 safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6">
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
