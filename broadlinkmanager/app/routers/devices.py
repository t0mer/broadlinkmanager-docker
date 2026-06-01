import json
import re
import subprocess
from os import path

_HOST_RE = re.compile(r"^[a-zA-Z0-9._-]{1,253}$")

import broadlink
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from loguru import logger

from app.config import args, discovery_ip_address_list, get_devices_file_path

router = APIRouter(tags=["Devices"])

_DEVICE_NAMES: dict[int, str] = {
    0x0000: "SP1 (Broadlink)", 0x2717: "NEO (Ankuoo)", 0x2719: "SP2-compatible (Honeywell)",
    0x271A: "SP2-compatible (Honeywell)", 0x2720: "SPmini (Broadlink)", 0x2728: "SP2-compatible (URANT)",
    0x273E: "SPmini (Broadlink)", 0x7530: "SP2 (Broadlink OEM)", 0x7539: "SP2-IL (Broadlink OEM)",
    0x753E: "SPmini3 (Broadlink)", 0x7540: "MP2 (Broadlink)", 0x7544: "SP2-CL (Broadlink)",
    0x7546: "SP2-UK/BR/IN (Broadlink OEM)", 0x7547: "SC1 (Broadlink)", 0x7918: "SP2 (Broadlink OEM)",
    0x7919: "SP2-compatible (Honeywell)", 0x791A: "SP2-compatible (Honeywell)",
    0x7D0D: "SPmini3 (Broadlink OEM)", 0x2711: "SP2 (Broadlink)", 0x2716: "NEOPRO (Ankuoo)",
    0x271D: "Ego (Efergy)", 0x2736: "SPmini+ (Broadlink)", 0x2733: "SP3 (Broadlink)",
    0x7D00: "SP3-EU (Broadlink OEM)", 0x9479: "SP3S-US (Broadlink)", 0x947A: "SP3S-EU (Broadlink)",
    0x7568: "SP4L-CN (Broadlink)", 0x756C: "SP4M (Broadlink)", 0x756F: "MCB1 (Broadlink)",
    0x7579: "SP4L-EU (Broadlink)", 0x757B: "SP4L-AU (Broadlink)", 0x7583: "SPmini3 (Broadlink)",
    0x7587: "SP4L-UK (Broadlink)", 0x7D11: "SPmini3 (Broadlink)", 0xA56A: "MCB1 (Broadlink)",
    0xA56B: "SCB1E (Broadlink)", 0xA56C: "SP4L-EU (Broadlink)", 0xA589: "SP4L-UK (Broadlink)",
    0xA5D3: "SP4L-EU (Broadlink)", 0x5115: "SCB1E (Broadlink)", 0x51E2: "AHC/U-01 (BGElectrical)",
    0x6111: "MCB1 (Broadlink)", 0x6113: "SCB1E (Broadlink)", 0x618B: "SP4L-EU (Broadlink)",
    0x6489: "SP4L-AU (Broadlink)", 0x648B: "SP4M-US (Broadlink)", 0x6494: "SCB2 (Broadlink)",
    0x2737: "RMmini3 (Broadlink)", 0x278F: "RMmini (Broadlink)", 0x27C2: "RMmini3 (Broadlink)",
    0x27C7: "RMmini3 (Broadlink)", 0x27CC: "RMmini3 (Broadlink)", 0x27CD: "RMmini3 (Broadlink)",
    0x27D0: "RMmini3 (Broadlink)", 0x27D1: "RMmini3 (Broadlink)", 0x27D3: "RMmini3 (Broadlink)",
    0x27DC: "RMmini3 (Broadlink)", 0x27DE: "RMmini3 (Broadlink)", 0x2712: "RMpro/pro+ (Broadlink)",
    0x272A: "RMpro (Broadlink)", 0x273D: "RMpro (Broadlink)", 0x277C: "RMhome (Broadlink)",
    0x2783: "RMhome (Broadlink)", 0x2787: "RMpro (Broadlink)", 0x278B: "RMplus (Broadlink)",
    0x2797: "RMpro+ (Broadlink)", 0x279D: "RMpro+ (Broadlink)", 0x27A1: "RMplus (Broadlink)",
    0x27A6: "RMplus (Broadlink)", 0x27A9: "RMpro+ (Broadlink)", 0x27C3: "RMpro+ (Broadlink)",
    0x5F36: "RMmini3 (Broadlink)", 0x6507: "RMmini3 (Broadlink)", 0x6508: "RMmini3 (Broadlink)",
    0x51DA: "RM4mini (Broadlink)", 0x520D: "RM4C mini (Broadlink)", 0x6070: "RM4Cmini (Broadlink)",
    0x610E: "RM4mini (Broadlink)", 0x610F: "RM4Cmini (Broadlink)", 0x62BC: "RM4mini (Broadlink)",
    0x62BE: "RM4Cmini (Broadlink)", 0x6364: "RM4S (Broadlink)", 0x648D: "RM4mini (Broadlink)",
    0x6539: "RM4Cmini (Broadlink)", 0x653A: "RM4mini (Broadlink)", 0x6026: "RM4pro (Broadlink)",
    0x6184: "RM4Cpro (Broadlink)", 0x61A2: "RM4pro (Broadlink)", 0x649B: "RM4pro (Broadlink)",
    0x653C: "RM4pro (Broadlink)", 0x2714: "e-Sensor (Broadlink)", 0x5043: "SB800TD (Broadlink OEM)",
    0x504E: "LB1 (Broadlink)", 0x606E: "SB500TD (Broadlink OEM)", 0x60C7: "LB1 (Broadlink)",
    0x60C8: "LB1 (Broadlink)", 0x6112: "LB1 (Broadlink)", 0xA4F4: "LB27R1 (Broadlink)",
    0x2722: "S2KIT (Broadlink)", 0xA59C: "S3 (Broadlink)", 0xA64D: "S3 (Broadlink)",
    0x4EAD: "HY02/HY03 (Hysen)", 0x4E4D: "DT360E-45/20 (Dooya)", 0x51E3: "BG800/BG900 (BGElectrical)",
    0xA569: "SP4L-UK (Broadlink)", 0x520C: "RM4 mini (Broadlink)", 0x5212: "RM4 TV mate (Broadlink)",
    0x5211: "RM4C mate (Broadlink)", 0x521C: "RM4 mini (Broadlink)", 0x5216: "RM4 mini (Broadlink)",
    0x520B: "RM4 pro (Broadlink)", 0x5218: "RM4C pro (Broadlink)", 0x5209: "RM4 TV mate (Broadlink)",
    0x5213: "RM4 pro (Broadlink)", 0x644B: "LB1 (Broadlink)", 0x644C: "LB27 R1 (Broadlink)",
    0x644E: "LB26 R1 (Broadlink)", 0xA5F7: "LB27 R1 (Broadlink)", 0x648C: "SP4L-US (Broadlink)",
}


def _get_device_name(devtype: int) -> str:
    return _DEVICE_NAMES.get(devtype, "Not Supported")


def _process_device(device) -> dict | None:
    try:
        if not device.auth():
            logger.warning(f"Auth failed for {device.host[0]}")
            return None
        mac = "".join(format(x, "02x") for x in device.mac)
        name = _get_device_name(device.devtype)
        logger.info(f"Found: {name} at {device.host[0]} ({mac})")
        return {"name": name, "type": format(hex(device.devtype)), "ip": device.host[0], "mac": mac}
    except Exception as e:
        logger.error(f"Error processing device: {e}")
        return None


@router.get("/autodiscover", tags=["Devices"])
def autodiscover(freshscan: str = "1"):
    devices_path = get_devices_file_path()
    if path.exists(devices_path) and freshscan != "1":
        try:
            with open(devices_path, "r") as f:
                return JSONResponse(json.load(f))
        except Exception as e:
            logger.error(f"Failed to load devices file: {e}")

    logger.info("Scanning for devices...")
    found: list[dict] = []
    for iface in discovery_ip_address_list:
        try:
            devices = broadlink.discover(timeout=5, local_ip_address=iface, discover_ip_address=args.dst_ip)
            for d in devices:
                info = _process_device(d)
                if info:
                    found.append(info)
        except OSError as e:
            logger.error(f"Discovery failed on {iface}: {e}")
    logger.info(f"Found {len(found)} device(s)")
    return JSONResponse(found)


@router.get("/device/ping", tags=["Devices"])
def ping_device(host: str = ""):
    if not host:
        return JSONResponse({"status": "Host parameter is required", "success": False})
    if not _HOST_RE.match(host):
        logger.warning(f"Rejected invalid host value: {host!r}")
        return JSONResponse({"status": "invalid host", "success": False})
    try:
        # "--" terminates option parsing so a host that starts with "-" is never
        # interpreted as a ping flag (defence-in-depth; regex above already rejects it)
        result = subprocess.run(["ping", "-c", "1", "-W", "3", "--", host], capture_output=True, timeout=5)
        status = "online" if result.returncode == 0 else "offline"
        return JSONResponse({"status": status, "success": True})
    except subprocess.TimeoutExpired:
        return JSONResponse({"status": "timeout", "success": True})
    except Exception as e:
        logger.error(f"Ping error for {host}: {e}")
        return JSONResponse({"status": "error", "success": False})


_DEVICE_KEYS = {"name", "type", "ip", "mac"}


def _validate_device_list(data: object) -> list[dict]:
    """Validate that data is a list of device dicts with expected string fields."""
    if not isinstance(data, list):
        raise ValueError("Expected a list of devices")
    result = []
    for item in data:
        if not isinstance(item, dict):
            raise ValueError("Each device must be an object")
        if not _DEVICE_KEYS.issubset(item.keys()):
            raise ValueError(f"Device missing required keys: {_DEVICE_KEYS - item.keys()}")
        result.append({k: str(item[k]) for k in _DEVICE_KEYS})
    return result


@router.post("/devices/save", include_in_schema=False)
async def save_devices(request: Request):
    try:
        data = await request.json()
        devices = _validate_device_list(data)
        with open(get_devices_file_path(), "w") as f:
            f.write(json.dumps(devices))
        return JSONResponse({"success": 1})
    except (ValueError, TypeError) as e:
        logger.warning(f"Save devices rejected invalid payload: {e}")
        return JSONResponse({"success": 0, "message": str(e)})
    except Exception as e:
        logger.error(f"Save devices failed: {e}")
        return JSONResponse({"success": 0})


@router.get("/devices/load", include_in_schema=False)
def load_devices():
    try:
        with open(get_devices_file_path(), "r") as f:
            return JSONResponse(json.load(f))
    except Exception as e:
        logger.error(f"Load devices failed: {e}")
        return JSONResponse({"success": 0})
