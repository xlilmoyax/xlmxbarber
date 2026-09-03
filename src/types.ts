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

// En tu archivo src/types.ts
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
