#!/bin/sh
#
pip install fastapi uvicorn python-multipart stellar-sdk motor python-jose[cryptography] passlib[bcrypt]
python db_setup.py

