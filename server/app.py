from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import ObjectId
import requests
import random
import string
from flask_cors import CORS
import re
import jwt
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
app.config["MONGO_URI"] = "mongodb+srv://satya:satya@cluster0.8thgg4a.mongodb.net/music_app"
app.config['JWT_SECRET_KEY'] = 'asdgFASdgSGsgSgDfgDSGewT#4g42u4ET32$u'  # Change in production
mongo = PyMongo(app)

# Email API configuration
EMAIL_API_URL = "https://new-email-five.vercel.app/send-email?apikey=5801402c8dbcf75d0376399992218603"

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to JStream API!",
        "endpoints": {
            "/songs": "Search for songs (GET)",
            "/send-otp": "Send OTP to email (POST)",
            "/verify-otp": "Verify OTP (POST)",
            "/playlists": "Create a playlist (POST), Get user playlists (GET)",
            "/playlists/add-song": "Add a song to a playlist (POST)",
            "/playlists/<playlist_id>/songs": "Get songs from a playlist (GET)"
        }
    })

def generate_jwt_token(user_id, email, name):
    payload = {
        'user_id': str(user_id),
        'email': email,
        'name': name,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

@app.route('/verify-token', methods=['GET'])
def verify_token():
    token = None
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]

    if not token:
        return jsonify({'error': 'Token is missing'}), 401

    try:
        data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
        if not user:
            return jsonify({'error': 'User not found'}), 401
            
        return jsonify({
            'valid': True,
            'user_id': str(user['_id']),
            'user_name': user.get('name', 'User')
        })
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/register', methods=['POST'])
def register():
    try:
        email = request.json.get('email')
        password = request.json.get('password')
        name = request.json.get('name')

        if not all([email, password, name]):
            return jsonify({"error": "All fields are required"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        existing_user = mongo.db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 400

        otp = generate_otp()
        user_data = {
            "email": email,
            "password": password,  # Consider hashing in production
            "name": name,
            "otp": otp,
            "otp_timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        mongo.db.users.insert_one(user_data)

        email_payload = {
            "receiver_email": email,
            "subject": "Verify your JStream account",
            "message": f"Hi {name},\n\nYour verification OTP is: {otp}\nThis OTP will expire in 10 minutes."
        }
        
        response = requests.post(EMAIL_API_URL, json=email_payload)
        if response.status_code != 200:
            return jsonify({"error": "Failed to send verification email"}), 500

        return jsonify({"message": "Registration initiated successfully"})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        email = request.json.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        user = mongo.db.users.find_one({"email": email})
        if not user:
            return jsonify({"error": "Email not registered"}), 404

        otp = generate_otp()
        mongo.db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "otp": otp,
                    "otp_timestamp": datetime.utcnow()
                }
            }
        )

        email_payload = {
            "receiver_email": email,
            "subject": "Your JStream Login OTP",
            "message": f"Hi {user.get('name', 'User')},\n\nYour login OTP is: {otp}\nThis OTP will expire in 10 minutes."
        }
        
        response = requests.post(EMAIL_API_URL, json=email_payload)
        if response.status_code != 200:
            return jsonify({"error": "Failed to send OTP"}), 500

        return jsonify({"message": "OTP sent successfully"})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        email = request.json.get('email')
        otp = request.json.get('otp')
        is_registering = request.json.get('isRegistering', False)

        if not email or not otp:
            return jsonify({"error": "Email and OTP are required"}), 400

        user = mongo.db.users.find_one({
            "email": email,
            "otp": otp,
            "otp_timestamp": {"$gte": datetime.utcnow() - timedelta(minutes=10)}
        })
        
        if not user:
            return jsonify({"error": "Invalid or expired OTP"}), 400

        # Clear OTP after successful verification
        mongo.db.users.update_one(
            {"email": email},
            {
                "$unset": {"otp": "", "otp_timestamp": ""},
                "$set": {
                    "last_login": datetime.utcnow(),
                    "email_verified": True
                }
            }
        )

        # Generate JWT token
        token = generate_jwt_token(user['_id'], email, user.get('name', 'User'))

        return jsonify({
            "message": "Verification successful",
            "token": token,
            "user_id": str(user["_id"]),
            "user_name": user.get("name", "User")
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/songs', methods=['GET'])
def get_songs():
    query = request.args.get('query', 'Believer')
    if not query:
        return jsonify({"error": "No song name provided"}), 400
    
    try:
        url = f'https://saavn.dev/api/search/songs?query={query}&limit={20}'
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                songs = []
                for song in data['data']['results']:
                    song_data = {
                        'id': song.get('id'),
                        'title': song.get('name'),
                        'mp3_url': None,
                        'thumbnail_url': None,
                        'artist': song.get('primaryArtists', 'Unknown Artist')
                    }

                    if song.get('downloadUrl'):
                        for download in song['downloadUrl']:
                            if download.get('quality') == '320kbps':
                                song_data['mp3_url'] = download.get('url')
                                break
                    
                    if song.get('image'):
                        for image in song['image']:
                            if image.get('quality') == '500x500':
                                song_data['thumbnail_url'] = image.get('url')
                                break
                    
                    songs.append(song_data)
                return jsonify(songs)
            return jsonify({"error": "No results found"}), 404
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500

@app.route('/playlists', methods=['POST'])
def create_playlist():
    try:
        user_id = request.json.get('user_id')
        name = request.json.get('name')
        
        if not user_id or not name:
            return jsonify({"error": "User ID and playlist name are required"}), 400

        playlist = {
            "user_id": user_id,
            "name": name,
            "songs": [],
            "created_at": datetime.utcnow()
        }
        result = mongo.db.playlists.insert_one(playlist)

        return jsonify({
            "message": "Playlist created successfully",
            "playlist_id": str(result.inserted_id)
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists', methods=['GET'])
def get_playlists():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        playlists = list(mongo.db.playlists.find(
            {"user_id": user_id},
            {"songs": 1, "name": 1, "created_at": 1}
        ).sort("created_at", -1))

        for playlist in playlists:
            playlist["id"] = str(playlist.pop("_id"))

        return jsonify(playlists)
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists/add-song', methods=['POST'])
def add_song_to_playlist():
    try:
        user_id = request.json.get('user_id')
        playlist_id = request.json.get('playlist_id')
        song = request.json.get('song')

        if not all([user_id, playlist_id, song]):
            return jsonify({"error": "All fields are required"}), 400

        playlist = mongo.db.playlists.find_one({
            "_id": ObjectId(playlist_id),
            "user_id": user_id
        })

        if not playlist:
            return jsonify({"error": "Playlist not found or unauthorized"}), 404

        if any(existing_song.get('id') == song.get('id') for existing_song in playlist['songs']):
            return jsonify({"error": "Song already exists in playlist"}), 400

        mongo.db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$push": {"songs": song}}
        )

        return jsonify({"message": "Song added to playlist successfully"})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists/<playlist_id>/songs', methods=['GET'])
def get_playlist_songs(playlist_id):
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        playlist = mongo.db.playlists.find_one({
            "_id": ObjectId(playlist_id),
            "user_id": user_id
        })

        if not playlist:
            return jsonify({"error": "Playlist not found or unauthorized"}), 404

        return jsonify(playlist.get('songs', []))
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
@app.route('/playlists/<playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    try:
        user_id = request.json.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        playlist = mongo.db.playlists.find_one({
            "_id": ObjectId(playlist_id),
            "user_id": user_id
        })

        if not playlist:
            return jsonify({"error": "Playlist not found or unauthorized"}), 404

        mongo.db.playlists.delete_one({"_id": ObjectId(playlist_id)})

        return jsonify({"message": "Playlist deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists/<playlist_id>/remove-song', methods=['POST'])
def remove_song_from_playlist(playlist_id):
    try:
        user_id = request.json.get('user_id')
        song_id = request.json.get('song_id')

        if not all([user_id, song_id]):
            return jsonify({"error": "User ID and Song ID are required"}), 400

        playlist = mongo.db.playlists.find_one({
            "_id": ObjectId(playlist_id),
            "user_id": user_id
        })

        if not playlist:
            return jsonify({"error": "Playlist not found or unauthorized"}), 404

        mongo.db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$pull": {"songs": {"id": song_id}}}
        )

        return jsonify({"message": "Song removed from playlist successfully"})
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Use PORT from environment, default to 5000
    app.run(host="0.0.0.0", port=port, debug=True)
