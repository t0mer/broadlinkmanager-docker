*Please :star: this repo if you find it useful*

<p align="left"><br>
 <a href="https://www.paypal.com/paypalme/techblogil?locale.x=he_IL" target="_blank"><img src="http://khrolenok.ru/support_paypal.png" alt="PayPal" width="250" height="48"></a>
</p>

# BroadlinkManager  ![Broadlink Manager](https://img.shields.io/docker/pulls/techblog/broadlinkmanager.svg) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=broadlinkmanager&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=broadlinkmanager) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=broadlinkmanager&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=broadlinkmanager)

BroadlinkManager is a [FastAPI](https://fastapi.tiangolo.com/) powered, easy to use system that hepls you to work with Broadlink Devices.
With Broadlink manager you can:
- Scan your network for devices.
- Learn and send IR or RF codes
- Random generate RF codes
- Change repeats for exisiting codes (IR/EF)


#### Credits:
=======

- [Matthew Garrett](https://github.com/mjg59)
  * [python-broadlink](https://github.com/mjg59/python-broadlink)
  * [broadlink_cli](https://github.com/mjg59/python-broadlink/tree/master/cli)
  
- [Dima Goltsman](https://github.com/dimagoltsman)
  * [Random-Broadlink-RM-Code-Generator](https://github.com/dimagoltsman/Random-Broadlink-RM-Code-Generator)

- [AdminLTE](https://adminlte.io/themes/AdminLTE/index2.html)

- [clipboard.js](https://clipboardjs.com/)


## Supported Devices and Models
###    sp1: 
        0x0000: #"SP1", "Broadlink"
    
###    sp2: 
        0x2717: #"NEO", "Ankuoo"
        0x2719: #"SP2-compatible", "Honeywell"
        0x271A: #"SP2-compatible", "Honeywell"
        0x2720: #"SP mini", "Broadlink"
        0x2728: #"SP2-compatible", "URANT"
        0x273E: #"SP mini", "Broadlink"
        0x7530: #"SP2", "Broadlink #OEM)"
        0x7539: #"SP2-IL", "Broadlink #OEM)"
        0x753E: #"SP mini 3", "Broadlink"
        0x7540: #"MP2", "Broadlink"
        0x7544: #"SP2-CL", "Broadlink"
        0x7546: #"SP2-UK/BR/IN", "Broadlink #OEM)"
        0x7547: #"SC1", "Broadlink"
        0x7918: #"SP2", "Broadlink #OEM)"
        0x7919: #"SP2-compatible", "Honeywell"
        0x791A: #"SP2-compatible", "Honeywell"
        0x7D0D: #"SP mini 3", "Broadlink #OEM)"
    
 ###   sp2s: 
        0x2711: #"SP2", "Broadlink"
        0x2716: #"NEO PRO", "Ankuoo"
        0x271D: #"Ego", "Efergy"
        0x2736: #"SP mini+", "Broadlink"
    
###    sp3: 
        0x2733: #"SP3", "Broadlink"
        0x7D00: #"SP3-EU", "Broadlink #OEM)"
    
###    sp3s: 
        0x9479: #"SP3S-US", "Broadlink"
        0x947A: #"SP3S-EU", "Broadlink"
    
###    sp4: 
        0x7568: #"SP4L-CN", "Broadlink"
        0x756C: #"SP4M", "Broadlink"
        0x756F: #"MCB1", "Broadlink"
        0x7579: #"SP4L-EU", "Broadlink"
        0x757B: #"SP4L-AU", "Broadlink"
        0x7583: #"SP mini 3", "Broadlink"
        0x7587: #"SP4L-UK", "Broadlink"
        0x7D11: #"SP mini 3", "Broadlink"
        0xA569: #"SP4L-UK", "Broadlink"
        0xA56A: #"MCB1", "Broadlink"
        0xA56B: #"SCB1E", "Broadlink"
        0xA56C: #"SP4L-EU", "Broadlink"
        0xA589: #"SP4L-UK", "Broadlink"
        0xA5D3: #"SP4L-EU", "Broadlink"
    
###    sp4b: 
        0x5115: #"SCB1E", "Broadlink"
        0x51E2: #"AHC/U-01", "BG Electrical"
        0x6111: #"MCB1", "Broadlink"
        0x6113: #"SCB1E", "Broadlink"
        0x618B: #"SP4L-EU", "Broadlink"
        0x6489: #"SP4L-AU", "Broadlink"
        0x648B: #"SP4M-US", "Broadlink"
        0x648C: #"SP4L-US", "Broadlink"
        0x6494: #"SCB2", "Broadlink"
    
###    rmmini: 
        0x2737: #"RM mini 3", "Broadlink"
        0x278F: #"RM mini", "Broadlink"
        0x27C2: #"RM mini 3", "Broadlink"
        0x27C7: #"RM mini 3", "Broadlink"
        0x27CC: #"RM mini 3", "Broadlink"
        0x27CD: #"RM mini 3", "Broadlink"
        0x27D0: #"RM mini 3", "Broadlink"
        0x27D1: #"RM mini 3", "Broadlink"
        0x27D3: #"RM mini 3", "Broadlink"
        0x27DC: #"RM mini 3", "Broadlink"
        0x27DE: #"RM mini 3", "Broadlink"
    
###    rmpro: 
        0x2712: #"RM pro/pro+", "Broadlink"
        0x272A: #"RM pro", "Broadlink"
        0x273D: #"RM pro", "Broadlink"
        0x277C: #"RM home", "Broadlink"
        0x2783: #"RM home", "Broadlink"
        0x2787: #"RM pro", "Broadlink"
        0x278B: #"RM plus", "Broadlink"
        0x2797: #"RM pro+", "Broadlink"
        0x279D: #"RM pro+", "Broadlink"
        0x27A1: #"RM plus", "Broadlink"
        0x27A6: #"RM plus", "Broadlink"
        0x27A9: #"RM pro+", "Broadlink"
        0x27C3: #"RM pro+", "Broadlink"
    
###    rmminib: 
        0x5F36: #"RM mini 3", "Broadlink"
        0x6507: #"RM mini 3", "Broadlink"
        0x6508: #"RM mini 3", "Broadlink"
    
###    rm4mini: 
        0x51DA: #"RM4 mini", "Broadlink"
        0x5209: #"RM4 TV mate", "Broadlink"
        0x520C: #"RM4 mini", "Broadlink"
        0x520D: #"RM4C mini", "Broadlink"
        0x5211: #"RM4C mate", "Broadlink"
        0x5212: #"RM4 TV mate", "Broadlink"
        0x5216: #"RM4 mini", "Broadlink"
        0x521C: #"RM4 mini", "Broadlink"
        0x6070: #"RM4C mini", "Broadlink"
        0x610E: #"RM4 mini", "Broadlink"
        0x610F: #"RM4C mini", "Broadlink"
        0x62BC: #"RM4 mini", "Broadlink"
        0x62BE: #"RM4C mini", "Broadlink"
        0x6364: #"RM4S", "Broadlink"
        0x648D: #"RM4 mini", "Broadlink"
        0x6539: #"RM4C mini", "Broadlink"
        0x653A: #"RM4 mini", "Broadlink"
    
###    rm4pro: 
        0x520B: #"RM4 pro", "Broadlink"
        0x5213: #"RM4 pro", "Broadlink"
        0x5218: #"RM4C pro", "Broadlink"
        0x6026: #"RM4 pro", "Broadlink"
        0x6184: #"RM4C pro", "Broadlink"
        0x61A2: #"RM4 pro", "Broadlink"
        0x649B: #"RM4 pro", "Broadlink"
        0x653C: #"RM4 pro", "Broadlink"
    
###    a1: 
        0x2714: #"e-Sensor", "Broadlink"
    
###    mp1: 
        0x4EB5: #"MP1-1K4S", "Broadlink"
        0x4EF7: #"MP1-1K4S", "Broadlink #OEM)"
        0x4F1B: #"MP1-1K3S2U", "Broadlink #OEM)"
        0x4F65: #"MP1-1K3S2U", "Broadlink"
    
###    lb1: 
        0x5043: #"SB800TD", "Broadlink #OEM)"
        0x504E: #"LB1", "Broadlink"
        0x606E: #"SB500TD", "Broadlink #OEM)"
        0x60C7: #"LB1", "Broadlink"
        0x60C8: #"LB1", "Broadlink"
        0x6112: #"LB1", "Broadlink"
        0x644B: #"LB1", "Broadlink"
        0x644C: #"LB27 R1", "Broadlink"        
        0x644E: #"LB26 R1", "Broadlink"
    
###    lb2: 
        0xA4F4: #"LB27 R1", "Broadlink"
        0xA5F7: #"LB27 R1", "Broadlink"
    
###    S1C: 
        0x2722: #"S2KIT", "Broadlink"
    
###    s3:  
        0xA59C:#"S3", "Broadlink"
        0xA64D:#"S3", "Broadlink"
    
###    hysen: 
        0x4EAD: #"HY02/HY03", "Hysen"
    
###    dooya: 
        0x4E4D: #"DT360E-45/20", "Dooya"
    
###    bg1: 
        0x51E3: #"BG800/BG900", "BG Electrical"
    

## Usage
### Run from hub

#### docker-compose from hub
```yaml
version: "3.6"
services:
  broadlinkmanager:
    image: techblog/broadlinkmanager
    network_mode: host
    container_name: broadlinkmanager
    restart: unless-stopped
    volumes:
      - ./broadlinkmanager:/opt/broadlinkmanager/data
    environment:
      - ENABLE_GOOGLE_ANALYTICS=True #Optional, default is True, Set to False if you want to disable Google Analytics

```
Now open your browser and enter your docker container ip with port 7020:
http://docker-ip:7020

# Screenshots

[![Device Listing](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")

[![RF Code Generator](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")

[![Learn and Send IR/RF Codes](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")

[![Base64 and Hex Conversation](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")
# Donation
<br>



