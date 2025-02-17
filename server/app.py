import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

# Function to fetch data from the API
def fetch_song_data(query):
    url = f'https://saavn.dev/api/search/songs?query={query}'
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        # Check if the response is successful
        if data.get("success"):
            songs = []
            
            for song in data['data']['results']:
                title = song.get('name')
                mp3_url = None
                thumbnail_url = None

                # Find mp3 download URL with 320k quality
                if song.get('downloadUrl'):
                    for download in song['downloadUrl']:
                        if download.get('quality') == '320kbps':
                            mp3_url = download.get('url')
                            break
                
                # Find image URL with 500x500 quality
                if song.get('image'):
                    for image in song['image']:
                        if image.get('quality') == '500x500':
                            thumbnail_url = image.get('url')
                            break
                    
                # Append song details to the list
                songs.append({
                    'title': title,
                    'mp3_url': mp3_url,
                    'thumbnail_url': thumbnail_url
                })

            return songs
        else:
            return {"error": "No results found"}
    else:
        return {"error": f"Failed to fetch data, status code {response.status_code}"}

# Route to get songs based on a query
@app.route('/songs', methods=['GET'])
def get_songs():
    query = request.args.get('query', 'Believer')  # Get 'query' parameter from the client, default to 'Believer'
    
    if not query:
        return jsonify({"error": "No song name provided"})
    
    songs = fetch_song_data(query)
    return jsonify(songs)

if __name__ == '__main__':
    app.run(debug=True)