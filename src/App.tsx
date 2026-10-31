/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppLayout, ScreenId } from './components/AppLayout';
import { MainMenu } from './components/MainMenu';
import { GravitasiSim } from './components/simulations/GravitasiSim';
import { OtotSim } from './components/simulations/OtotSim';
import { GesekSim } from './components/simulations/GesekSim';
import { MagnetSim } from './components/simulations/MagnetSim';
import { PegasSim } from './components/simulations/PegasSim';
import { ASSETS } from './utils/assets';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('menu');

  // Support ?autostart=1 or ?sim=xxx for automated testing
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const simParam = params.get('sim') as ScreenId;
      if (simParam && ['gravitasi', 'otot', 'gesek', 'magnet', 'pegas'].includes(simParam)) {
        setCurrentScreen(simParam);
      } else if (params.get('autostart') === '1') {
        setCurrentScreen('gravitasi');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const getScreenConfig = () => {
    switch (currentScreen) {
      case 'gravitasi':
        return {
          title: 'Simulasi Gaya Gravitasi',
          icon: ASSETS.iconGravitasi,
        };
      case 'otot':
        return {
          title: 'Simulasi Gaya Otot',
          icon: ASSETS.iconOtot,
        };
      case 'gesek':
        return {
          title: 'Simulasi Gaya Gesek',
          icon: ASSETS.iconGesek,
        };
      case 'magnet':
        return {
          title: 'Simulasi Gaya Magnet',
          icon: ASSETS.iconMagnet,
        };
      case 'pegas':
        return {
          title: 'Simulasi Gaya Pegas',
          icon: ASSETS.iconPegas,
        };
      default:
        return {
          title: 'Petualangan Dunia Gaya',
          icon: undefined,
        };
    }
  };

  const { title, icon } = getScreenConfig();

  return (
    <AppLayout
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      title={title}
      topicIcon={icon}
    >
      {currentScreen === 'menu' && <MainMenu onSelectTopic={setCurrentScreen} />}
      {currentScreen === 'gravitasi' && <GravitasiSim />}
      {currentScreen === 'otot' && <OtotSim />}
      {currentScreen === 'gesek' && <GesekSim />}
      {currentScreen === 'magnet' && <MagnetSim />}
      {currentScreen === 'pegas' && <PegasSim />}
    </AppLayout>
  );
}
