import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total portfolio</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-4 h-[180px] w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

