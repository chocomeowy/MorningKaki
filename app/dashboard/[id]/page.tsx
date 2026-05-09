"use client";

import type { SVGProps } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Clock, TrendingUp, HeartPulse, Mic } from "lucide-react";

export default function CaregiverDashboard() {
  const trendData = [
    { name: 'Mon', score: 80, adherence: 100 },
    { name: 'Tue', score: 85, adherence: 100 },
    { name: 'Wed', score: 70, adherence: 50 },
    { name: 'Thu', score: 90, adherence: 100 },
    { name: 'Fri', score: 75, adherence: 100 },
    { name: 'Sat', score: 95, adherence: 100 },
    { name: 'Sun', score: 88, adherence: 100 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border-2 border-amber-200">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">AG</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Ah Gong</h1>
            <p className="text-sm text-slate-500 font-medium">Last active 2 hours ago</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 rounded-full px-3 py-1">
          Active
        </Badge>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-6">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-200/50 p-1 rounded-2xl">
            <TabsTrigger value="today" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 font-bold text-slate-600 transition-all">Today</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 font-bold text-slate-600 transition-all">Trends</TabsTrigger>
            <TabsTrigger value="memories" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 font-bold text-slate-600 transition-all">Memories</TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="mt-6 flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Mood Card */}
            <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-gradient-to-br from-white to-amber-50/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Today&apos;s Mood</p>
                  <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                    Energetic <span className="text-3xl filter drop-shadow-sm">😊</span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Checked in at 07:45 AM
                  </p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner border border-amber-100">
                  <HeartPulse className="w-8 h-8 text-rose-500" />
                </div>
              </CardContent>
            </Card>

            {/* Daily Summary */}
            <Card className="border-none shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-500" /> AI Conversation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <p className="text-slate-700 leading-relaxed text-lg">
                  Ah Gong mentioned he slept very well last night. He is planning to go to the nearby Kopitiam to meet Uncle Tan for kopi later. He remembered to take his morning medication without being prompted.
                </p>
              </CardContent>
            </Card>

            {/* Reminders Status */}
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-4 px-2">Reminders</h3>
              <div className="flex flex-col gap-3">
                <Card className="border-none shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Blood Pressure Meds</p>
                        <p className="text-sm text-slate-500">Acknowledged at 08:10 AM</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-none">Done</Badge>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-2xl bg-white opacity-60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Polyclinic Appointment</p>
                        <p className="text-sm text-slate-500">Upcoming at 02:00 PM</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-slate-500">Pending</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-6 flex flex-col gap-6 animate-in fade-in duration-300">
            <Card className="border-none shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" /> Sentiment Score
                </CardTitle>
                <CardDescription>Based on daily voice check-ins</CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={4} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800">Medication Adherence</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="adherence" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memories Tab */}
          <TabsContent value="memories" className="mt-6 flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-1 shadow-md">
              <div className="bg-white/95 backdrop-blur rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Voice Clone</h3>
                  <p className="text-sm text-slate-500">Preserve their voice forever</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold border-none">Coming Soon</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { date: "Today", text: "I met Uncle Tan at the Kopitiam...", length: "0:45" },
                { date: "Yesterday", text: "The weather is very hot today. I stayed home...", length: "1:12" },
                { date: "Monday", text: "My grandson came to visit me...", length: "2:05" },
              ].map((memory, i) => (
                <Card key={i} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="p-4 bg-slate-50 border-r border-slate-100 flex items-center justify-center">
                        <button className="w-12 h-12 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-full flex items-center justify-center transition-colors">
                          <Play className="w-5 h-5 ml-1" />
                        </button>
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{memory.date}</span>
                          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {memory.length}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 italic">&quot;{memory.text}&quot;</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
