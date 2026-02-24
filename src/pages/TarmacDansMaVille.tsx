import { Card, CardContent } from "@/components/ui/card";

const TarmacDansMaVille = () => {
  return (
    <section className="flex flex-col gap-6 pt-6 pb-6">
      <div className="flex justify-center">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Tarmac dans ma ville</h1>
      </div>

      <div className="flex flex-col gap-3 items-center">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="text-center text-muted-foreground py-8">
              Cette fonctionnalité arrive bientôt. Restez connecté !
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TarmacDansMaVille;
