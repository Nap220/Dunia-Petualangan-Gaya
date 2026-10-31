/**
 * Asset Registry & Mapping System for "Petualangan Dunia Gaya"
 * Contains references to all uploaded assets and placeholders.
 */

export const ASSETS = {
  // Background image uploaded by user
  backgroundTaman: '/assets/aistudio/Gemini_Generated_Image_wp998fwp998fwp99_d9632e4c.jpg',

  // Topic Icons / Logos
  iconGravitasi: '/assets/aistudio/Logo_untuk_Gaya_Gravitasi_c6199333.png',
  iconOtot: '/assets/aistudio/Logo_untuk_Gaya_Otot_00812596.png',
  iconGesek: '/assets/aistudio/Logo_untuk_Gaya_Gesek_b49c996a.png',
  iconMagnet: '/assets/aistudio/Logo_untuk_Gaya_Magnet_f4ce6c03.png',
  iconPegas: '/assets/aistudio/Logo_untuk_Gaya_Pegas_e1b60164.png',

  // Gravitasi assets
  pohonApel: '/assets/aistudio/Pohon_ea1cc6b9.png',
  buahApel: '/assets/aistudio/Apel_a888bebc.png',
  buahApelJatuh: '/assets/aistudio/Apel_Jatuh_c6199333.png',

  // Gaya Otot characters & objects
  karakterAnak: '/assets/aistudio/Anak-anak_berdiri_6a046d01.png',
  karakterAnakMendorong: '/assets/aistudio/Anak-anak_mendorong_919ae341.png',
  karakterDewasa: '/assets/aistudio/Orang_Dewasa_berdiri_68ae9374.png',
  karakterDewasaMendorong: '/assets/aistudio/Orang_Dewasa_mendorong_58eec4b2.png',
  kotakPeti: '/assets/aistudio/Kotak_1eb1b22a.png',
  kulkas: '/assets/aistudio/Kulkas_a43d8105.png',

  // Gaya Gesek
  karakterPendorongGesek: '/assets/aistudio/Anak-anak_mendorong_919ae341.png',
  kotakGesek: '/assets/aistudio/Kotak_1eb1b22a.png',

  // Gaya Magnet
  magnetUtara: '/assets/aistudio/Magnet_Kutub_Utara_5d8a5af3.png',
  magnetSelatan: '/assets/aistudio/Magnet_Kutub_Selatan_1b32e7a1.png',
  paku: '/assets/aistudio/Paku_571d19d7.png',
  baut: '/assets/aistudio/Baut_aaa1fcac.png',
  kayuRanting: '/assets/aistudio/Kayu_Ranting_54c6c633.png',
  koinPerak: '/assets/aistudio/Koin_Perak_fa039fc8.png',

  // Gaya Pegas
  bola: '/assets/aistudio/Bola_d49ee5fb.png',
} as const;

export type AssetKey = keyof typeof ASSETS;
