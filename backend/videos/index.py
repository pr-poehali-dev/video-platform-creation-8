import json
import os
import psycopg2
import boto3
import base64
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для работы с видео: получение списка, загрузка, просмотр"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            video_id = params.get('id')
            user_id = params.get('user_id')
            is_short = params.get('is_short')
            
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            if video_id:
                cur.execute("""
                    SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url, 
                           v.duration, v.is_short, v.views_count, v.likes_count, v.created_at,
                           u.id, u.username, u.display_name, u.avatar_url
                    FROM videos v
                    JOIN users u ON v.user_id = u.id
                    WHERE v.id = %s
                """, (video_id,))
                video = cur.fetchone()
                
                if not video:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Video not found'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': video[0],
                    'title': video[1],
                    'description': video[2],
                    'video_url': video[3],
                    'thumbnail_url': video[4],
                    'duration': video[5],
                    'is_short': video[6],
                    'views_count': video[7],
                    'likes_count': video[8],
                    'created_at': video[9].isoformat(),
                    'user': {
                        'id': video[10],
                        'username': video[11],
                        'display_name': video[12],
                        'avatar_url': video[13]
                    }
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            else:
                query = """
                    SELECT v.id, v.title, v.video_url, v.thumbnail_url, 
                           v.duration, v.is_short, v.views_count, v.created_at,
                           u.id, u.username, u.display_name, u.avatar_url
                    FROM videos v
                    JOIN users u ON v.user_id = u.id
                """
                params_list = []
                
                if user_id:
                    query += " WHERE v.user_id = %s"
                    params_list.append(user_id)
                elif is_short:
                    query += " WHERE v.is_short = true"
                
                query += " ORDER BY v.created_at DESC LIMIT 50"
                
                cur.execute(query, params_list)
                videos = cur.fetchall()
                
                result = []
                for video in videos:
                    result.append({
                        'id': video[0],
                        'title': video[1],
                        'video_url': video[2],
                        'thumbnail_url': video[3],
                        'duration': video[4],
                        'is_short': video[5],
                        'views_count': video[6],
                        'created_at': video[7].isoformat(),
                        'user': {
                            'id': video[8],
                            'username': video[9],
                            'display_name': video[10],
                            'avatar_url': video[11]
                        }
                    })
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'videos': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'upload':
                user_id = body.get('user_id')
                title = body.get('title', '').strip()
                description = body.get('description', '')
                video_base64 = body.get('video_data')
                duration = body.get('duration', 0)
                is_short = body.get('is_short', False)
                
                if not user_id or not title or not video_base64:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id, title and video_data are required'}),
                        'isBase64Encoded': False
                    }
                
                video_data = base64.b64decode(video_base64)
                
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                video_key = f'videos/{user_id}_{timestamp}.mp4'
                
                s3.put_object(
                    Bucket='files',
                    Key=video_key,
                    Body=video_data,
                    ContentType='video/mp4'
                )
                
                video_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{video_key}"
                
                conn = psycopg2.connect(dsn)
                cur = conn.cursor()
                
                cur.execute("""
                    INSERT INTO videos (user_id, title, description, video_url, duration, is_short)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, title, description, video_url, duration, is_short))
                
                video = cur.fetchone()
                conn.commit()
                
                result = {
                    'success': True,
                    'video_id': video[0],
                    'video_url': video_url,
                    'created_at': video[1].isoformat()
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
