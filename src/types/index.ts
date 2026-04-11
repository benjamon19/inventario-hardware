export type ItemStatus = 'DISPONIBLE' | 'EN_USO' | 'EN_REPARACION' | 'DE_BAJA';
export type TransactionType = 'INGRESO' | 'SALIDA';

export interface HardwareItem {
  id: string;
  sku: string;
  categoria: string;
  modelo: string;
  estado: ItemStatus;
  asignado_a?: string | null;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  hardware_id: string;
  sku: string;
  tipo: TransactionType;
  operador_id: string;
  notas?: string;
  timestamp: string;
}