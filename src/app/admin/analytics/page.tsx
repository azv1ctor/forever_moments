// src/app/admin/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAnalyticsData } from '@/lib/actions';
import type { AnalyticsData } from '@/lib/types';
import { BarChart, LineChart, Users, Heart, MessageSquare, Camera } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const result = await getAnalyticsData();
                setData(result);
            } catch (err) {
                setError('Falha ao carregar os dados de análise.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </>
                )}
            </CardContent>
        </Card>
    );

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-destructive">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Casamentos"
                    value={data?.totalWeddings ?? 0}
                    description="Eventos cadastrados na plataforma"
                    icon={Users}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total de Mídias"
                    value={data?.totalPhotos ?? 0}
                    description="Fotos e vídeos enviados"
                    icon={Camera}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total de Curtidas"
                    value={data?.totalLikes ?? 0}
                    description="Engajamento total nas mídias"
                    icon={Heart}
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total de Comentários"
                    value={data?.totalComments ?? 0}
                    description="Comentários feitos pelos convidados"
                    icon={MessageSquare}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5" />Mídias por Casamento</CardTitle>
                        <CardDescription>Quantidade de fotos e vídeos por evento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={350}>
                                <RechartsBarChart data={data?.photosPerWedding}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip wrapperClassName="!bg-background !border-border" cursor={{fill: 'hsl(var(--muted))'}}/>
                                    <Legend />
                                    <Bar dataKey="count" name="Mídias" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                         )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" />Atividade na Última Semana</CardTitle>
                        <CardDescription>Novas mídias enviadas nos últimos 7 dias.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[350px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsLineChart data={data?.activityLast7Days}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip wrapperClassName="!bg-background !border-border" cursor={{stroke: 'hsl(var(--primary))'}} />
                                <Legend />
                                <Line type="monotone" dataKey="count" name="Novas Mídias" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }}/>
                            </RechartsLineChart>
                        </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
