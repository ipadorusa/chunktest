'use strict';

/* 일반 import */
import 'babel-polyfill';
import 'classlist-polyfill';
import 'es6-promise/auto';
import 'fetch-ie8';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'

import DynamicLoader from './loader';
window.ui = new DynamicLoader();