#region Importing

from flask import Flask, request, make_response, render_template, url_for, g
from flask import send_from_directory, jsonify
from flask_restful import Resource, Api
from json import dumps
import os
from os import environ 
import json, argparse, datetime, subprocess, time
import broadlink
from broadlink.exceptions import ReadError, StorageError
from subprocess import call

#endregion

#region Parsing Default arguments for descovery

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument("--timeout", type=int, default=5,
                    help="timeout to wait for receiving discovery responses")
parser.add_argument("--ip", default=None,
                    help="ip address to use in the discovery")
parser.add_argument("--dst-ip", default="255.255.255.255",
                    help="destination ip address to use in the discovery")
args = parser.parse_args()

#endregion

#region Declaring Flask app

app = Flask(__name__)
api = Api(app)

#endregion

#region Global Properties
_continu_to_sweep=False
_rf_sweep_message=''
_rf_sweep_status=False

TICK = 32.84
IR_TOKEN = 0x26
TIMEOUT = 30

#endregion

#region Broadlink Helper Methods

def getDeviceName(deviceType):
    name = {
        0x2711: "SP2",
        0x2719: "Honeywell SP2",
        0x7919: "Honeywell SP2",
        0x271a: "Honeywell SP2",
        0x791a: "Honeywell SP2",
        0x2720: "SPMini",
        0x753e: "SP3",
        0x7D00: "OEM branded SP3",
        0x947a: "SP3S",
        0x9479: "SP3S",
        0x2728: "SPMini2",
        0x2733: "OEM branded SPMini",
        0x273e: "OEM branded SPMini",
        0x7530: "OEM branded SPMini2",
        0x7546: "OEM branded SPMini2",
        0x7918: "OEM branded SPMini2",
        0x7D0D: "TMall OEM SPMini3",
        0x2736: "SPMiniPlus",
        0x2712: "RM2",
        0x2737: "RM Mini",
        0x273d: "RM Pro Phicomm",
        0x2783: "RM2 Home Plus",
        0x277c: "RM2 Home Plus GDT",
        0x272a: "RM2 Pro Plus",
        0x2787: "RM2 Pro Plus2",
        0x279d: "RM2 Pro Plus3",
        0x27a9: "RM2 Pro Plus_300",
        0x278b: "RM2 Pro Plus BL",
        0x2797: "RM2 Pro Plus HYC",
        0x27a1: "RM2 Pro Plus R1",
        0x27a6: "RM2 Pro PP",
        0x278f: "RM Mini Shate",
        0x27c2: "RM Mini 3",
        0x2714: "A1",
        0x4EB5: "MP1",
        0x4EF7: "Honyar oem mp1",
        0x4EAD: "Hysen controller",
        0x2722: "S1 (SmartOne Alarm Kit)",
        0x4E4D: "Dooya DT360E (DOOYA_CURTAIN_V2)",
        0x51da: "RM4 Mini",
        0x5f36: "RM Mini 3",
        0x6026: "RM4 Pro",
        0x6070: "RM4c Mini",
        0x61a2: "RM4 Pro",
        0x610e: "RM4 Mini",
        0x610f: "RM4c",
        0x62bc: "RM4 Mini",
        0x62be: "RM4c Mini",
        0x51E3: "BG Electrical Smart Power Socket",
        0x60c8: "RGB Smart Bulb",
    }
    return name.get(deviceType, "Not Supported")

def auto_int(x):
    return int(x, 0)

def to_microseconds(bytes):
    result = []
    #  print bytes[0] # 0x26 = 38for IR
    index = 4
    while index < len(bytes):
        chunk = bytes[index]
        index += 1
        if chunk == 0:
            chunk = bytes[index]
            chunk = 256 * chunk + bytes[index + 1]
            index += 2
        result.append(int(round(chunk * TICK)))
        if chunk == 0x0d05:
            break
    return result

def durations_to_broadlink(durations):
    result = bytearray()
    result.append(IR_TOKEN)
    result.append(0)
    result.append(len(durations) % 256)
    result.append(len(durations) / 256)
    for dur in durations:
        num = int(round(dur / TICK))
        if num > 255:
            result.append(0)
            result.append(num / 256)
        result.append(num % 256)
    return result

def format_durations(data):
    result = ''
    for i in range(0, len(data)):
        if len(result) > 0:
            result += ' '
        result += ('+' if i % 2 == 0 else '-') + str(data[i])
    return result

def parse_durations(str):
    result = []
    for s in str.split():
        result.append(abs(int(s)))
    return result

#endregion

#region UI Rendering Methods

#Homepage (Devices)
@app.route('/')
def devices():
    return render_template('index.html')


@app.route('/generator')
def generator():
    return render_template('generator.html')


@app.route('/livolo')
def livolo():
    return render_template('livolo.html')


@app.route('/energenie')
def energenie():
    return render_template('energenie.html')


@app.route('/repeats')
def repeats():
    return render_template('repeats.html')


@app.route('/convert')
def convert():
    return render_template('convert.html')

@app.route('/about')
def about():
    return render_template('about.html')

#endregion UI Rendering Methods

#region API Methods

# Learn IR
@app.route('/ir/learn')
def learnir():
    dtype = int(request.args.get('type'), 0)
    host = request.args.get('host')
    mac = bytearray.fromhex(request.args.get('mac'))
    dev = broadlink.gendevice(dtype, (host, 80), mac)
    dev.auth()
    dev.enter_learning()
    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        try:
            data = dev.check_data()
        except (ReadError, StorageError):
            continue
        else:
            break
    else:
        return jsonify('{"data":"","success":0,"message":"No Data Recived"}')
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    return jsonify('{"data":"' + learned + '","success":1,"message":"IR Data Recived"}')


# Send IR/RF
@app.route('/command/send')
def command():
    dtype = int(request.args.get('type'), 0)
    host = request.args.get('host')
    mac = bytearray.fromhex(request.args.get('mac'))
    dev = broadlink.gendevice(dtype, (host, 80), mac)
    command = request.args.get('command')
    dev.auth()
    try:
        dev.send_data(bytearray.fromhex(''.join(command)))
        return jsonify('{"data":"","success":1,"message":"Command sent successfully"}')
    except:
        return jsonify('{"data":"","success":0,"message":"Error occurred while Sending command!"}')
        

#Learn RF
@app.route('/rf/learn')
def sweep():
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    _continu_to_sweep=False
    _rf_sweep_message=''
    _rf_sweep_status=False
    dtype = int(request.args.get('type'), 0)
    host = request.args.get('host')
    mac = bytearray.fromhex(request.args.get('mac'))
    dev = broadlink.gendevice(dtype, (host, 80), mac)
    dev.auth()
    dev.sweep_frequency()
    _rf_sweep_message = "Learning RF Frequency, press and hold the button to learn..."
    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        if dev.check_frequency():
            break
    else:
      _rf_sweep_message = "RF Frequency not found!"
      dev.cancel_sweep_frequency()
      return jsonify('{"data":"RF Frequency not found!","success":0}')
    
    _rf_sweep_message = "Found RF Frequency - 1 of 2!"
    time.sleep(1)
    _rf_sweep_message = "You can now let go of the button"
    _rf_sweep_status=True
    while _continu_to_sweep == False:
      _rf_sweep_message = "Click The Continue button"
    
    _rf_sweep_message = "To complete learning, single press the button you want to learn"
    _rf_sweep_status=False
    dev.find_rf_packet()
    start = time.time()
    while time.time() - start < TIMEOUT:
      time.sleep(1)
      try:
        data = dev.check_data()
      except (ReadError, StorageError):
        continue
      else:
        break
    else:
        _rf_sweep_message = "No Data Found"
        return jsonify('{"data":"No Data Found"}')

    _rf_sweep_message = "Found RF Frequency - 2 of 2!"
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    return jsonify('{"data":"' + data + '"}')

#Get RF Learning state
@app.route('/rf/status')
def rfstatus():
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    return jsonify('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')

@app.route('/rf/continue')
def rfcontinue():
    global _continu_to_sweep
    global _rf_sweep_status
    _rf_sweep_status = True
    _continu_to_sweep = True
    return jsonify('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')



# Discover Devices
@app.route('/discover')
def discover():
    _devices = '['
    devices = broadlink.discover(
        timeout=5, local_ip_address=None, discover_ip_address="255.255.255.255")
    for device in devices:
        if device.auth():
            _devices = _devices + '{"name":"' + \
                getDeviceName(device.devtype) + '",'
            _devices = _devices + '"type":"' + \
                format(hex(device.devtype)) + '",'
            _devices = _devices + '"ip":"' + device.host[0] + '",'
            _devices = _devices + '"mac":"' + \
                ''.join(format(x, '02x') for x in device.mac[::-1]) + '"},'

    _devices = _devices[:-1] + ']'
    return jsonify(_devices)

#endregion API Methods

#region Serving Static Files

#Serve Javascript
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('dist/js', path)

#Serve CSS
@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('dist/css', path)

#Serve Images
@app.route('/img/<path:path>')
def send_img(path):
    return send_from_directory('dist/img', path)

#Serve Fonts
@app.route('/webfonts/<path:path>')
def send_webfonts(path):
    return send_from_directory('dist/webfonts', path)

#endregion

#Start Application

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=7020)
