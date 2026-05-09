import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <Card className="w-full max-w-lg border-none shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-extrabold text-amber-600">MorningKaki</CardTitle>
          <CardDescription className="text-base mt-2">
            Hackathon Demo Links
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 mt-6">
          <Link href="/s/demo" className="w-full">
            <Button className="w-full h-16 text-lg rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md">
              Senior View (PWA)
            </Button>
          </Link>
          <Link href="/setup" className="w-full">
            <Button variant="outline" className="w-full h-16 text-lg rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 font-bold text-slate-700 transition-colors">
              Caregiver Setup Wizard
            </Button>
          </Link>
          <Link href="/dashboard/demo" className="w-full">
            <Button variant="outline" className="w-full h-16 text-lg rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 font-bold text-slate-700 transition-colors">
              Caregiver Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
