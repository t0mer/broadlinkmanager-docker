import os
import re
import socket
import argparse
import sys
from loguru import logger

ip_format_regex = r"\b(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]))\b"

# Populated by init_config() — empty until app startup
args: argparse.Namespace = argparse.Namespace(
    ip=[], timeout=5, dst_ip="255.255.255.255", dst_ip_list=["255.255.255.255"]
)
discovery_ip_address_list: list[str | None] = []


def validate_ip(ip: str) -> bool:
    return bool(re.search(ip_format_regex, ip))


def parse_ip_list(iplist: str) -> list[str]:
    parsed = re.findall(ip_format_regex, iplist)
    return [item[0] for item in parsed]


def get_local_ip_list() -> list[str]:
    # Cross-platform default-route lookup (`hostname -I` is Linux-only).
    # connect() on a UDP socket sends no traffic; it only picks the local address.
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ips = [s.getsockname()[0]]
    except OSError as e:
        logger.debug(f"Local IP detection failed: {e}")
        ips = []
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
    # Mutate in-place so modules that did `from app.config import X` see the
    # updated values — reassigning would create new objects and leave those
    # imported names pointing at the old empty defaults.

    # Env vars provide defaults; CLI args still win
    env_timeout = os.getenv("DISCOVERY_TIMEOUT", "5")
    env_dst_ip = os.getenv("DISCOVERY_DST_IP", "")

    parser = argparse.ArgumentParser(fromfile_prefix_chars="@")
    parser.add_argument("--timeout", type=int, default=int(env_timeout) if env_timeout.isdigit() else 5)
    parser.add_argument("--ip", action="append", default=[])
    parser.add_argument("--dst-ip", default=env_dst_ip or "255.255.255.255")
    parsed = parser.parse_args()

    # Mutate args in-place rather than rebinding
    vars(args).update(vars(parsed))

    # dst-ip may be a comma-separated list of broadcast and/or device addresses
    args.dst_ip_list = parse_ip_list(args.dst_ip) or ["255.255.255.255"]

    if args.ip:
        invalid = [ip for ip in args.ip if not validate_ip(ip)]
        if invalid:
            logger.error(f"Invalid IPs: {invalid}")
            sys.exit(-1)
        resolved = args.ip
    else:
        env_list = get_env_ip_list()
        resolved = env_list if env_list else get_local_ip_list()

    if not resolved:
        logger.warning("No local IPs resolved; falling back to default binding 0.0.0.0")
        resolved = [None]

    # Mutate the list in-place rather than rebinding
    discovery_ip_address_list.clear()
    discovery_ip_address_list.extend(resolved)

    logger.info(f"Discovery interfaces: {discovery_ip_address_list}, destinations: {args.dst_ip_list}")
