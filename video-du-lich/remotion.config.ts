import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setEntryPoint('src/index.ts');
Config.setBrowserExecutable('/opt/pw-browsers/chromium');
Config.setChromiumOpenGlRenderer('swangle');
