#!/usr/bin/env python3

import json
import time

def lambda_handler(event, context):
    # Extract the movie title and description
    movie_title = event['title']
    movie_description = event['description']

    # Extract the movie ratings
    movie_ratings = event['data']['ratings']
    movie_rotten_tomatoes_rating = movie_ratings['rottentomatoes']
    movie_imdb_rating = movie_ratings['imdb']

    # Extract the movie watch time
    movie_watch_time = event['data']['watch_time']

    # Calculate the movie score
    # IMDB gets 0.4 weight
    # Rotten Tomatoes gets 0.4 weight
    # Watch time gets 0.2 weight

    movie_score = (movie_imdb_rating * 0.4) + (movie_rotten_tomatoes_rating * 0.04) + (movie_watch_time * 0.2)

    # Create a JSON object with the extracted metadata
    metadata = {
        'id': int(time.time()),
        'title': movie_title,
        'description': movie_description,
        'match_score': movie_score
    }

    # Return a response to the client with the metadata
    response = {
        'statusCode': 200,
        'body': json.dumps(metadata)
    }

    return response
