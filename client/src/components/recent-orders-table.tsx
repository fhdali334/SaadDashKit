"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Filter } from "lucide-react"

interface Order {
  id: string
  product: string
  category: string
  price: number
  status: "delivered" | "pending" | "cancelled"
  image: string
}

const recentOrders: Order[] = [
  {
    id: "1",
    product: "Macbook pro 13'",
    category: "Laptop",
    price: 2399.0,
    status: "delivered",
    image: "/silver-macbook-on-desk.png",
  },
  {
    id: "2",
    product: "Apple Watch Ultra",
    category: "Watch",
    price: 879.0,
    status: "pending",
    image: "/apple-watch.jpg",
  },
  {
    id: "3",
    product: "iPhone 15 Pro Max",
    category: "SmartPhone",
    price: 1869.0,
    status: "delivered",
    image: "/modern-smartphone.png",
  },
  {
    id: "4",
    product: "iPad Pro 3rd Gen",
    category: "Electronics",
    price: 1699.0,
    status: "cancelled",
    image: "/ipad-on-desk.png",
  },
  {
    id: "5",
    product: "Airpods Pro 2nd Gen",
    category: "Accessories",
    price: 240.0,
    status: "delivered",
    image: "/wireless-earbuds.png",
  },
]

const statusStyles = {
  delivered: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
}

export function RecentOrdersTable() {
  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              See all
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Products</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Price</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="border-border hover:bg-muted/50">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.image || "/placeholder.svg"}
                        alt={order.product}
                        className="w-10 h-10 rounded-md object-cover bg-muted"
                      />
                      <div>
                        <p className="font-medium text-foreground text-sm">{order.product}</p>
                        <p className="text-xs text-muted-foreground">2 Variants</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{order.category}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">${order.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusStyles[order.status].bg} ${statusStyles[order.status].text}`}
                      variant="secondary"
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
