FROM techblog/flask:latest

LABEL maintainer="tomer.klein@gmail.com"

ENV PYTHONIOENCODING=utf-8
ENV ENABLE_GOOGLE_ANALYTICS=True

#Create working directory
RUN mkdir /opt/broadlinkmanager
RUN mkdir /opt/broadlinkmanager/data

EXPOSE 7020

COPY broadlinkmanager /opt/broadlinkmanager

ENTRYPOINT ["/usr/bin/python3", "/opt/broadlinkmanager/broadlinkmanager.py"]