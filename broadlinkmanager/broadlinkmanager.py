# region Importing

import os
import subprocess
import time
import broadlink
import argparse
import re
import uvicorn
from code import Code
from os import environ, path
from json import dumps
from sqliteconnector import SqliteConnector
from broadlink.exceptions import ReadError, StorageError
from broadlink import exceptions as e
from broadlink.const import DEFAULT_BCAST_ADDR, DEFAULT_PORT, DEFAULT_TIMEOUT
from broadlink.alarm import S1C
from broadlink.climate import hysen
from broadlink.cover import dooya
from broadlink.device import Device, ping, scan
from broadlink.light import lb1, lb2
from broadlink.remote import rm, rm4, rm4mini, rm4pro, rmmini, rmminib, rmpro
from broadlink.sensor import a1
from broadlink.switch import bg1, mp1, sp1, sp2, sp2s, sp3, sp3s, sp4, sp4b
from subprocess import call
from loguru import logger
from fastapi import FastAPI, Request, File, Form, UploadFile
from fastapi.responses import UJSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette_exporter import PrometheusMiddleware, handle_metrics


# Use to disable Google analytics code
ENABLE_GOOGLE_ANALYTICS = os.getenv("ENABLE_GOOGLE_ANALYTICS")
# endregion

ip_format_regex = r"\b(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]))\b"

db = SqliteConnector()
db.create_tables()
logger.info("OS: " + os.name)

def validate_ip(ip):
    return True if re.search(ip_format_regex, ip) else False


def parse_ip_list(iplist):
    parsed_ip_list = re.findall(ip_format_regex, iplist)
    return [item[0] for item in parsed_ip_list]


def get_local_ip_list():
    p = subprocess.Popen("hostname -I", stdout=subprocess.PIPE, shell=True)
    (output, err) = p.communicate()
    p_status = p.wait()
    result = parse_ip_list(str(output))
    logger.debug(f"Locally discovered IP List {result}")
    return result


def get_env_ip_list():
    env_ip_list = os.getenv("DISCOVERY_IP_LIST", "")
    result = parse_ip_list(str(env_ip_list))
    logger.debug(f"Environment discovered IP List {result}")
    return result


# Get version from version file for dynamic change


def GetVersionFromFle():
    with open("VERSION", "r") as version:
        v = version.read()
        return v


# Tags metadata for swagger docs
tags_metadata = [

    {
        "name": "Commands",
        "description": "Learn / Send RF or IR commands",

    },
    {
        "name": "Devices",
        "description": "Scan for devices on the network or load/save from/to file",

    },

]


# region Parsing Default arguments for discovery

parser = argparse.ArgumentParser(fromfile_prefix_chars='@')
parser.add_argument("--timeout", type=int, default=5,
                    help="timeout to wait for receiving discovery responses")
parser.add_argument("--ip", action='append', default=[],
                    help="ip address(es) to use in the discovery. Use as --ip <IP_A> --ip <IP_B>")
parser.add_argument("--dst-ip", default="255.255.255.255",
                    help="destination ip address to use in the discovery")
args = parser.parse_args()

# Assign proper ip addresses to perform discovery
discovery_ip_address_list = []
env_ip_address_list = get_env_ip_list()
if args.ip:
    invalid_ip_list = [ip for ip in args.ip if not validate_ip(ip)]
    if len(invalid_ip_list) > 0:
        logger.error(f"Given IP(s) ({str(invalid_ip_list)}) are invalid")
        exit(-1)
    discovery_ip_address_list = args.ip
elif env_ip_address_list:
    discovery_ip_address_list = env_ip_address_list
else:
    discovery_ip_address_list = get_local_ip_list()

logger.info(f"Broadlink will try to discover devices on the following IP interfaces: {discovery_ip_address_list}")


# endregion

# region Declaring FastAPI app

app = FastAPI(title="Apprise API", description="Send multi channel notification using single endpoint", version=GetVersionFromFle(
), openapi_tags=tags_metadata, contact={"name": "Tomer Klein", "email": "tomer.klein@gmail.com", "url": "https://github.com/t0mer/broadlinkmanager-docker"})
logger.info("Configuring app")
app.mount("/dist", StaticFiles(directory="dist"), name="dist")
app.mount("/js", StaticFiles(directory="dist/js"), name="js")
app.mount("/css", StaticFiles(directory="dist/css"), name="css")
app.mount("/img", StaticFiles(directory="dist/img"), name="css")
app.mount("/webfonts", StaticFiles(directory="dist/webfonts"), name="css")
templates = Jinja2Templates(directory="templates/")
app.add_middleware(PrometheusMiddleware)
app.add_route("/metrics", handle_metrics)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def get_analytics_code():
    try:
        if ENABLE_GOOGLE_ANALYTICS == "True":
            analytics_file_path = os.path.join(
                app.root_path, 'templates', 'analytics_code.html')
            f = open(analytics_file_path, "r")
            content = f.read()
            f.close()
            logger.info('Content: ' + content)
            return content
        else:
            return ''
    except Exception as e:
        logger.error(str(e))
        return ''


analytics_code = get_analytics_code()


def getDeviceName(deviceType):
    name = {
        0x0000: "SP1 ( Broadlink)",
        0x2717: "NEO ( Ankuoo)",
        0x2719: "SP2-compatible ( Honeywell)",
        0x271A: "SP2-compatible ( Honeywell)",
        0x2720: "SPmini ( Broadlink)",
        0x2728: "SP2-compatible ( URANT)",
        0x273E: "SPmini ( Broadlink)",
        0x7530: "SP2 ( Broadlink(OEM)",
        0x7539: "SP2-IL ( Broadlink(OEM)",
        0x753E: "SPmini3 ( Broadlink)",
        0x7540: "MP2 ( Broadlink)",
        0x7544: "SP2-CL ( Broadlink)",
        0x7546: "SP2-UK/BR/IN ( Broadlink(OEM)",
        0x7547: "SC1 ( Broadlink)",
        0x7918: "SP2 ( Broadlink(OEM)",
        0x7919: "SP2-compatible ( Honeywell)",
        0x791A: "SP2-compatible ( Honeywell)",
        0x7D0D: "SPmini3 ( Broadlink(OEM)",
        0x2711: "SP2 ( Broadlink)",
        0x2716: "NEOPRO ( Ankuoo)",
        0x271D: "Ego ( Efergy)",
        0x2736: "SPmini+ ( Broadlink)",
        0x2733: "SP3 ( Broadlink)",
        0x7D00: "SP3-EU ( Broadlink(OEM)",
        0x9479: "SP3S-US ( Broadlink)",
        0x947A: "SP3S-EU ( Broadlink)",
        0x7568: "SP4L-CN ( Broadlink)",
        0x756C: "SP4M ( Broadlink)",
        0x756F: "MCB1 ( Broadlink)",
        0x7579: "SP4L-EU ( Broadlink)",
        0x757B: "SP4L-AU ( Broadlink)",
        0x7583: "SPmini3 ( Broadlink)",
        0x7587: "SP4L-UK ( Broadlink)",
        0x7D11: "SPmini3 ( Broadlink)",
        0xA56A: "MCB1 ( Broadlink)",
        0xA56B: "SCB1E ( Broadlink)",
        0xA56C: "SP4L-EU ( Broadlink)",
        0xA589: "SP4L-UK ( Broadlink)",
        0xA5D3: "SP4L-EU ( Broadlink)",
        0x5115: "SCB1E ( Broadlink)",
        0x51E2: "AHC/U-01 ( BGElectrical)",
        0x6111: "MCB1 ( Broadlink)",
        0x6113: "SCB1E ( Broadlink)",
        0x618B: "SP4L-EU ( Broadlink)",
        0x6489: "SP4L-AU ( Broadlink)",
        0x648B: "SP4M-US ( Broadlink)",
        0x6494: "SCB2 ( Broadlink)",
        0x2737: "RMmini3 ( Broadlink)",
        0x278F: "RMmini ( Broadlink)",
        0x27C2: "RMmini3 ( Broadlink)",
        0x27C7: "RMmini3 ( Broadlink)",
        0x27CC: "RMmini3 ( Broadlink)",
        0x27CD: "RMmini3 ( Broadlink)",
        0x27D0: "RMmini3 ( Broadlink)",
        0x27D1: "RMmini3 ( Broadlink)",
        0x27D3: "RMmini3 ( Broadlink)",
        0x27DC: "RMmini3 ( Broadlink)",
        0x27DE: "RMmini3 ( Broadlink)",
        0x2712: "RMpro/pro+ ( Broadlink)",
        0x272A: "RMpro ( Broadlink)",
        0x273D: "RMpro ( Broadlink)",
        0x277C: "RMhome ( Broadlink)",
        0x2783: "RMhome ( Broadlink)",
        0x2787: "RMpro ( Broadlink)",
        0x278B: "RMplus ( Broadlink)",
        0x2797: "RMpro+ ( Broadlink)",
        0x279D: "RMpro+ ( Broadlink)",
        0x27A1: "RMplus ( Broadlink)",
        0x27A6: "RMplus ( Broadlink)",
        0x27A9: "RMpro+ ( Broadlink)",
        0x27C3: "RMpro+ ( Broadlink)",
        0x5F36: "RMmini3 ( Broadlink)",
        0x6507: "RMmini3 ( Broadlink)",
        0x6508: "RMmini3 ( Broadlink)",
        0x51DA: "RM4mini ( Broadlink)",
        0x520D: "RM4C mini (Broadlink)",
        0x6070: "RM4Cmini ( Broadlink)",
        0x610E: "RM4mini ( Broadlink)",
        0x610F: "RM4Cmini ( Broadlink)",
        0x62BC: "RM4mini ( Broadlink)",
        0x62BE: "RM4Cmini ( Broadlink)",
        0x6364: "RM4S ( Broadlink)",
        0x648D: "RM4mini ( Broadlink)",
        0x6539: "RM4Cmini ( Broadlink)",
        0x653A: "RM4mini ( Broadlink)",
        0x6026: "RM4pro ( Broadlink)",
        0x6184: "RM4Cpro ( Broadlink)",
        0x61A2: "RM4pro ( Broadlink)",
        0x649B: "RM4pro ( Broadlink)",
        0x653C: "RM4pro ( Broadlink)",
        0x2714: "e-Sensor ( Broadlink)",
        0x5043: "SB800TD ( Broadlink(OEM)",
        0x504E: "LB1 ( Broadlink)",
        0x606E: "SB500TD ( Broadlink(OEM)",
        0x60C7: "LB1 ( Broadlink)",
        0x60C8: "LB1 ( Broadlink)",
        0x6112: "LB1 ( Broadlink)",
        0xA4F4: "LB27R1 ( Broadlink)",
        0x2722: "S2KIT ( Broadlink)",
        0xA59C: "S3 (Broadlink)",
        0xA64D: "S3 (Broadlink)",
        0x4EAD: "HY02/HY03 ( Hysen)",
        0x4E4D: "DT360E-45/20 ( Dooya)",
        0x51E3: "BG800/BG900 ( BGElectrical)",
        0xA569: "SP4L-UK ( Broadlink)",
        0x520C: "RM4 mini ( Broadlink)",
        0x5212: "RM4 TV (mate Broadlink)",
        0x5211: "RM4C mate (Broadlink)",
        0x521C: "RM4 mini (Broadlink)",
        0x5216: "RM4 mini (Broadlink)",
        0x520B: "RM4 pro (Broadlink)",
        0x5218: "RM4C pro (Broadlink)",
        0x5209: "RM4 TV mate (Broadlink)",
        0x5213: "RM4 pro (Broadlink)",
        0x644B: "LB1 (Broadlink)",
        0x644C: "LB27 R1 (Broadlink)",        
        0x644E: "LB26 R1 (Broadlink)",
        0xA5F7: "LB27 R1 (Broadlink)",
        0x648C: "SP4L-US (Broadlink)",


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
    dtypeTmp = dtype
    if dtypeTmp == '0x6539':
        dtypeTmp = '0x610F'
    _dtype = int(dtypeTmp, 0)
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


@app.get('/', include_in_schema=False)
def devices(request: Request):
    return templates.TemplateResponse('index.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/index', include_in_schema=False)
def home(request: Request):
    return devices(request)


@app.get('/generator', include_in_schema=False)
def generator(request: Request):
    return templates.TemplateResponse('generator.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/livolo', include_in_schema=False)
def livolo(request: Request):
    return templates.TemplateResponse('livolo.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/energenie', include_in_schema=False)
def energenie(request: Request):
    return templates.TemplateResponse('energenie.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/repeats', include_in_schema=False)
def repeats(request: Request):
    return templates.TemplateResponse('repeats.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/convert', include_in_schema=False)
def convert(request: Request):
    return templates.TemplateResponse('convert.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/about', include_in_schema=False)
def about(request: Request):
    return templates.TemplateResponse('about.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/saved', include_in_schema=False)
def about(request: Request):
    return templates.TemplateResponse('saved.html', context={'request': request, 'analytics': analytics_code, 'version': GetVersionFromFle()})


@app.get('/temperature', tags=["Commands"], summary="Read Temperature")
def temperature(request: Request, mac: str = "", host: str = "", type: str = ""):
    logger.info("Getting temperature for device: " + host)
    dev = initDevice(type, host, mac)
    dev.auth()
    try:
        return JSONResponse('{"data":"'+dev.check_temperature()+'","success":"1"}')
    except:
        logger.info("Error Getting temperature for device: " + host)
        return JSONResponse('{"data":"Method Not Supported","success":"0"}')


@app.get('/ir/learn', tags=["Commands"], summary="Learn IR code")
def learnir(request: Request, mac: str = "", host: str = "", type: str = "", command: str = ""):
    logger.info("Learning IR Code for device: " + host)
    dev = initDevice(type, host, mac)
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
        return JSONResponse('{"data":"","success":0,"message":"No Data Received","type":"ir"}')
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    logger.info("IR Learn success")
    return JSONResponse('{"data":"' + learned + '","success":1,"message":"IR Data Received","type":"ir"}')

# Send IR/RF


@app.get('/command/send', tags=["Commands"], summary="Send IR/RF Command")
def command(request: Request, mac: str = "", host: str = "", type: str = "", command: str = ""):
    logger.info("Sending Command (IR/RF) using device: " + host)
    dev = initDevice(type, host, mac)
    logger.info("Sending command: " + command)
    dev.auth()
    try:
        dev.send_data(bytearray.fromhex(''.join(command)))
        logger.info("Command sent successfully")
        return JSONResponse('{"data":"","success":1,"message":"Command sent successfully"}')
    except Exception as ex:
        logger.info("Error in sending command, the exception was: " + str(ex))
        return JSONResponse('{"data":"","success":0,"message":"Error occurred while Sending command!"}')


# Learn RF
@app.get('/rf/learn', include_in_schema=False)
def sweep(request: Request, mac: str = "", host: str = "", type: str = "", command: str = ""):
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    _continu_to_sweep = False
    _rf_sweep_message = ''
    _rf_sweep_status = False
    logger.info("Device:" + host + " entering RF learning mode")
    dev = initDevice(type, host, mac)
    dev.auth()
    logger.info("Device:" + host + " is sweeping for frequency")
    dev.sweep_frequency()
    _rf_sweep_message = "Learning RF Frequency, press and hold the button to learn..."
    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        if dev.check_frequency():
            break
    else:
        logger.error("Device:" + host + " RF Frequency not found!")
        _rf_sweep_message = "RF Frequency not found!"
        dev.cancel_sweep_frequency()
        return JSONResponse('{"data":"RF Frequency not found!","success":0,"type":"rf"}')

    _rf_sweep_message = "Found RF Frequency - 1 of 2!"
    logger.info("Device:" + host + " Found RF Frequency - 1 of 2!")
    time.sleep(1)
    _rf_sweep_message = "You can now let go of the button"
    logger.info("You can now let go of the button")
    _rf_sweep_status = True
    while _continu_to_sweep == False:
        _rf_sweep_message = "Click The Continue button"

    _rf_sweep_message = "To complete learning, single press the button you want to learn"
    logger.info(
        "To complete learning, single press the button you want to learn")
    _rf_sweep_status = False
    logger.error("Device:" + host + " is searching for RF packets!")
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
        logger.error("Device:" + host + " No Data Found!")
        _rf_sweep_message = "No Data Found"
        return JSONResponse('{"data":"No Data Found","type":"rf","type":"rf"}')

    _rf_sweep_message = "Found RF Frequency - 2 of 2!"
    logger.info("Device:" + host + " Found RF Frequency - 2 of 2!")
    learned = ''.join(format(x, '02x') for x in bytearray(data))
    _rf_sweep_message = "RF Scan Completed Successfully"
    logger.info("Device:" + host + " RF Scan Completed Successfully")
    time.sleep(1)
    return JSONResponse('{"data":"' + learned + '","type":"rf"}')

# Get RF Learning state


@app.get('/rf/status', include_in_schema=False)
def rfstatus(request: Request):
    global _continu_to_sweep
    global _rf_sweep_message
    global _rf_sweep_status
    return JSONResponse('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')

# Continue with RF Scan


@app.get('/rf/continue', include_in_schema=False)
def rfcontinue(request: Request):
    global _continu_to_sweep
    global _rf_sweep_status
    _rf_sweep_status = True
    _continu_to_sweep = True
    return JSONResponse('{"_continu_to_sweep":"' + str(_continu_to_sweep) + '","_rf_sweep_message":"' + _rf_sweep_message + '","_rf_sweep_status":"' + str(_rf_sweep_status) + '" }')


# Save Devices List to json file

@app.post('/devices/save', include_in_schema=False)
async def save_devices_to_file(request: Request):
    data = await request.json()
    logger.info("Writing devices to file")
    try:
        with open(GetDevicesFilePath(), 'w') as f:
            f.write(str(data).replace("'", "\""))
        logger.info("Finished writing devices to file")
        return JSONResponse('{"success":1}')
    except Exception as ex:
        logger.error(
            "Writing devices to file failed with the following exception: " + str(ex))
        return JSONResponse('{"success":0}')

# Load Devices from json file


@app.get('/devices/load', include_in_schema=False)
def load_devices_from_file(request: Request):
    try:
        logger.info("Reading devices from file")
        time.sleep(3)
        f = open(GetDevicesFilePath(), "r")
        return JSONResponse(f.read().replace("'", "\""))
    except Exception as ex:
        logger.error(
            "Loading devices from file has failed with the following exception: " + str(ex))
        return JSONResponse('{"success":0}')

# Search for devices in the network


@app.get('/autodiscover', tags=["Devices"])
def search_for_devices(request: Request, freshscan: str = "1"):
    result = []
    if path.exists(GetDevicesFilePath()) and freshscan != "1":
        return load_devices_from_file(request)
    else:
        logger.info("Searching for devices...")
        for interface in discovery_ip_address_list:
            logger.info(f"Checking devices on interface assigned with IP: {interface}")
            try:
                devices = broadlink.discover(
                    timeout=5, local_ip_address=interface, discover_ip_address="255.255.255.255")
                for device in devices:
                    if device.auth():
                        mac_address = ''.join(format(x, '02x') for x in device.mac)
                        logger.info(f"New device detected: {getDeviceName(device.devtype)} (ip: {device.host[0]}  mac: {mac_address})")
                        deviceinfo = {}
                        deviceinfo["name"] = getDeviceName(device.devtype)
                        deviceinfo["type"] = format(hex(device.devtype))
                        deviceinfo["ip"] = device.host[0]
                        deviceinfo["mac"] = mac_address
                        result.append(deviceinfo)
            except OSError as error:
                logger.error(f"Error while trying to discover addresses from ip ({interface}). Error says: {error}")

        logger.debug(f"Devices Found: {str(result)}")
        return JSONResponse(result)


@app.get('/device/ping', tags=["Devices"])
def get_device_status(request: Request, host: str = ""):
    try:
        if host == "":
            logger.error("Host must be a valid ip or hostname")
            return JSONResponse('{"status":"Host must be a valid ip or hostname","success":"0"}')
        p = subprocess.Popen(
            "fping -C1 -q " + host + "  2>&1 | grep -v '-' | wc -l", stdout=subprocess.PIPE, shell=True)
        logger.debug(host)
        (output, err) = p.communicate()
        p_status = p.wait()
        logger.debug(str(output))
        status = re.findall('\d+', str(output))[0]
        if status == "1":
            return JSONResponse('{"status":"online","success":"1"}')
        else:
            return JSONResponse('{"status":"offline","success":"1"}')
    except Exception as e:
        logger.error("Error pinging " + host + " Error: " + str(e))
        return JSONResponse('{"status":"Error pinging ' + host + '" ,"success":"0"}')

# endregion API Methods


@app.post("/api/code")
def create_code(code: Code):
    return db.insert_code(code.CodeType, code.CodeName, code.Code)

@app.put("/api/code/{code_id}")
def update_code(code_id: int, code: Code):
    return db.update_code(code_id, code.CodeType, code.CodeName, code.Code)

@app.delete("/api/code/{code_id}")
def delete_code(code_id: int):
    return db.delete_code(code_id)

@app.get("/api/code/{code_id}")
def read_code(code_id: int):
    return db.select_code(code_id)

@app.get("/api/codes")
def read_all_codes():
    return db.select_all_codes(api_call=True)



# Start Application
if __name__ == '__main__':
    logger.info("Broadlink Manager is up and running")
    uvicorn.run(app, host="0.0.0.0", port=7020)
