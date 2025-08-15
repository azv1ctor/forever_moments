
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlansPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Planos</CardTitle>
        <CardDescription>Gerencie os planos e os recursos disponíveis para cada um.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Funcionalidade em desenvolvimento</h3>
            <p className="text-sm text-muted-foreground">Em breve você poderá configurar os planos de assinatura.</p>
        </div>
      </CardContent>
    </Card>
  );
}
