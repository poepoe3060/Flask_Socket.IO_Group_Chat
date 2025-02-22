from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_cors import CORS
from flask_socketio import SocketIO, send, emit
import random

app = Flask(__name__, static_folder="static")
CORS(app)
socketio = SocketIO(app)


users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on("connect")
def handle_connect():
    
    username = f"User_{random.randint(1000,9999)}"
    gender = random.choice(["girl","boy"])
    avatar_url = f"https://avatar.iran.liara.run/public/{gender}?username={username}"
    users[request.sid] = {
        "username": username,
        "avatar_url": avatar_url
    }

    emit("user_joined", {
        "username":username, 
        "avatar_url":avatar_url}, 
        broadcast=True)    

    emit("set_username", {"username":username})
    
@socketio.on("disconnect")
def handle_disconnect():
    user = users.pop(request.sid, None)    
    if user:
        emit("user_left", {
            "username":user["username"]
            }, broadcast=True)
    
@socketio.on("send_message")
def handle_message(data):
    user = users.get(request.sid)
    if user:
        emit("new_message", {
            "username":user["username"], 
            "avatar":user["avatar_url"], 
            "message":data["message"]
            }, broadcast=True)

@socketio.on("update_username")
def handle_update_username(data):
    old_username = users[request.sid]["username"]
    new_username = data["newUsername"]
    users[request.sid]["username"] = new_username
    emit("username_updated", {
        "old_username":old_username, 
        "new_username":new_username}, 
        broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)