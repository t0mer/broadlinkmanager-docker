import time

import broadlink
from broadlink.exceptions import ReadError, StorageError
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from loguru import logger

from app import state

router = APIRouter(tags=["Commands"])

TICK = 32.84
IR_TOKEN = 0x26
TIMEOUT = 30


def _init_device(dtype: str, host: str, mac: str):
    dtype_tmp = dtype
    if dtype_tmp == "0x6539":
        dtype_tmp = "0x610F"
    return broadlink.gendevice(int(dtype_tmp, 0), (host, 80), bytearray.fromhex(mac))


@router.get("/temperature", tags=["Commands"], summary="Read Temperature")
def temperature(mac: str = "", host: str = "", type: str = ""):
    logger.info(f"Reading temperature from {host}")
    dev = _init_device(type, host, mac)
    dev.auth()
    try:
        return JSONResponse({"data": str(dev.check_temperature()), "success": "1"})
    except Exception:
        return JSONResponse({"data": "Method Not Supported", "success": "0"})


@router.get("/ir/learn", tags=["Commands"], summary="Learn IR code")
def learn_ir(mac: str = "", host: str = "", type: str = "", command: str = ""):
    logger.info(f"Learning IR on {host}")
    dev = _init_device(type, host, mac)
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
        return JSONResponse({"data": "", "success": 0, "message": "No Data Received", "type": "ir"})
    learned = "".join(format(x, "02x") for x in bytearray(data))
    return JSONResponse({"data": learned, "success": 1, "message": "IR Data Received", "type": "ir"})


@router.get("/command/send", tags=["Commands"], summary="Send IR/RF Command")
def send_command(mac: str = "", host: str = "", type: str = "", command: str = ""):
    logger.info(f"Sending command to {host}")
    dev = _init_device(type, host, mac)
    dev.auth()
    try:
        dev.send_data(bytearray.fromhex("".join(command)))
        return JSONResponse({"data": "", "success": 1, "message": "Command sent successfully"})
    except Exception as ex:
        return JSONResponse({"data": "", "success": 0, "message": f"Error: {ex}"})


@router.get("/rf/learn", include_in_schema=False)
def learn_rf(mac: str = "", host: str = "", type: str = "", command: str = ""):
    state.reset_rf_state()
    logger.info(f"Starting RF sweep on {host}")
    dev = _init_device(type, host, mac)
    dev.auth()
    dev.sweep_frequency()
    state.set_rf_message("Learning RF Frequency, press and hold the button...")

    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        if dev.check_frequency():
            break
    else:
        state.set_rf_message("RF Frequency not found!")
        dev.cancel_sweep_frequency()
        return JSONResponse({"data": "RF Frequency not found!", "success": 0, "type": "rf"})

    state.set_rf_message("Found RF Frequency - 1 of 2!")
    time.sleep(1)
    state.set_rf_message("You can now let go of the button")
    state.set_rf_status(True)

    while not state._continue_to_sweep:
        state.set_rf_message("Click the Continue button")
        time.sleep(0.1)

    state.set_rf_message("Single press the button to capture the code")
    state.set_rf_status(False)
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
        state.set_rf_message("No Data Found")
        return JSONResponse({"data": "No Data Found", "success": 0, "type": "rf"})

    learned = "".join(format(x, "02x") for x in bytearray(data))
    state.set_rf_message("RF Scan Completed Successfully")
    return JSONResponse({"data": learned, "success": 1, "type": "rf"})


@router.get("/rf/status", include_in_schema=False)
def rf_status():
    return JSONResponse(state.get_rf_state())


@router.get("/rf/continue", include_in_schema=False)
def rf_continue():
    state.set_rf_status(True)
    state.set_continue_sweep(True)
    return JSONResponse(state.get_rf_state())
