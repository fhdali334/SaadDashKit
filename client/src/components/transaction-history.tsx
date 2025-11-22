import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";
import { Receipt, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className="border-card-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No transactions yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {sortedTransactions.map((transaction) => {
                const isPurchase = transaction.type === 'purchase';
                const amount = parseFloat(transaction.amount);

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {isPurchase ? (
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                          <ArrowUpCircle className="h-5 w-5 text-success" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={`font-semibold ${
                          isPurchase ? 'text-success' : 'text-foreground'
                        }`}
                      >
                        {isPurchase ? '+' : '-'}${amount.toFixed(2)}
                      </span>
                      <Badge
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
