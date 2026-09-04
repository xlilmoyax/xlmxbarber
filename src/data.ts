/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegisteredUser } from './types';
import sobreNosotrosHeroImg from './assets/images/about_hero.png';
import experiencia360HeroImg from './assets/images/exp_360_hero.webp';
import regeneratedSpaImg from './assets/images/service_spa.png';
import userFacialMaskImg from './assets/images/service_facial.png';
import userCurlyHairImg from './assets/images/service_curly.jpg';
import newHeroBackgroundImg from './assets/images/hero_bg.png';
// Local copies of images (previously hosted on external URLs)
import localLogoBlack from './assets/images/xlmx_minimal_logo_1781878879402.jpg';
import localServicioDomicilioHero from './assets/images/servicioDomicilioHero.jpg';
import localDomicilioAtmos1 from './assets/images/domicilioAtmos1.jpg';
import localDomicilioAtmos2 from './assets/images/domicilioAtmos2.jpg';
import localDomicilioAtmos3 from './assets/images/domicilioAtmos3.jpg';
import localExperiencia360Detail from './assets/images/experiencia360Detail.jpg';
import localMicellarWater from './assets/images/micellarWater.jpg';
import localExfoliatingGel from './assets/images/exfoliatingGel.jpg';
import localFaceResults from './assets/images/faceResults.jpg';
import localMembresiasHero from './assets/images/membresiasHero.jpg';
import localSalonToolsGreyScale from './assets/images/salonToolsGreyScale.jpg';
import localServiceBento360 from './assets/images/serviceBento360.jpg';
import localServiceBentoDomicilio from './assets/images/serviceBentoDomicilio.jpg';
import localLatestNewsPost from './assets/images/latestNewsPost.jpg';
import sirFaustoMaskImg from './assets/images/sir_fausto_mask.jpg';

// Let's keep the initial registered clients list completely empty on startup
export const INITIAL_USERS: RegisteredUser[] = [];

export const IMAGES = {
  // Screen 1: Tradición y excelencia Hero (Scissors and comb)
  sobreNosotrosHero: sobreNosotrosHeroImg,
  // XLMX black emblem logo
  logoBlack: localLogoBlack,

  // Screen 2: Servicios a domicilio Hero
  servicioDomicilioHero: localServicioDomicilioHero,
  // Domicilio atmospheric images
  domicilioAtmos1: localDomicilioAtmos1,
  domicilioAtmos2: localDomicilioAtmos2,
  domicilioAtmos3: localDomicilioAtmos3,

  // Screen 3: Experiencia 360 Hero (Active barber session)
  experiencia360Hero: experiencia360HeroImg,
  // Experiencia 360 Detail Image
  experiencia360Detail: localExperiencia360Detail,

  // Screen 4: Spa Capilar Hero
  spaCapilarHero: regeneratedSpaImg,

  // Screen 5: Limpieza Facial Hero
  limpiezaFacialHero: userFacialMaskImg,
  // Process steps micro-photography
  micellarWater: localMicellarWater,
  exfoliatingGel: localExfoliatingGel,
  maskFace: sirFaustoMaskImg,
  faceResults: localFaceResults,

  // Screen 6: Membresías Hero
  membresiasHeroSec: localMembresiasHero,

  // Screen 8: Land Hero (Main barber focused image)
  mainHeroBackground: newHeroBackgroundImg,
  // Main Hub Content Photos
  salonToolsGreyScale: localSalonToolsGreyScale,
  serviceBentoCurls: userCurlyHairImg,
  serviceBentoFacial: userFacialMaskImg,
  serviceBentoSpa: regeneratedSpaImg,
  serviceBento360: localServiceBento360,
  serviceBentoDomicilio: localServiceBentoDomicilio,
  latestNewsPostImg: localLatestNewsPost,
};

// Lists and configurations for screens
export const BRONCE_MEMBERSHIPS_DETAIL = [
  { service: 'Corte + Ceja', count: 3, listPrice: '$48,000', memberPrice: '$40,000' },
  { service: 'Corte + Ceja', count: 4, listPrice: '$64,000', memberPrice: '$55,000' },
  { service: 'Corte Completo', count: 2, listPrice: '$40,000', memberPrice: '$35,000' },
  { service: 'Corte Completo', count: 3, listPrice: '$60,000', memberPrice: '$52,000' },
  { service: 'Corte Completo', count: 4, listPrice: '$80,000', memberPrice: '$70,000' },
];

export const PLATA_MEMBERSHIPS_DETAIL = [
  { service: 'Cut Full + Spa Capilar', count: 2, listPrice: '$70,000', memberPrice: '$65,000' },
  { service: 'Cut Full + Spa Capilar', count: 3, listPrice: '$105,000', memberPrice: '$90,000' },
  { service: 'Cut Full + Spa Capilar', count: 4, listPrice: '$140,000', memberPrice: '$105,000' },
];

export const GOLD_MEMBERSHIPS_DETAIL = [
  { service: 'Experiencia 360', count: 2, listPrice: '$100,000', memberPrice: '$90,000' },
  { service: 'Experiencia 360', count: 3, listPrice: '$150,000', memberPrice: '$120,000' },
  { service: 'Experiencia 360', count: 4, listPrice: '$200,000', memberPrice: '$140,000' },
];

export const FAQS = [
  {
    q: '¿Cómo funcionan los cobros?',
    a: 'Los cobros son automatizados mensualmente a través de efectivo, transferencia, tarjeta de crédito o débito registrada.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí, no hay contratos forzosos. Puedes cancelar tu membresía en el portal de cliente con 30 días de anticipación.',
  },
  {
    q: '¿Los beneficios son transferibles?',
    a: 'Las membresías son personales e intransferibles para garantizar la exclusividad y calidad del servicio.',
  },
  {
    q: '¿Qué incluye el VIP Lounge?',
    a: 'Acceso ilimitado a todos los servicios, entretenimiento vía PlayStation y/o plataformas de streaming, descuentos en productos y servicios dependiendo la unidad de cortes mensuales.',
  },
];
