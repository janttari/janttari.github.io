#!/usr/bin/ node
'use strict';
// npm install node-schedule
const reittiDataUrl = "https://tvv.fra1.digitaloceanspaces.com/203.zip"; //hämeenlinna
// const schedule = require('node-schedule');
//const csv = require("csv"); //npm install csv
//const csv = require("csv-string"); //npm install csv-string
const decompress = require("decompress"); //npm install decompress
const https = require('https');
const fs = require("fs");
const { mkdir, writeFile } = require("fs/promises");
const { isNumber } = require('util');
const kaupunkilinjat = ["1", "1S", "2", "2U", "3", "3S", "3K", "4", "5", "10", "10T", "11", "13", "14", "14K", "16", "17", "17K"];
function writeTextFile(name, content) {
    //content=content.replaceAll("\"", "");
    fs.writeFile(name, content, err => {
        if (err) {
            console.error(err);
        }
        // file written successfully
    });
}

function parseRoutes() {
    let shape_arr = {};
    let trip_arr = {};
    let routes_arr = {}; //linjojen asiakaslinjanumeroiden mukaan
    let route_to_line = {} // fyysinen linjanumero: asiakaslinja
    let polylines = {};
    let lst_id = -1;
    const src_shapes = fs.readFileSync('rawdata/shapes.txt', 'utf-8');
    src_shapes.split(/\r?\n/).forEach(line => {
        line = line.replaceAll("\"", "");
        let [shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled] = line.split(",")
        let id = parseInt(shape_id);
        //console.log(id, typeof(id));

        if (Number.isInteger(id)) {
            if (!(id in shape_arr)) shape_arr[id] = [];

            shape_arr[parseInt(id)].push([parseFloat(shape_pt_lat), parseFloat(shape_pt_lon)]);
        }

    });
    //writeTextFile("tmp/shapes.txt", JSON.stringify(shape_arr));



    // trip_arr {9042: [402,403, 404]} fyysinen linja -> shapenumero
    const src_trips = fs.readFileSync('rawdata/trips.txt', 'utf-8');
    src_trips.split(/\r?\n/).forEach(line => {
        line = line.replaceAll("\"", "");
        let [route_id, service_id, trip_id, trip_headsign, direction_id, block_id, shape_id] = line.split(",");
        let rid = parseInt(route_id);
        if (Number.isInteger(rid)) {
            if (!(rid in trip_arr)) trip_arr[rid] = [];
            if (!(trip_arr[rid].includes(shape_id))) { //tarttis vain uniikit saada
                //console.log(trip_arr[rid]);

                trip_arr[rid].push(shape_id);
            }
        }
    });
    //writeTextFile("tmp/trips.txt", JSON.stringify(trip_arr));
    const src_routes = fs.readFileSync('rawdata/routes.txt', 'utf-8');
    src_routes.split(/\r?\n/).forEach(line => {

        //console.log(line);
        line = line.replaceAll("\"", "");
        let [route_id, agency_id, route_short_name, route_long_name] = line.split(",");

        let rid = parseInt(route_id);
        if (Number.isInteger(rid)) {
            route_to_line[route_id] = route_short_name;
            if (!(route_short_name in routes_arr)) routes_arr[route_short_name] = [];

            routes_arr[route_short_name].push(route_id);
        }


    });
    let route_to_line_txt = JSON.stringify(route_to_line);
    route_to_line_txt = 'var route_to_line = ' + route_to_line_txt + ";";
    writeTextFile("www/js/route-to-line.js", route_to_line_txt);
    writeTextFile("tmp/routes.txt", JSON.stringify(routes_arr));

    //Tehdään shapet
    let shapet_per_linja = {};
    for (let linja in routes_arr) {
        let shapet_this_linja = []
        routes_arr[linja].forEach(flin => {
            //console.log(flin);
            trip_arr[flin].forEach(shapeno => {
                //console.log(linja, flin, shapeno);
                shapet_this_linja.push(shapeno);
            });
            shapet_per_linja[linja] = shapet_this_linja;
        });
    }
    //writeTextFile("tmp/shapet_perlinja.txt", JSON.stringify(shapet_per_linja));

    // nyt iteroidaan shapet_per_linja jossa on kunkin linjan asiakasnumeron mukaiset shapet
    let geotext = "{\n  \"type\": \"FeatureCollection\",\n  \"features\": [\n";
    for (let linja in shapet_per_linja) {

        let linjatyyppi="maaseutu";
        if (kaupunkilinjat.includes(linja)) {
            linjatyyppi = "kaupunki";
        }

        console.log(linjatyyppi)
        //geotext += '      {\n        "type": "Feature",\n        "properties": {\n          "id": "' + linja + '",\n          "name": "' + linja + '"\n        },\n        "geometry": {\n          "type": "MultiLineString",\n          "coordinates": [\n';
        geotext += '      {\n        "type": "Feature",\n        "properties": {\n          "id": "' + linja + '",\n          "name": "' + linja + '",\n          "linjatyyppi": "' + linjatyyppi + '"\n        },\n        "geometry": {\n          "type": "MultiLineString",\n          "coordinates": [\n';
        shapet_per_linja[linja].forEach(shap => {
            geotext += '            [\n';
            //console.log("l/s ",linja, shap);
            //geotext+='[\n';
            // geotext+='              [0,0],\n';
            // geotext+='              [1,1],\n';
            shape_arr[shap].forEach(koord => { //QQQ
                //console.log("koord", koord);
                geotext += '              [' + koord[1] + ', ' + koord[0] + '],\n'
            }
            ); //QQQ
            // geotext+=']';
            geotext = geotext.slice(0, -2);
            geotext += '],\n'
            //geotext += '\n            ],\n'
        }

        );
        geotext = geotext.slice(0, -2);
        geotext += '\n           ]}},\n';

    }
    geotext = geotext.slice(0, -2);
    geotext += "]}"
    if (!fs.existsSync("www/geojson")) mkdir("www/geojson");
    //täs pitäis miettiä tallentaa geojson!!
    //tallenna MultiLineString koska linjalla voi olle useita shapeja
    writeTextFile("www/geojson/hml.geojson", geotext);
    console.log(geotext);
}
function downloadZip() {
    console.log("download zip from", reittiDataUrl)
    if (!fs.existsSync("dltmp")) mkdir("dltmp");
    const file = fs.createWriteStream("dltmp/data.zip");
    https.get(reittiDataUrl, response => {
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log("Download ok")
            if (!fs.existsSync("rawdata")) mkdir("rawdata");
            decompress("dltmp/data.zip", "rawdata")
                .then((files) => {
                    console.log("unzip ok");
                    parseRoutes();
                })
                .catch((error) => {
                    console.log("unzip error", error);
                });
        });
    }).on('error', error => {
        fs.unlink(fileName);
    });
}

exports.geojsonupdater = function () {
    //parseRoutes(); //testikäyttö, kommentoi alta downloadZip pois
    downloadZip();

}

