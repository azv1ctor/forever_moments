
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WeddingsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Gerenciar Casamentos</CardTitle>
                <CardDescription>Adicione, edite ou remova eventos de casamento.</CardDescription>
            </div>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Casamento
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium text-muted-foreground">Funcionalidade em desenvolvimento</h3>
          <p className="text-sm text-muted-foreground">Em breve você poderá gerenciar múltiplos casamentos por aqui.</p>
        </div>
      </CardContent>
    </Card>
  );
}
