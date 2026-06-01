*Please :star: this repo if you find it useful*

<p align="left"><br>
 <a href="https://www.paypal.com/paypalme/techblogil?locale.x=he_IL" target="_blank"><img src="http://khrolenok.ru/support_paypal.png" alt="PayPal" width="250" height="48"></a>
</p>

# BroadlinkManager  ![Docker Pulls](https://img.shields.io/docker/pulls/techblog/broadlinkmanager.svg)

BroadlinkManager is a [FastAPI](https://fastapi.tiangolo.com/) powered web application that makes it easy to manage Broadlink IR/RF devices on your local network. It features a modern React UI with dark and light mode support, a full REST API, and runs as a single Docker container.

## Features

- **Device Discovery** — automatically scan your network for Broadlink devices; save and reload device lists
- **IR Code Learning & Sending** — put any supported device into IR learning mode and capture codes; send saved codes with one click
- **RF Code Learning & Sending** — guided 3-step RF sweep (hold → press → save) with real-time status polling
- **Saved Codes Library** — store, search, filter (IR/RF), edit, delete, and export your code collection as CSV
- **RF Code Generator** — generate random 433 MHz or 315 MHz RF codes (regular and long-repeat variants)
- **Livolo Code Generator** — generate RF codes for Livolo smart switches by remote ID and button type
- **Energenie Code Generator** — generate codes for Energenie Type-D 433 MHz RF sockets
- **Change Repeats** — modify the repeat count of any existing Base64-encoded IR or RF code
- **Hex ↔ Base64 Converter** — live bidirectional conversion between hex and Base64 code formats
- **Dark / Light Mode** — toggle between dark and light themes; preference is persisted across sessions
- **Mobile Friendly** — responsive layout with collapsible sidebar navigation
- **REST API + Swagger UI** — full OpenAPI documentation at `/docs`
- **Prometheus Metrics** — built-in metrics endpoint at `/metrics`
