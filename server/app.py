from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from bson import ObjectId
import requests
import random
import string
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb+srv://satya:satya@cluster0.8thgg4a.mongodb.net/music_app"
mongo = PyMongo(app)

# Email API configuration
EMAIL_API_URL = "https://emailservice-app-backend-1.onrender.com/send-email?apikey=5801402c8dbcf75d0376399992218603"

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

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def fetch_song_data(query):
    try:
        url = f'https://saavn.dev/api/search/songs?query={query}'
        response = requests.get(url, timeout=10)  # Added timeout
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                songs = []
                
                for song in data['data']['results']:
                    song_data = {
                        'id': song.get('id'),  # Generate unique ID for each song
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

                return songs
            return {"error": "No results found"}
    except requests.RequestException as e:
        return {"error": f"Failed to fetch data: {str(e)}"}
    return {"error": "Unknown error occurred"}

@app.route('/songs', methods=['GET'])
def get_songs():
    query = request.args.get('query', 'Believer')
    
    if not query:
        return jsonify({"error": "No song name provided"}), 400
    
    songs = fetch_song_data(query)
    if "error" in songs:
        return jsonify(songs), 400
    return jsonify(songs)

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        email = request.json.get('email')
        name = request.json.get('name', 'User')  # Default to 'User' if name is not provided
        
        if not email:
            return jsonify({"error": "Email is required"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        otp = generate_otp()
        mongo.db.users.update_one(
            {"email": email},
            {"$set": {"otp": otp, "otp_timestamp": datetime.now(), "name": name}},
            upsert=True
        )

        email_payload = {
            "receiver_email": email,
            "subject": "Your OTP for JStream",
            "message": f"Hi {name},\n\nYour OTP for JStream is: {otp}\nThis OTP will expire in 10 minutes."
        }
        
        response = requests.post(EMAIL_API_URL, json=email_payload, timeout=10)
        if response.status_code == 200:
            return jsonify({"message": "OTP sent successfully"})
        return jsonify({"error": "Failed to send OTP"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        email = request.json.get('email')
        otp = request.json.get('otp')
        if not email or not otp:
            return jsonify({"error": "Email and OTP are required"}), 400

        user = mongo.db.users.find_one({
            "email": email,
            "otp": otp,
            "otp_timestamp": {"$gte": datetime.now() - timedelta(minutes=10)}
        })
        
        if not user:
            return jsonify({"error": "Invalid or expired OTP"}), 400

        # Clear OTP after successful verification
        mongo.db.users.update_one(
            {"email": email},
            {
                "$unset": {"otp": "", "otp_timestamp": ""},
                "$set": {"last_login": datetime.now()}
            }
        )

        return jsonify({
            "message": "OTP verified successfully",
            "user_id": str(user["_id"]),
            "user_name": user.get("name", "User")  # Return the user's name
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists', methods=['POST'])
def create_playlist():
    try:
        user_id = request.json.get('user_id')
        name = request.json.get('name')
        if not user_id or not name:
            return jsonify({"error": "User ID and playlist name are required"}), 400

        # Check if playlist name already exists for this user
        existing_playlist = mongo.db.playlists.find_one({
            "user_id": user_id,
            "name": name
        })
        
        if existing_playlist:
            return jsonify({"error": "A playlist with this name already exists"}), 400

        playlist = {
            "user_id": user_id,
            "name": name,
            "songs": [],
            "created_at": datetime.now()
        }
        result = mongo.db.playlists.insert_one(playlist)

        return jsonify({
            "message": "Playlist created successfully",
            "playlist_id": str(result.inserted_id)
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/playlists/add-song', methods=['POST'])
def add_song_to_playlist():
    try:
        user_id = request.json.get('user_id')
        playlist_id = request.json.get('playlist_id')
        song_id = request.json.get('song_id')  # Keep as song_id

        if not all([user_id, playlist_id, song_id]):
            return jsonify({"error": "User ID, playlist ID, and song ID are required"}), 400

        # Verify playlist belongs to user
        playlist = mongo.db.playlists.find_one({
            "_id": ObjectId(playlist_id),
            "user_id": user_id
        })

        if not playlist:
            return jsonify({"error": "Playlist not found or unauthorized"}), 404

        # Check if song already exists in playlist
        if any(existing_song.get('id') == song_id for existing_song in playlist['songs']):
            return jsonify({"error": "Song already exists in playlist"}), 400

        # For this implementation, we'll assume the song object is already available in the frontend
        # and the complete song object is sent in the request
        song = request.json.get('song')
        if not song:
            return jsonify({"error": "Song data is required"}), 400

        # Add song to playlist
        mongo.db.playlists.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$push": {"songs": song}}
        )

        return jsonify({"message": "Song added to playlist successfully"})
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

if __name__ == '__main__':
    app.run(debug=True)