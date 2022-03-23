import threeDS from '../../assets/images/3ds.png';
import nSwitch from '../../assets/images/switch.png';
import wiiU from '../../assets/images/wii-u.png';
import gamecube from '../../assets/images/gamecube.png';
import wii from '../../assets/images/wii.png';
import psp from '../../assets/images/psp.png';
import gba from '../../assets/images/gba.png';
import ds from '../../assets/images/ds.png';

const consoles = [
  { name: 'Switch', icon: nSwitch, emu: 'Yuzu' },
  { name: 'WiiU', icon: wiiU, emu: 'Cemu' },
  { name: 'Wii', icon: wii, emu: 'Dolphin' },
  { name: 'GC', icon: gamecube, emu: 'Dolphin' },
  { name: '3DS', icon: threeDS, emu: 'Citra' },
  { name: 'DS', icon: ds, emu: 'DeSmuME' },
  { name: 'GBA', icon: gba, emu: 'mGBA' },
  { name: 'PSP', icon: psp, emu: 'PPSSPP' },
];

export default consoles;
