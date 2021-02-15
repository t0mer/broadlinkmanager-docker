# region Importing
from flask import Flask, request, make_response, render_template, url_for, g, send_from_directory, jsonify
from flask_restful import Resource, Api
import os, json, subprocess, time, broadlink, argparse, datetime, re
from os import environ, path
from json import dumps
from broadlink.exceptions import ReadError, StorageError
from subprocess import call
from loguru import logger
from broadlink.alarm import S1C
from broadlink.climate import hysen
from broadlink.cover import dooya
from broadlink.device import device, scan
from broadlink.exceptions import exception
from broadlink.light import lb1
from broadlink.remote import rm, rm4
from broadlink.sensor import a1
from broadlink.switch import bg1, mp1, sp1, sp2, sp4, sp4b

# endregion

# region Parsing Default arguments for descovery

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument("--timeout", type=int, default=5,
                    help="timeout to wait for receiving discovery responses")
parser.add_argument("--ip", default=None,
                    help="ip address to use in the discovery")
parser.add_argument("--dst-ip", default="255.255.255.255",
                    help="destination ip address to use in the discovery")
args = parser.parse_args()

# endregion

# region Declaring Flask app

app = Flask(__name__)
api = Api(app)

# endregion

# region Global Properties
_continu_to_sweep = False
_rf_sweep_message = ''
_rf_sweep_status = False

TICK = 32.84
IR_TOKEN = 0x26
TIMEOUT = 30

# endregion

# region Broadlink Helper Methods


def getDeviceName(deviceType):
    name = {
    0x0000:  "SP1  Broadlink",
    0x2711:  " SP2 Broadlink",
    0x2716:  " NEO PRO  Ankuoo",
    0x2717:  " NEO  Ankuoo",
    0x2719:  " SP2-compatible  Honeywell",
    0x271A:  " SP2-compatible  Honeywell",
    0x271D:  " Ego  Efergy",
    0x2720:  " SP mini  Broadlink",
    0x2728:  " SP2-compatible  URANT",
    0x2733:  " SP3  Broadlink",
    0x2736:  " SP mini+  Broadlink",
    0x273E:  " SP mini  Broadlink",
    0x7530:  " SP2  Broadlink ",
    0x7539:  " SP2-IL  Broadlink ",
    0x753E:  " SP mini 3  Broadlink",
    0x7540:  " MP2  Broadlink",
    0x7544:  " SP2-CL  Broadlink",
    0x7546:  " SP2-UK/BR/IN  Broadlink ",
    0x7547:  " SC1  Broadlink",
    0x7918:  " SP2  Broadlink ",
    0x7919:  " SP2-compatible  Honeywell",
    0x791A:  " SP2-compatible  Honeywell",
    0x7D00:  " SP3-EU  Broadlink ",
    0x7D0D:  " SP mini 3  Broadlink ",
    0x9479:  " SP3S-US  Broadlink",
    0x947A:  " SP3S-EU  Broadlink",
    0x756C:  " SP4M  Broadlink",
    0x756F:  " MCB1  Broadlink",
    0x7579:  " SP4L-EU  Broadlink",
    0x7583:  " SP mini 3  Broadlink",
    0x7D11:  " SP mini 3  Broadlink",
    0xA56A:  " MCB1  Broadlink",
    0xA589:  " SP4L-UK  Broadlink",
    0x5115:  " SCB1E  Broadlink",
    0x51E2:  " AHC/U-01  BG Electrical",
    0x6111:  " MCB1  Broadlink",
    0x6113:  " SCB1E  Broadlink",
    0x618B:  " SP4L-EU  Broadlink",
    0x6489:  " SP4L-AU  Broadlink",
    0x648B:  " SP4M-US  Broadlink",
    0x2712:  " RM pro/pro+  Broadlink",
    0x272A:  " RM pro  Broadlink",
    0x2737:  " RM mini 3  Broadlink",
    0x273D:  " RM pro  Broadlink",
    0x277C:  " RM home  Broadlink",
    0x2783:  " RM home  Broadlink",
    0x2787:  " RM pro  Broadlink",
    0x278B:  " RM plus  Broadlink",
    0x278F:  " RM mini  Broadlink",
    0x2797:  " RM pro+  Broadlink",
    0x279D:  " RM pro+  Broadlink",
    0x27A1:  " RM plus  Broadlink",
    0x27A6:  " RM plus  Broadlink",
    0x27A9:  " RM pro+  Broadlink",
    0x27C2:  " RM mini 3  Broadlink",
    0x27C3:  " RM pro+  Broadlink",
    0x27C7:  " RM mini 3  Broadlink",
    0x27CC:  " RM mini 3  Broadlink",
    0x27CD:  " RM mini 3  Broadlink",
    0x27D0:  " RM mini 3  Broadlink",
    0x27D1:  " RM mini 3  Broadlink",
    0x27D3:  " RM mini 3  Broadlink",
    0x27DE:  " RM mini 3  Broadlink",
    0x51DA:  " RM4 mini  Broadlink",
    0x5F36:  " RM mini 3  Broadlink",
    0x6026:  " RM4 pro  Broadlink",
    0x6070:  " RM4C mini  Broadlink",
    0x610E:  " RM4 mini  Broadlink",
    0x610F:  " RM4C mini  Broadlink",
    0x61A2:  " RM4 pro  Broadlink",
    0x62BC:  " RM4 mini  Broadlink",
    0x62BE:  " RM4C mini  Broadlink",
    0x6364:  " RM4S  Broadlink",
    0x648D:  " RM4 mini  Broadlink",
    0x649B:  " RM4 pro  Broadlink",
    0x6508:  " RM mini 3  Broadlink",
    0x6539:  " RM4C mini  Broadlink",
    0x653A:  " RM4 mini  Broadlink",
    0x653C:  " RM4 pro  Broadlink",
    0x2714:  " e-Sensor  Broadlink",
    0x4EB5:  " MP1-1K4S  Broadlink",
    0x4EF7:  " MP1-1K4S  Broadlink ",
    0x4F1B:  " MP1-1K3S2U  Broadlink ",
    0x4F65:  " MP1-1K3S2U  Broadlink",
    0x5043:  " SB800TD  Broadlink ",
    0x504E:  " LB1  Broadlink",
    0x60C7:  " LB1  Broadlink",
    0x60C8:  " LB1  Broadlink",
    0x6112:  " LB1  Broadlink",
    0x2722:  " S2KIT  Broadlink",
    0x4EAD:  " HY02B05H  Hysen",
    0x4E4D:  " DT360E-45/20  Dooya",
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


def initDevice(dtype, host, mac):
    _dtype = int(dtype, 0)
    _host = host
    _mac = bytearray.fromhex(mac)
    return broadlink.gendevice(_dtype, (_host, 80), _mac)


def GetDevicesFilePath():
    return os.path.join(app.root_path, 'data', 'devices.json')


def writeXml(_file):
    root = ET.Element("root")
    doc = ET.SubElement(root, "doc")
    ET.SubElement(doc, "field1", name="blah").text = "some value1"
    ET.SubElement(doc, "field2", name="asdfasd").text = "some vlaue2"
    tree = ET.ElementTree(root)
    tree.write(_file)

# endregion

# region UI Rendering Methods

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

# endregion UI Rendering Methods

# region API Methods

# Learn IR


@app.route('/temperature')
def temperature():
    logger.info("Getting temperature for device: " + request.args.get('host'))
    dev = initDevice(request.args.get('type'), request.args.get(
        'host'), request.args.get('mac'))
    dev.auth()
    try:
        logger.info("Success Getting temperature for device: " + request.args.get('host'))
        return jsonify('{"data":"'+dev.check_temperature()+'","success":"1"}')
    except:
        logger.info("Error Getting temperature for device: " + request.args.get('host'))
        return jsonify('{"data":"Method Not Supported","success":"0"}')


@app.route('/ir/learn')
def learnir():
    logger.info("Learning IR Code for device: " + request.args.get('host'))
    dev = initDevice(request.args.get('type'), request.args.get(
        'host'), request.args.get('mac'))
    dev.auth()
    logger.info("Entering IR Learning Mode")
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
        logger.error("No IR Data")
        return jsonify('{"data":"","success":0,"message":"No Data Recived"}')
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    logger.info("IR Learn success")
    return jsonify('{"data":"' + learned + '","success":1,"message":"IR Data Recived"}')

# Send IR/RF


@app.route('/command/send')
def command():
    logger.info("Sending Command (IR/RF) using device: " + request.args.get('host'))
    dev = initDevice(request.args.get('type'), request.args.get(
        'host'), request.args.get('mac'))
    command = request.args.get('command')
    logger.info("Sending command: " + request.args.get('command'))
    dev.auth()
    try:
        dev.send_data(bytearray.fromhex(''.join(command)))
        logger.info("Command sent successfully")
        return jsonify('{"data":"","success":1,"message":"Command sent successfully"}')
    except Exception as ex:
        logger.info("Error in sending command, the exception was: " + str(ex))
        return jsonify('{"data":"","success":0,"message":"Error occurred while Sending command!"}')


# Learn RF
@app.route('/rf/learn')
def sweep():
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    _continu_to_sweep = False
    _rf_sweep_message = ''
    _rf_sweep_status = False
    logger.info("Device:" + request.args.get('host') + " entering RF learning mode" )
    dev = initDevice(request.args.get('type'), request.args.get(
        'host'), request.args.get('mac'))
    dev.auth()
    logger.info("Device:" + request.args.get('host') + " is sweeping for frequency")
    dev.sweep_frequency()
    _rf_sweep_message = "Learning RF Frequency, press and hold the button to learn..."
    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        if dev.check_frequency():
            break
    else:
        logger.error("Device:" + request.args.get('host') + " RF Frequency not found!")
        _rf_sweep_message = "RF Frequency not found!"
        dev.cancel_sweep_frequency()
        return jsonify('{"data":"RF Frequency not found!","success":0}')

    _rf_sweep_message = "Found RF Frequency - 1 of 2!"
    logger.info("Device:" + request.args.get('host') + " Found RF Frequency - 1 of 2!")
    time.sleep(1)
    _rf_sweep_message = "You can now let go of the button"
    logger.info("You can now let go of the button")
    _rf_sweep_status = True
    while _continu_to_sweep == False:
        _rf_sweep_message = "Click The Continue button"

    _rf_sweep_message = "To complete learning, single press the button you want to learn"
    logger.info("To complete learning, single press the button you want to learn")
    _rf_sweep_status = False
    logger.error("Device:" + request.args.get('host') + " is searching for RF packets!")
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
        logger.error("Device:" + request.args.get('host') + " No Data Found!")
        _rf_sweep_message = "No Data Found"
        return jsonify('{"data":"No Data Found"}')

    _rf_sweep_message = "Found RF Frequency - 2 of 2!"
    logger.error("Device:" + request.args.get('host') + " Found RF Frequency - 2 of 2!")
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    _rf_sweep_message = "RF Scan Completed Successfully"
    logger.error("Device:" + request.args.get('host') + " RF Scan Completed Successfully")
    time.sleep(1)
    return jsonify('{"data":"' + learned + '"}')

# Get RF Learning state


@app.route('/rf/status')
def rfstatus():
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    return jsonify('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')

# Continue with RF Scan


@app.route('/rf/continue')
def rfcontinue():
    global _continu_to_sweep
    global _rf_sweep_status
    _rf_sweep_status = True
    _continu_to_sweep = True
    return jsonify('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')

# Join Wifi


@app.route('/setup')
def setup():
    try:
        essid = request.args.get('essid')
        wifipass = request.args.get('wifipass')
        broadlink.setup(essid, wifipass, 4)
        return "{'data':'1'}"
    except:
        return "{'data':'0'}"

# Save Devices List to json file


@app.route('/devices/save', methods=['POST', 'GET'])
def save_devices():
    logger.info("Writing devices to file")
    try:
        data = list(request.form.keys())[0]
        with open(GetDevicesFilePath(), 'w') as f:
            f.write(str(data).replace("'", "\""))
        logger.info("Finished writing devices to file")
        return jsonify('{"success":1}')
    except Exception as ex:
        logger.error(
            "Writing devices to file faild has faild with the following exception: " + str(ex))
        return jsonify('{"success":0}')

# Load Devices from json file


@app.route('/devices/load')
def load_devices():
    try:
        logger.info("Reading devices from file")
        time.sleep(3)
        f = open(GetDevicesFilePath(), "r")
        return jsonify(f.read().replace("'", "\""))
    except Exception as ex:
        logger.error(
            "Loading devices from file has faild with the following exception: " + str(ex))
        return jsonify('{"success":0}')

# Search for devices in the network


@app.route('/autodiscover')
def autodiscover():
    _devices = ''
    if path.exists(GetDevicesFilePath()):
        return load_devices()
    else:
        logger.info("Searcing for devices...")
        _devices = '['
        devices = broadlink.discover(timeout=5, local_ip_address=None, discover_ip_address="255.255.255.255")
        for device in devices:
            if device.auth():
                logger.info("New device detected: " + getDeviceName(device.devtype) + " (ip: " + device.host[0] +  ", mac: " + ''.join(format(x, '02x') for x in device.mac) +  ")")
                _devices = _devices + '{"name":"' + \
                    getDeviceName(device.devtype) + '",'
                _devices = _devices + '"type":"' + \
                    format(hex(device.devtype)) + '",'
                _devices = _devices + '"ip":"' + device.host[0] + '",'
                _devices = _devices + '"mac":"' + \
                    ''.join(format(x, '02x') for x in device.mac) + '"},'

        if len(_devices)==1:
            _devices = _devices + ']'
            logger.debug("No Devices Found " + str(_devices))
        else:
            _devices = _devices[:-1] + ']'
            logger.debug("Devices Found " + str(_devices))
        return jsonify(_devices)


@app.route('/discover')
def discover():
    logger.info("Searching for devices...")
    _devices = '['
    devices = broadlink.discover(
        timeout=5, local_ip_address=None, discover_ip_address="255.255.255.255")
    for device in devices:
        if device.auth():
            logger.info("New device detected: " + getDeviceName(device.devtype) + " (ip: " + device.host[0] +  ", mac: " + ''.join(format(x, '02x') for x in device.mac) +  ")")
            _devices = _devices + '{"name":"' + \
                getDeviceName(device.devtype) + '",'
            _devices = _devices + '"type":"' + \
                format(hex(device.devtype)) + '",'
            _devices = _devices + '"ip":"' + device.host[0] + '",'
            _devices = _devices + '"mac":"' + \
                ''.join(format(x, '02x') for x in device.mac) + '"},'
    if len(_devices) == 1:
        logger.error("No devices found")
        _devices = _devices + ']'
    else:
        logger.info("devices Found")
        _devices = _devices[:-1] + ']'
    return jsonify(_devices)

@app.route('/ping')
def get_device_status():
    p = subprocess.Popen("fping -C1 -q "+ request.args.get('host') +"  2>&1 | grep -v '-' | wc -l", stdout=subprocess.PIPE, shell=True)
    (output, err) = p.communicate()
    p_status = p.wait()
    status = re.findall('\d+', str(output))[0]
    if status=="1":
        return jsonify('{"data":"onlien","success":"1"}')
    else:
        return jsonify('{"data":"offline","success":"0"}')



# endregion API Methods


# region Serving Static Files

# Serve Javascript
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('dist/js', path)

# Serve CSS


@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('dist/css', path)

# Serve Images


@app.route('/img/<path:path>')
def send_img(path):
    return send_from_directory('dist/img', path)

# Serve Fonts


@app.route('/webfonts/<path:path>')
def send_webfonts(path):
    return send_from_directory('dist/webfonts', path)

# endregion


# Start Application
if __name__ == '__main__':
    logger.info(f"Broadllink Manager is up and running")
    app.run(debug=True, host='0.0.0.0', port=7020)
