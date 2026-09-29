export type TableStatus = "kosong" | "terisi" | "menunggu_makanan" | "menunggu_bayar";
export type OrderStatus = "pesanan_baru" | "diproses_dapur" | "siap_saji" | "selesai" | "dibatalkan";
export type PaymentStatus = "belum_bayar" | "menunggu_bayar" | "lunas";
export type PaymentMethod = "qris" | "va_bca" | "va_mandiri" | "va_bri" | "cash" | "edc";
export type OrderItemStatus = "pending" | "cooking" | "done";
export type MenuItemStatus = "available" | "soldout" | "low";
export type SessionStatus = "active" | "closed";
export type StaffCallType = "waiter" | "bill_request" | "refill" | "other";
export type PaymentRecordStatus = "pending" | "paid" | "failed" | "expired";

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  address: string | null;
  wa_number: string | null;
  wa_label: string | null;
  tax_pb1_pct: number;
  service_charge_pct: number;
  merchant_nmid: string | null;
  created_at: string;
}

export interface TableArea {
  id: string;
  branch_id: string;
  name: string;
  capacity: number;
}

export interface Table {
  id: string;
  branch_id: string;
  area_id: string | null;
  number: number;
  label: string;
  seats: number;
  status: TableStatus;
  area?: TableArea;
}

export interface TableSession {
  id: string;
  table_id: string;
  token: string;
  guest_name: string | null;
  guest_count: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  table?: Table;
}

export interface KitchenStation {
  id: string;
  branch_id: string;
  name: string;
  code: string;
}

export interface MenuCategory {
  id: string;
  branch_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  branch_id: string;
  category_id: string;
  kitchen_station_id: string | null;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  status: MenuItemStatus;
  is_bestseller: boolean;
  badge_label: string | null;
  rating: number | null;
  daily_sold: number;
  image_url: string | null;
  sort_order: number;
  category?: MenuCategory;
  kitchen_station?: KitchenStation;
  variants?: MenuItemVariant[];
}

export interface MenuItemVariant {
  id: string;
  menu_item_id: string;
  name: string;
}

export interface Order {
  id: string;
  branch_id: string;
  table_session_id: string;
  order_number: string;
  customer_note: string | null;
  subtotal: number;
  tax_amount: number;
  service_charge_amount: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  table_session?: TableSession;
  order_items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  status: OrderItemStatus;
  menu_item?: MenuItem;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentRecordStatus;
  payment_code: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface StaffCall {
  id: string;
  table_session_id: string;
  type: StaffCallType;
  message: string | null;
  status: "pending" | "handled";
  created_at: string;
  table_session?: TableSession;
}

export interface CashierSettings {
  id: string;
  branch_id: string;
  wa_number: string | null;
  wa_label: string | null;
  tax_pb1_pct: number;
  service_charge_pct: number;
  auto_open_wa: boolean;
  kitchen_bot_enabled: boolean;
  qris_enabled: boolean;
  va_enabled: boolean;
  cash_enabled: boolean;
  edc_enabled: boolean;
  updated_at: string;
}

/* Cart types (local state) */
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

/* Supabase Database type map */
export interface Database {
  public: {
    Tables: {
      restaurants: { Row: Restaurant; Insert: Partial<Restaurant>; Update: Partial<Restaurant> };
      branches: { Row: Branch; Insert: Partial<Branch>; Update: Partial<Branch> };
      table_areas: { Row: TableArea; Insert: Partial<TableArea>; Update: Partial<TableArea> };
      tables: { Row: Table; Insert: Partial<Table>; Update: Partial<Table> };
      table_sessions: { Row: TableSession; Insert: Partial<TableSession>; Update: Partial<TableSession> };
      kitchen_stations: { Row: KitchenStation; Insert: Partial<KitchenStation>; Update: Partial<KitchenStation> };
      menu_categories: { Row: MenuCategory; Insert: Partial<MenuCategory>; Update: Partial<MenuCategory> };
      menu_items: { Row: MenuItem; Insert: Partial<MenuItem>; Update: Partial<MenuItem> };
      menu_item_variants: { Row: MenuItemVariant; Insert: Partial<MenuItemVariant>; Update: Partial<MenuItemVariant> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      staff_calls: { Row: StaffCall; Insert: Partial<StaffCall>; Update: Partial<StaffCall> };
      cashier_settings: { Row: CashierSettings; Insert: Partial<CashierSettings>; Update: Partial<CashierSettings> };
    };
  };
}
