export interface DailySalesPointDto {
  date: string;
  totalRevenue: number;
  orderCount: number;
}

export interface CategorySalesPointDto {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  totalQuantity: number;
  percentage: number;
}

export interface OrderStatusDistributionDto {
  status: string;
  statusLabel: string;
  count: number;
}

export interface SalesAnalyticsDto {
  totalRevenueAllTime: number;
  totalOrdersAllTime: number;
  averageOrderValue: number;
  dailySales: DailySalesPointDto[];
  categorySales: CategorySalesPointDto[];
  statusDistribution: OrderStatusDistributionDto[];
}
