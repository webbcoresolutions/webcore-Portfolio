export const EMAIL = 'info@webcoreuae.com';
export const WEBSITE = 'https://webcoreuae.com/';
export const WHATSAPP = 'https://wa.me/447570792516';
export const HQ = 'Dubai, United Arab Emirates';

export type Office = {
  region: string;
  display: string;
  tel: string;
  timeZone: string;
  hq?: boolean;
  /** Marker position for the contact-page globe (country / city level). */
  lat: number;
  lon: number;
};

export const offices: Office[] = [
  { region: 'Dubai', display: '+971 50 716 9200', tel: '+971507169200', timeZone: 'Asia/Dubai', hq: true, lat: 25.2, lon: 55.27 },
  { region: 'United Kingdom', display: '+44 7570 792516', tel: '+447570792516', timeZone: 'Europe/London', lat: 52.5, lon: -1.5 },
  { region: 'Pakistan', display: '+92 306 6412127', tel: '+923066412127', timeZone: 'Asia/Karachi', lat: 30.4, lon: 70.3 },
];

export const socials = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/webcore-solutions-uae/',
    path: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.6 4.77 6v5.46h-4v-4.84c0-1.16-.02-2.64-1.6-2.64-1.62 0-1.86 1.26-1.86 2.56v4.92h-4v-11Z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587249472207',
    path: 'M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.56V4.63A20.7 20.7 0 0 0 14.25 4.5c-2.25 0-3.79 1.37-3.79 3.9v2.16H7.92v2.94h2.54V21h3.04Z',
  },
  {
    label: 'WhatsApp',
    href: WHATSAPP,
    path: 'M12.04 3a8.94 8.94 0 0 0-7.7 13.5L3 21l4.62-1.3A8.95 8.95 0 1 0 12.04 3Zm0 16.3a7.33 7.33 0 0 1-3.74-1.02l-.27-.16-2.74.77.78-2.67-.18-.28a7.35 7.35 0 1 1 6.15 3.36Zm4.03-5.5c-.22-.11-1.3-.64-1.5-.71-.2-.08-.35-.11-.5.11-.15.22-.57.71-.7.86-.13.15-.26.17-.48.06a6 6 0 0 1-1.77-1.1 6.66 6.66 0 0 1-1.22-1.53c-.13-.22 0-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.05-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38h-.42a.8.8 0 0 0-.58.27 2.44 2.44 0 0 0-.76 1.82c0 1.07.78 2.11.89 2.26.11.15 1.54 2.35 3.73 3.3.52.22.93.36 1.25.46.52.17 1 .14 1.38.09.42-.06 1.3-.53 1.48-1.05.18-.51.18-.95.13-1.05-.06-.09-.2-.15-.42-.26Z',
  },
];
