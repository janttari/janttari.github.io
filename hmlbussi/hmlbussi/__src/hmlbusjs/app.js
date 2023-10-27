#!/usr/bin/env node
'use strict';
var gjupdater = require('./geojsupdater');
const schedule = require('node-schedule');


//downloadZip();

const j = schedule.scheduleJob({ hour: 9, minute: 57 }, () => {
    gjupdater.geojsonupdater();
});

gjupdater.geojsonupdater();