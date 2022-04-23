#!/usr/bin/env python3
"""The python-broadlink library."""
import socket
import typing as t

from . import exceptions as e
from .const import DEFAULT_BCAST_ADDR, DEFAULT_PORT, DEFAULT_TIMEOUT
from .alarm import S1C
from .climate import hysen
from .cover import dooya
from .device import Device, ping, scan
from .light import lb1, lb2
from .remote import rm, rm4, rm4mini, rm4pro, rmmini, rmminib, rmpro
from .sensor import a1
from .switch import bg1, mp1, sp1, sp2, sp2s, sp3, sp3s, sp4, sp4b

broadlink_oem="Broadlink (OEM)"
broadlink = "Broadlink"

SUPPORTED_TYPES = {
    sp1: {
        0x0000: ("SP1", broadlink),
    },
    sp2: {
        0x2717: ("NEO", "Ankuoo"),
        0x2719: ("SP2-compatible", "Honeywell"),
        0x271A: ("SP2-compatible", "Honeywell"),
        0x2720: ("SP mini", broadlink),
        0x2728: ("SP2-compatible", "URANT"),
        0x273E: ("SP mini", broadlink),
        0x7530: ("SP2", broadlink_oem),
        0x7539: ("SP2-IL",broadlink_oem),
        0x753E: ("SP mini 3", broadlink),
        0x7540: ("MP2", broadlink),
        0x7544: ("SP2-CL", broadlink),
        0x7546: ("SP2-UK/BR/IN", broadlink_oem),
        0x7547: ("SC1", broadlink),
        0x7918: ("SP2", broadlink_oem),
        0x7919: ("SP2-compatible", "Honeywell"),
        0x791A: ("SP2-compatible", "Honeywell"),
        0x7D0D: ("SP mini 3", broadlink_oem),
    },
    sp2s: {
        0x2711: ("SP2", broadlink),
        0x2716: ("NEO PRO", "Ankuoo"),
        0x271D: ("Ego", "Efergy"),
        0x2736: ("SP mini+", broadlink),
    },
    sp3: {
        0x2733: ("SP3", broadlink),
        0x7D00: ("SP3-EU", broadlink_oem),
    },
    sp3s: {
        0x9479: ("SP3S-US", broadlink),
        0x947A: ("SP3S-EU", broadlink),
    },
    sp4: {
        0x7568: ("SP4L-CN", broadlink),
        0x756C: ("SP4M", broadlink),
        0x756F: ("MCB1", broadlink),
        0x7579: ("SP4L-EU", broadlink),
        0x757B: ("SP4L-AU", broadlink),
        0x7583: ("SP mini 3", broadlink),
        0x7587: ("SP4L-UK", broadlink),
        0x7D11: ("SP mini 3", broadlink),
        0xA56A: ("MCB1", broadlink),
        0xA56B: ("SCB1E", broadlink),
        0xA56C: ("SP4L-EU", broadlink),
        0xA589: ("SP4L-UK", broadlink),
        0xA5D3: ("SP4L-EU", broadlink),
    },
    sp4b: {
        0x5115: ("SCB1E", broadlink),
        0x51E2: ("AHC/U-01", "BG Electrical"),
        0x6111: ("MCB1", broadlink),
        0x6113: ("SCB1E", broadlink),
        0x618B: ("SP4L-EU", broadlink),
        0x6489: ("SP4L-AU", broadlink),
        0x648B: ("SP4M-US", broadlink),
        0x6494: ("SCB2", broadlink),
    },
    rmmini: {
        0x2737: ("RM mini 3", broadlink),
        0x278F: ("RM mini", broadlink),
        0x27C2: ("RM mini 3", broadlink),
        0x27C7: ("RM mini 3", broadlink),
        0x27CC: ("RM mini 3", broadlink),
        0x27CD: ("RM mini 3", broadlink),
        0x27D0: ("RM mini 3", broadlink),
        0x27D1: ("RM mini 3", broadlink),
        0x27D3: ("RM mini 3", broadlink),
        0x27DC: ("RM mini 3", broadlink),
        0x27DE: ("RM mini 3", broadlink),
    },
    rmpro: {
        0x2712: ("RM pro/pro+", broadlink),
        0x272A: ("RM pro", broadlink),
        0x273D: ("RM pro", broadlink),
        0x277C: ("RM home", broadlink),
        0x2783: ("RM home", broadlink),
        0x2787: ("RM pro", broadlink),
        0x278B: ("RM plus", broadlink),
        0x2797: ("RM pro+", broadlink),
        0x279D: ("RM pro+", broadlink),
        0x27A1: ("RM plus", broadlink),
        0x27A6: ("RM plus", broadlink),
        0x27A9: ("RM pro+", broadlink),
        0x27C3: ("RM pro+", broadlink),
    },
    rmminib: {
        0x5F36: ("RM mini 3", broadlink),
        0x6507: ("RM mini 3", broadlink),
        0x6508: ("RM mini 3", broadlink),
    },
    rm4mini: {
        0x51DA: ("RM4 mini", broadlink),
        0x6070: ("RM4C mini", broadlink),
        0x610E: ("RM4 mini", broadlink),
        0x610F: ("RM4C mini", broadlink),
        0x62BC: ("RM4 mini", broadlink),
        0x62BE: ("RM4C mini", broadlink),
        0x6364: ("RM4S", broadlink),
        0x648D: ("RM4 mini", broadlink),
        0x6539: ("RM4C mini", broadlink),
        0x653A: ("RM4 mini", broadlink),
    },
    rm4pro: {
        0x6026: ("RM4 pro", broadlink),
        0x6184: ("RM4C pro", broadlink),
        0x61A2: ("RM4 pro", broadlink),
        0x649B: ("RM4 pro", broadlink),
        0x653C: ("RM4 pro", broadlink),
    },
    a1: {
        0x2714: ("e-Sensor", broadlink),
    },
    mp1: {
        0x4EB5: ("MP1-1K4S", broadlink),
        0x4EF7: ("MP1-1K4S", broadlink_oem),
        0x4F1B: ("MP1-1K3S2U", broadlink_oem),
        0x4F65: ("MP1-1K3S2U", broadlink),
    },
    lb1: {
        0x5043: ("SB800TD", broadlink_oem),
        0x504E: ("LB1", broadlink),
        0x606E: ("SB500TD",broadlink_oem),
        0x60C7: ("LB1", broadlink),
        0x60C8: ("LB1", broadlink),
        0x6112: ("LB1", broadlink),
    },
    lb2: {
        0xA4F4: ("LB27 R1", broadlink),
    },
    S1C: {
        0x2722: ("S2KIT", broadlink),
    },
    hysen: {
        0x4EAD: ("HY02/HY03", "Hysen"),
    },
    dooya: {
        0x4E4D: ("DT360E-45/20", "Dooya"),
    },
    bg1: {
        0x51E3: ("BG800/BG900", "BG Electrical"),
    },
}


def gendevice(
    dev_type: int,
    host: t.Tuple[str, int],
    mac: t.Union[bytes, str],
    name: str = "",
    is_locked: bool = False,
) -> Device:
    """Generate a device."""
    for dev_cls, products in SUPPORTED_TYPES.items():
        try:
            model, manufacturer = products[dev_type]

        except KeyError:
            continue

        return dev_cls(
            host,
            mac,
            dev_type,
            name=name,
            model=model,
            manufacturer=manufacturer,
            is_locked=is_locked,
        )

    return Device(host, mac, dev_type, name=name, is_locked=is_locked)


def hello(
    host: str,
    port: int = DEFAULT_PORT,
    timeout: int = DEFAULT_TIMEOUT,
) -> Device:
    """Direct device discovery.

    Useful if the device is locked.
    """
    try:
        return next(
            xdiscover(timeout=timeout, discover_ip_address=host, discover_ip_port=port)
        )
    except StopIteration as err:
        raise e.NetworkTimeoutError(
            -4000,
            "Network timeout",
            f"No response received within {timeout}s",
        ) from err


def discover(
    timeout: int = DEFAULT_TIMEOUT,
    local_ip_address: str = None,
    discover_ip_address: str = DEFAULT_BCAST_ADDR,
    discover_ip_port: int = DEFAULT_PORT,
) -> t.List[Device]:
    """Discover devices connected to the local network."""
    responses = scan(timeout, local_ip_address, discover_ip_address, discover_ip_port)
    return [gendevice(*resp) for resp in responses]


def xdiscover(
    timeout: int = DEFAULT_TIMEOUT,
    local_ip_address: str = None,
    discover_ip_address: str = DEFAULT_BCAST_ADDR,
    discover_ip_port: int = DEFAULT_PORT,
) -> t.Generator[Device, None, None]:
    """Discover devices connected to the local network.

    This function returns a generator that yields devices instantly.
    """
    responses = scan(timeout, local_ip_address, discover_ip_address, discover_ip_port)
    for resp in responses:
        yield gendevice(*resp)


# Setup a new Broadlink device via AP Mode. Review the README to see how to enter AP Mode.
# Only tested with Broadlink RM3 Mini (Blackbean)
def setup(ssid: str, password: str, security_mode: int) -> None:
    """Set up a new Broadlink device via AP mode."""
    # Security mode options are (0 - none, 1 = WEP, 2 = WPA1, 3 = WPA2, 4 = WPA1/2)
    payload = bytearray(0x88)
    payload[0x26] = 0x14  # This seems to always be set to 14
    # Add the SSID to the payload
    ssid_start = 68
    ssid_length = 0
    for letter in ssid:
        payload[(ssid_start + ssid_length)] = ord(letter)
        ssid_length += 1
    # Add the WiFi password to the payload
    pass_start = 100
    pass_length = 0
    for letter in password:
        payload[(pass_start + pass_length)] = ord(letter)
        pass_length += 1

    payload[0x84] = ssid_length  # Character length of SSID
    payload[0x85] = pass_length  # Character length of password
    payload[0x86] = security_mode  # Type of encryption

    checksum = sum(payload, 0xBEAF) & 0xFFFF
    payload[0x20] = checksum & 0xFF  # Checksum 1 position
    payload[0x21] = checksum >> 8  # Checksum 2 position

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # Internet  # UDP
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.sendto(payload, (DEFAULT_BCAST_ADDR, DEFAULT_PORT))
    sock.close()
