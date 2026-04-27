import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={`s-${i}`}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((__, j) => (
              <Skeleton key={`r-${i}-${j}`} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
