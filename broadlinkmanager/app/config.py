import os
import re
import subprocess
import argparse
import sys
from loguru import logger

ip_format_regex = r"\b(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]))\b"

# Populated by init_config() — empty until app startup
args: argparse.Namespace = argparse.Namespace(ip=[], timeout=5, dst_ip="255.255.255.255")
discovery_ip_address_list: list[str] = []


def validate_ip(ip: str) -> bool:
    return bool(re.search(ip_format_regex, ip))


def parse_ip_list(iplist: str) -> list[str]:
    parsed = re.findall(ip_format_regex, iplist)
    return [item[0] for item in parsed]


def get_local_ip_list() -> list[str]:
    result = subprocess.run(["hostname", "-I"], capture_output=True, text=True)
    ips = parse_ip_list(result.stdout)
    logger.debug(f"Local IP list: {ips}")
    return ips


def get_env_ip_list() -> list[str]:
    env = os.getenv("DISCOVERY_IP_LIST", "")
    result = parse_ip_list(str(env))
    logger.debug(f"Env IP list: {result}")
    return result


def get_version() -> str:
    try:
        with open(os.path.join(os.path.dirname(__file__), "..", "VERSION"), "r") as f:
            return f.read().strip()
    except OSError:
        return "unknown"


def get_devices_file_path() -> str:
    return os.path.join(os.path.dirname(__file__), "..", "data", "devices.json")


def init_config() -> None:
    """Parse CLI args and resolve discovery IP list. Call once from app startup."""
    global args, discovery_ip_address_list

    parser = argparse.ArgumentParser(fromfile_prefix_chars="@")
    parser.add_argument("--timeout", type=int, default=5)
    parser.add_argument("--ip", action="append", default=[])
    parser.add_argument("--dst-ip", default="255.255.255.255")
    args = parser.parse_args()

    if args.ip:
        invalid = [ip for ip in args.ip if not validate_ip(ip)]
        if invalid:
            logger.error(f"Invalid IPs: {invalid}")
            sys.exit(-1)
        discovery_ip_address_list = args.ip
    else:
        env_list = get_env_ip_list()
        discovery_ip_address_list = env_list if env_list else get_local_ip_list()

    logger.info(f"Discovery interfaces: {discovery_ip_address_list}")
