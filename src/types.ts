/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Screen =
  | 'home'
  | 'sobre-nosotros'
  | 'servicio-domicilio'
  | 'experiencia-360'
  | 'spa-capilar'
  | 'limpieza-facial'
  | 'membresias'
  | 'registro'
  | 'login-admin'
  | 'dashboard-admin'
  | 'legal'
  | 'cursos'
  | 'productos';

export interface RegisteredUser {
  id: string;
  fullname: string;
  age: number;
  email: string;
  phone: string;
  isSocio: boolean;
  membership: 'gold' | 'plata' | 'bronce' | 'ninguno';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order?: number;
  active?: boolean;
  product_count?: number;
}

export interface Order {
  id: string;
  total: number;
  status: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  price_at_time?: number;
  whatsapp_sent_at?: string;
  created_at: string;
}

export interface HeroConfig {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  main_image_url?: string;
  secondary_images?: string[];
  cta_label?: string;
  cta_action?: string;
  featured_product_ids?: string[];
  active?: boolean;
  updated_at?: string;
}
