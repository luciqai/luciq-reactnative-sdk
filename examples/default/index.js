// Benchmark: stamp earliest JS evaluation time for time-to-interactive (TTI).
// Must stay at the very top, before any other import runs.
global.__BENCH_JS_START__ = Date.now();

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import { App } from './src/App';

AppRegistry.registerComponent(appName, () => App);
