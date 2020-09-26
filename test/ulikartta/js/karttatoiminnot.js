var klikatut={}; //täällä on onko kyseinen kuntakoodi klikattu aktiiviseksi (true) vai epäaktiiviseksi (false)

const customSize = {
    className: "omakoko",
    name: "omakoko"
}
customSize["height"] = parseInt(getComputedStyle(document.querySelector('#map')).height);
customSize["width"] = parseInt(getComputedStyle(document.querySelector('#map')).width);

var printer = L.easyPrint({
    tileLayer: positron,
    sizeModes: [customSize],
    filename: 'myMap',
    hidden: true,
    exportOnly: true,
    hideControlContainer: false
}).addTo(map);

luoCheckboxit();
function keskita(){
    map.closePopup();
    map.setView({ lat: 65.5, lng: 25.2 }, 6);
}

function manualPrint () {
    printer.printMap('omakoko', 'ulikartta')
}

function klik(kkunta){ //kuntakoodi saadaan
    var vari = document.getElementById("vari").value;
    if (kkunta in klikatut){
        if ((klikatut[kkunta] == vari) || (vari=="gray")){ //klikataan jo värjättyä kuntaa tai väri on harmaa, joten epävärjätään se
            vari="gray";
            delete klikatut[kkunta];
        }
    }
    if (vari != "gray"){
        klikatut[kkunta] = vari;
    }
    document.getElementById("jsondata").value=JSON.stringify(klikatut);
    asetaVariKuntakoodilla(kkunta, vari);    
}


function asetaVari(kkunta, vari){ // asetaVari("riihimäki", "yellow)    //nimi saa olla pienillä, isoilla tai sekaisin
    geojson.eachLayer(function (layer) { 
        if(layer.feature.properties.name.toLowerCase() == kkunta.toLowerCase()) {
            layer.setStyle({fillColor :vari}) ;
        }
    });
}


function asetaVariKuntakoodilla(kuntakoodi, vari){ // asetaVari("riihimäki", "yellow)    //nimi saa olla pienillä, isoilla tai sekaisin
    document.getElementById("btn"+kuntakoodi).className = vari;
    geojson.eachLayer(function (layer) { 
        if(layer.feature.properties.code == kuntakoodi){
            layer.setStyle({fillColor :vari}) ;
        }
    });
}

function tyhjennaKartta(){
    geojson.eachLayer(function (layer) { 
        layer.setStyle({fillColor :"gray"}) ;
        klikatut={};
        document.getElementById("jsondata").innerText=JSON.stringify(klikatut);
    });
    document.getElementById("jsondata").value="";
    luoCheckboxit();
}

function tuoJson(){
    kohteet=JSON.parse(document.getElementById("jsondata").value);
    tyhjennaKartta();
    for (kohde in kohteet){
        asetaVariKuntakoodilla(kohde,kohteet[kohde]);
        klikatut[kohde] = kohteet[kohde];
    }
}

function luoCheckboxit(){
    kuntaJaKoodi={}
    kieli=document.getElementById("kieli").value;
    for (kkunta in kunnat.features[0].features){
        nimikys='kunnat.features[0].features[kkunta].properties.'+kieli; //miten tää kuuluis oikeesti?
        nimi=eval(nimikys);
        koodi=kunnat.features[0].features[kkunta].properties.code;
        kuntaJaKoodi[nimi]=koodi;

    }
    kuntaJaKoodi = sortOnKeys(kuntaJaKoodi);
    var kuntaDiv = document.getElementById("kuntalista");
    kuntaDiv.innerHTML="";
    for (kk in kuntaJaKoodi){
        vari="gray";
        if (kuntaJaKoodi[kk] in klikatut){
            vari=klikatut[kuntaJaKoodi[kk]];
        }
        klikkoodi="'"+kuntaJaKoodi[kk]+"'";
        kohde='<label id="btn'+kuntaJaKoodi[kk]+'" onclick="klik('+klikkoodi+')" class="'+vari+'">'+kk+'</label><br>'; //+kuntaJaKoodi[kk]+
        kuntaDiv.innerHTML+=kohde;
    }
}


function sortOnKeys(dict) { //aakkosta
    var sorted = [];
    for(var key in dict) {
        sorted[sorted.length] = key;
    }
    sorted.sort();

    var tempDict = {};
    for(var i = 0; i < sorted.length; i++) {
        tempDict[sorted[i]] = dict[sorted[i]];
    }
    return tempDict;
}

function vaihdaKartta(){
    var url = document.getElementById("karttavalinta").value;
    console.log(url);
    //url = 'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg';
    attr = '&copy; <a href="http://www.maanmittauslaitos.fi/">Maanmittauslaitos</a>';
    self.L.tileLayer(url).addTo(self.map);

}

