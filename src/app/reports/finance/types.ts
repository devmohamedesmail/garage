// Financial data interface
export interface FinancialData {
    revenue: number;
    expenses: number;
    expense_breakdown?: {
      regular_expenses: number;
      inventory_purchases: number;
    };
    profit: number;
    filters?: {
      startDate: string | null;
      endDate: string | null;
    };
  }

// Date range type for filtering
export type DateRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// Financial data by category
export interface CategoryData {
  revenue: CategoryItem[];
  expenses: CategoryItem[];
  filters: {
    startDate: string | null;
    endDate: string | null;
    groupBy: string;
  };
}

export interface CategoryItem {
  period: string;
  category: string;
  revenue?: number;
  expenses?: number;
}

// Payroll data
export interface PayrollData {
  staff: StaffPayroll[];
  overtime: OvertimePayroll[];
  summary: {
    regularSalaries: number;
    overtimeCosts: number;
    totalPayroll: number;
  };
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StaffPayroll {
  user_id: number;
  first_name: string;
  last_name: string;
  role_name: string;
  salary: number;
  completed_work_orders: number;
}

export interface OvertimePayroll {
  user_id: number;
  first_name: string;
  last_name: string;
  total_hours: number;
  total_overtime_amount: number;
}