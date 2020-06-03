/*
PROTOCOL:

b2 RF

0c repeats

34 00   52 bytes follow (big endian)  24 pairs + 4 for the footer

## ##       24 0d for a 1, 0d 24 for a 0

0c 00 01 6f   (Footer)

*/

const HIGH_BIT = "240d";
const LOW_BIT = "0d24";
const BITS_ARRAY = [HIGH_BIT, LOW_BIT];
const RF433 = "b2";
const RF315 = "d7";
const FOOTER = "0c00016f00000000";
const REPEATS = "0c";
const LONG_REPEAT = "5c";
const BYTES = 24;
const DATA_LENGTH = "3400";

String.prototype.rightJustify = function (length, char) {
  var fill = [];
  while (fill.length + this.length < length) {
    fill[fill.length] = char;
  }
  return this + fill.join('');
}

String.prototype.leftJustify = function (length, char) {
  var fill = [];
  while (fill.length + this.length < length) {
    fill[fill.length] = char;
  }
  return fill.join('') + this;
}

function typePrefixOf(type) {
  if (type === "RF433") {
    return RF433;
  } else if (type === "RF315") {
    return RF315;
  } else {
    throw new Error("Unsupported transmission type.");
  }
}

function randomPulse() {
  return BITS_ARRAY[Math.floor(Math.random() * 2)];
}

function generate(type) {
  var code = "";
  for (i = 0; i < BYTES; i++) {
    var rand = randomPulse();
    code = code + rand;
  }

  var typePrefix = typePrefixOf(type);

  var res = typePrefix + REPEATS + DATA_LENGTH + code + FOOTER;
  var resWithRepeat = typePrefix + LONG_REPEAT + DATA_LENGTH + code + FOOTER;

  return {
    regular: hexToBase64(res),
    long: hexToBase64(resWithRepeat)
  }
}

function getRepeats(b64) {
  var hex = base64ToHex(b64).replace(/ /g, '');
  var repeats = hex.substr(2, 2);
  var decimal = parseInt(repeats, 16);
  return decimal;
}

function getNewCode(b64, repeats) {
  var hex = base64ToHex(b64).replace(/ /g, '');
  var start = hex.substr(0, 2);
  var end = hex.substr(4);

  var hexrepeats = parseInt(repeats).toString(16);

  if (hexrepeats.length == 1) {
    hexrepeats = "0" + hexrepeats;
  }

  var res = (start + hexrepeats + end);
  return hexToBase64(res);
}

function generateLivolo(remoteId, btn) {
  // the livolo code came from https://www.tyjtyj.com/livolo.php, dont know who wrote it, but big thanx
  header = "b280260013";
  id_bin = (+remoteId).toString(2);
  id_bin = id_bin.leftJustify(16, 0);
  btn_bin = (+btn).toString(2);
  btn_bin = btn_bin.leftJustify(7, 0);

  id_btn_bin = id_bin.concat(btn_bin);

  id_btn_bin = id_btn_bin.replace(/0/g, "0606");
  id_btn_bin = id_btn_bin.replace(/1/g, "0c");

  hex_out = header + id_btn_bin;

  pad_len = 32 - (hex_out.length - 24) % 32;

  hex_out = hex_out + ('').leftJustify(pad_len, 0);

  return hexToBase64(hex_out);

}

function generateEnergenie() {

  function randomBinary(n) {
    for (var i = "", a = 0; a < n; a++) i += parseInt(2 * Math.random(), 10).toString();
    return i
  }

  function generateCode(d0d3) {
    // Generate transmission binary
    const binary = remoteIDBinary.toString() + d0d3.toString();
    const dec = parseInt(binary, 2);

    const ENER_HIGH = "1507";
    const ENER_LOW = "0815";
    const ENER_ARRAY = [ENER_LOW, ENER_HIGH];
    const ENER_FOOTER = "08dc000000000000";
    const ENER_APP_REPEATS = "08";

    // Turn transmission binary in to HIGH/LOW hex transmission code
    let code = '';
    for (var i = 0; i < binary.length; i++) {
      code += ENER_ARRAY[parseInt(binary.charAt(i), 10)];
    }
    
    // Construct outputs
    broadlink_hex = RF433 + ENER_APP_REPEATS + DATA_LENGTH + code + ENER_FOOTER;
    broadlink = hexToBase64(broadlink_hex);
    broadlink_long_hex = (RF433 + LONG_REPEAT + DATA_LENGTH + code + ENER_FOOTER);
    broadlink_long = hexToBase64(broadlink_long_hex);

    return { binary, dec, broadlink, broadlink_long, broadlink_hex, broadlink_long_hex };
  }

  let remoteIDBinary = randomBinary(20);
  let remoteID = parseInt(remoteIDBinary, 2)

  let sockets = [
    ['1', '1111', '1110'],
    ['2', '0111', '0110'],
    ['3', '1011', '1010'],
    ['4', '0011', '0010'],
    ['Group', '1101', '1100']
  ]

  $('#gentable, #genjson').html('');

  for (i in sockets) {
    let socket = sockets[i];
    let name = socket[0];
    let d0d3_on = socket[1];
    let d0d3_off = socket[2];

    let on_codes = generateCode(d0d3_on);
    let off_codes = generateCode(d0d3_off);

    const on_html = `<tr scope="row"><td>${name} On</td><td>${remoteID}</td><td>${on_codes['binary']} // ${on_codes['dec']}</td><td>${on_codes['broadlink']}</td><td>${on_codes['broadlink_long']}</td></tr>`;
    $('#gentable').append(on_html);
    const off_html = `<tr scope="row"><td>${name} Off</td><td>${remoteID}</td><td>${off_codes['binary']} // ${off_codes['dec']}</td><td>${off_codes['broadlink']}</td><td>${off_codes['broadlink_long']}</td></tr>`;
    $('#gentable').append(off_html);
    
    var json = `{\n    "name": "Switch ${name}",\n    "type": "switch",\n    "resendHexAfterReload": false,\n    "data": {\n        "on": "${on_codes['broadlink_long_hex']}",\n        "off": "${off_codes['broadlink_long_hex']}"\n    }\n},\n`;
    $('#genjson').append(json);

  }

}