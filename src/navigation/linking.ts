const linking = {
  prefixes: ['orbinote://'],
  config: {
    screens: {
      Universe: 'universe',
      SolarSystem: 'universe/:uid/solarsystem/:ssid',
      Planet: 'universe/:uid/solarsystem/:ssid/planet/:pid',
      Sun: 'universe/:uid/solarsystem/:ssid/sun',
      Search: 'search',
      Settings: 'settings'
    }
  }
};

export default linking;
