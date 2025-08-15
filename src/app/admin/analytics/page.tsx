
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análises</CardTitle>
        <CardDescription>Visualize as métricas de uso da plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Funcionalidade em desenvolvimento</h3>
            <p className="text-sm text-muted-foreground">Em breve você poderá ver gráficos e relatórios sobre o engajamento.</p>
        </div>
      </CardContent>
    </Card>
  );
}
