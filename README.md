# broadlinkmanager-docker
Broadlink manageר is python based projecy that allows you to contorol you broadlink devices. Discover, Leran and send command in a very easy way.

## Base Image
`From ubuntu:18.04` described [here](https://hub.docker.com/_/ubuntu).


## Usage
### Run from hub
#### docker run from hub
```text
docker run --name broadlinkmanager -p "7020:7020" techblog/broadlinkmanager:latest
```

#### docker-compose from hub
```yaml
version: "3.6"
services:
  broadlinksvc:
    image: techblog/broadlinkmanager
    network_mode: host
    container_name: broadlinkmanager
    restart: always
    restart: unless-stopped

```
